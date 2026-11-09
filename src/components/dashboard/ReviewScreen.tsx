'use client'

import { useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { categoryLabels } from '@/lib/categories'
import { embedUrl, findYouTubeLink } from '@/lib/video'
import { A, Glyph, Header, longDate, Tile } from './bits'
import { backIcon, letterIcon, penIcon, phoneIcon, photoIcon, trashIcon, videoIcon } from './icons'
import { detailUrl, sections } from './Lists'
import { sendPhoto, sendVideo } from './media'
import { api, go, refreshWhere, setData, useData, whyItFailed } from './store'

type MediaDoc = { id: number; url?: string | null; sizes?: { hero?: { url?: string | null }; card?: { url?: string | null } } }

export type Doc = Record<string, unknown> & {
  id: number
  status?: string
  slug?: string | null
  name?: string | null
  location?: string | null
  showName?: boolean | null
  hasVideo?: boolean | null
  videoUrl?: string | null
  videoFile?: { path?: string | null; durationSec?: number | null; sizeBytes?: number | null } | null
  submitter?: { email?: string | null; phone?: string | null } | null
  createdAt?: string
}

type Change = (patch: Record<string, unknown>, words: string) => Promise<void>

const photoUrl = (media: unknown) => {
  if (!media || typeof media !== 'object') return ''
  const m = media as MediaDoc
  return m.sizes?.hero?.url || m.sizes?.card?.url || m.url || ''
}

export const buttonSize = 'h-12 rounded-2xl px-6 text-[15px]'

const textOf = (doc: Doc, path: string) => {
  const value = path.split('.').reduce<unknown>((at, part) => (at as Record<string, unknown> | undefined)?.[part], doc)
  return typeof value === 'string' ? value.trim() : ''
}

const nested = (values: Record<string, string>) => {
  const out: Record<string, unknown> = {}
  for (const [path, value] of Object.entries(values)) {
    const [head, tail] = path.split('.')
    if (tail) out[head] = { ...(out[head] as object), [tail]: value }
    else out[head] = value
  }
  return out
}

export type FieldSpec = { path: string; label: string; long?: boolean; required?: boolean }

export const testimonyFields: FieldSpec[] = [
  { path: 'title', label: 'Title', required: true },
  { path: 'name', label: 'Who it’s from' },
  { path: 'location', label: 'Where they’re from' },
  { path: 'summary', label: 'In short', long: true },
  { path: 'body', label: 'Their testimony', long: true },
]

export const storyFields: FieldSpec[] = [
  { path: 'headline', label: 'Title', required: true },
  { path: 'name', label: 'Who it’s from' },
  { path: 'location', label: 'Where they’re based' },
  { path: 'currentRole', label: 'What they do today' },
  { path: 'story.before', label: 'Who they were before Dunamis', long: true },
  { path: 'story.encounter', label: 'Their journey and encounter', long: true },
  { path: 'story.transformation', label: 'How they were transformed', long: true },
  { path: 'story.today', label: 'Where they are today', long: true },
  { path: 'story.meaning', label: 'What Dunamis means to them', long: true },
]

export function Box({ spec, value, onChange, problem }: { spec: FieldSpec; value: string; onChange: (value: string) => void; problem?: string }) {
  const id = `field-${spec.path.replace(/\W/g, '-')}`
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-[15px]">
        {spec.label}
        {spec.required && <span className="text-destructive"> *</span>}
      </Label>
      {spec.long ? (
        <Textarea id={id} rows={5} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-[20px] border-0 bg-canvas p-4 text-base shadow-none" />
      ) : (
        <Input id={id} value={value} aria-invalid={Boolean(problem)} onChange={(event) => onChange(event.target.value)} className="h-13 rounded-2xl border-0 bg-canvas px-5 text-base shadow-none" />
      )}
      {problem && <p className="text-sm font-medium text-destructive">{problem}</p>}
    </div>
  )
}

/** A video link, such as a YouTube clip pasted into a testimony, playing right here. Clips are looked up by the server. */
function LinkPlayer({ url }: { url: string }) {
  const direct = embedUrl(url)
  const { data, failed } = useData<{ embed: string | null }>(direct ? null : `/dashboard/video-link?url=${encodeURIComponent(url)}`)
  const src = direct ?? data?.embed
  if (src)
    return (
      <div className="aspect-video w-full overflow-hidden rounded-[22px] bg-ink">
        <iframe src={src} title="Their video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full" />
      </div>
    )
  if (!failed && data === undefined) return <Skeleton className="aspect-video w-full rounded-[22px]" />
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-[15px] font-medium underline">
      Watch their video on YouTube
    </a>
  )
}

/**
 * The video to watch, and a way to add one if there isn't one. An ordinary save never takes a video off or
 * swaps it. Only an admin can remove one (removeVideo), and an uploaded video is then deleted for good.
 */
function useVideo(section: 'testimonies' | 'stories', doc: Doc, change: Change, removeVideo: (() => Promise<boolean>) | null) {
  const kind = section === 'testimonies' ? 'testimony' : 'story'
  const hasFile = Boolean(doc.videoFile?.path)
  const { data: link, failed } = useData<{ url: string }>(hasFile ? `/watch/${kind}/${doc.id}?link=1` : null)
  const input = useRef<HTMLInputElement>(null)
  const [playing, setPlaying] = useState('')
  const [work, setWork] = useState<{ words: string; share?: number } | null>(null)
  const [removing, setRemoving] = useState(false)
  const source = playing || link?.url
  const shown = hasFile || Boolean(playing)
  // A video link, or a YouTube link pasted into their words, plays here too.
  const pasted = doc.videoUrl || findYouTubeLink(...['summary', 'body', 'story.before', 'story.encounter', 'story.transformation', 'story.today', 'story.meaning', 'appreciation'].map((path) => textOf(doc, path)))

  const pick = async (file?: File) => {
    if (!file) return
    try {
      const sent = await sendVideo(file, sections[section].collection, (words, share) => setWork({ words, share }))
      setWork({ words: 'Saving…' })
      await change({ videoFile: sent.videoFile, videoPoster: sent.videoPoster }, 'Video added')
      setPlaying(sent.playHere)
    } catch (error) {
      toast.error('The video couldn’t be added', { description: error instanceof Error ? error.message : 'Please try again.' })
    } finally {
      setWork(null)
    }
  }

  const player = (
    <>
      {shown ? (
        source ? (
          <video key={source} src={source} controls playsInline preload="metadata" className="max-h-[480px] w-full rounded-[22px] bg-ink" />
        ) : failed ? (
          <p className="rounded-[22px] bg-canvas p-5 text-[15px] text-soft">The video couldn’t be loaded just now. Please reload this page.</p>
        ) : (
          <Skeleton className="h-[280px] rounded-[22px]" />
        )
      ) : pasted ? (
        <LinkPlayer url={pasted} />
      ) : null}
      {work && (
        <div>
          <p className="text-sm font-medium">{work.words}</p>
          {work.share !== undefined && <Progress value={work.share * 100} className="mt-2 h-2 rounded-[3px]" />}
        </div>
      )}
    </>
  )

  const remover =
    removeVideo && (shown || pasted) ? (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="secondary" disabled={removing || Boolean(work)} className={buttonSize}>
            <Glyph icon={trashIcon} /> {removing ? 'Removing…' : 'Remove video'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-[28px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this video?</AlertDialogTitle>
            <AlertDialogDescription>
              It comes off the website. An uploaded video is deleted for good and can’t be brought back. Their words and photos stay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl"
              onClick={async () => {
                setRemoving(true)
                if (await removeVideo()) setPlaying('')
                setRemoving(false)
              }}
            >
              Remove video
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ) : null

  const tools = shown ? (
    remover
  ) : (
    <>
      {remover}
      <Button type="button" variant="secondary" disabled={Boolean(work)} className={buttonSize} onClick={() => input.current?.click()}>
        <Glyph icon={videoIcon} /> Add a video
      </Button>
      <input
        ref={input}
        type="file"
        accept="video/*"
        aria-label="Video file"
        className="hidden"
        onChange={(event) => {
          void pick(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </>
  )

  return { player, tools }
}

function usePhoto(label: string, short: string, media: unknown, field: string, change: Change) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const url = photoUrl(media)

  const pick = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      const { id } = await sendPhoto(file, label)
      await change({ [field]: id }, 'Photo added')
    } catch {
      toast.error('That photo couldn’t be added', { description: 'Please try a JPG or PNG.' })
    } finally {
      setBusy(false)
    }
  }

  const picture = url ? (
    <figure>
      {/* eslint-disable-next-line @next/next/no-img-element -- private until approved, so it can't go through the image optimiser */}
      <img src={url} alt={label} className="max-h-[440px] w-full rounded-[22px] object-cover" />
      <figcaption className="mt-2 text-sm text-soft">{label}</figcaption>
    </figure>
  ) : null

  const tools = (
    <>
      <Button type="button" variant="secondary" disabled={busy} className={buttonSize} onClick={() => input.current?.click()}>
        <Glyph icon={photoIcon} /> {busy ? 'Adding…' : url ? `Change ${short}` : `Add ${short}`}
      </Button>
      {url && (
        <Button type="button" variant="secondary" className={buttonSize} onClick={() => void change({ [field]: null }, 'Photo removed')}>
          Remove {short}
        </Button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        aria-label={label}
        className="hidden"
        onChange={(event) => {
          void pick(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </>
  )

  return { picture, tools }
}

function Words({ label, text }: { label: string; text: string }) {
  if (!text) return null
  return (
    <section>
      <h3 className="text-sm font-semibold">{label}</h3>
      <div className="mt-2 grid gap-3 text-[17px] leading-[1.65] [overflow-wrap:anywhere]">
        {text.split(/\n{2,}|\r\n\r\n/).map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </section>
  )
}

/** The testimony's type, changed right here. It decides which group the testimony is in on the website. */
function TypePicker({ value, change }: { value: string; change: Change }) {
  const [saving, setSaving] = useState<string | null>(null)
  const shown = saving ?? (categoryLabels[value] ? value : 'other')
  return (
    <div>
      <dt>
        <label htmlFor="field-type" className="text-[13.5px] text-soft">
          Type
        </label>
      </dt>
      <dd className="mt-1">
        <select
          id="field-type"
          value={shown}
          disabled={saving !== null}
          onChange={async (event) => {
            const next = event.target.value
            setSaving(next)
            await change({ category: next }, `Moved to ${categoryLabels[next]}`)
            setSaving(null)
          }}
          className="h-12 w-full rounded-2xl bg-canvas px-4 text-[15.5px] font-medium disabled:opacity-70"
        >
          {Object.entries(categoryLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </dd>
    </div>
  )
}

const Fact = ({ label, children }: { label: string; children: ReactNode }) =>
  children ? (
    <div>
      <dt className="text-[13.5px] text-soft">{label}</dt>
      <dd className="text-[15.5px] font-medium [overflow-wrap:anywhere]">{children}</dd>
    </div>
  ) : null

function Decision({ status, busy, liveHref, onDecide }: { status: string; busy: string | null; liveHref?: string; onDecide: (status: 'approved' | 'rejected') => void }) {
  const approved = status === 'approved'
  const rejected = status === 'rejected'
  return (
    <Tile tone={approved ? 'teal' : rejected ? 'pink' : 'butter'}>
      <h2 className="text-[24px] leading-tight font-medium">{busy ? (busy === 'approved' ? 'Approving…' : 'Saving…') : approved ? 'On the website' : rejected ? 'Rejected' : 'Waiting for your review'}</h2>
      <p className="mt-1.5 text-[15px] text-soft">
        {approved ? (
          liveHref ? (
            <a href={liveHref} target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline">
              See it on the website
            </a>
          ) : (
            'Anyone can see this on the website.'
          )
        ) : rejected ? (
          'This isn’t on the website. You can still approve it.'
        ) : (
          'Approve puts it on the website straight away.'
        )}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {!approved && (
          <Button className={buttonSize} disabled={Boolean(busy)} onClick={() => onDecide('approved')}>
            Approve
          </Button>
        )}
        {!rejected && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={Boolean(busy)} className={`${buttonSize} border-0 bg-white shadow-none hover:bg-white`}>
                {approved ? 'Take it off the website' : 'Reject'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[28px]">
              <AlertDialogHeader>
                <AlertDialogTitle>{approved ? 'Take this off the website?' : 'Reject this?'}</AlertDialogTitle>
                <AlertDialogDescription>{approved ? 'People won’t be able to see it any more. You can approve it again at any time.' : 'It won’t appear on the website. You can still approve it later.'}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-2xl">Keep it</AlertDialogCancel>
                <AlertDialogAction className="rounded-2xl" onClick={() => onDecide('rejected')}>
                  {approved ? 'Take it off' : 'Reject'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </Tile>
  )
}

function Review({ section: key, doc, url, you, canDelete }: { section: 'testimonies' | 'stories'; doc: Doc; url: string; you: string; canDelete: boolean }) {
  const section = sections[key]
  const story = key === 'stories'
  const specs = story ? storyFields : testimonyFields
  const [busy, setBusy] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string> | null>(null)
  const [saving, setSaving] = useState(false)

  const everywhere = () => refreshWhere((other) => other === '/dashboard/data' || other.startsWith(`/api/${section.collection}?`))

  const save = async (patch: Record<string, unknown>) => {
    const { doc: saved } = await api<{ doc: Doc }>(`${url}`, { method: 'PATCH', json: patch })
    setData<Doc>(url, () => saved)
    everywhere()
  }

  const change: Change = async (patch, words) => {
    try {
      await save(patch)
      toast.success(words)
    } catch (error) {
      toast.error('That didn’t save', { description: whyItFailed(error) })
    }
  }

  // Only an admin can take a video off. An uploaded one is deleted from storage with its cover; the words stay.
  const removeVideo = async () => {
    try {
      const { doc: saved } = await api<{ doc: Doc }>(`/api/${section.collection}/${doc.id}/remove-video`, { method: 'POST', json: {} })
      setData<Doc>(url, () => saved)
      everywhere()
      toast.success('Video removed', { description: 'It’s off the website, and an uploaded video is deleted.' })
      return true
    } catch (error) {
      toast.error('The video couldn’t be removed', { description: whyItFailed(error) })
      return false
    }
  }

  const video = useVideo(key, doc, change, canDelete ? removeVideo : null)
  const photo = usePhoto('Their photo', 'a photo', doc.photo, 'photo', change)
  const beforePhoto = usePhoto('Their photo from before', 'the before photo', doc.beforePhoto, 'beforePhoto', change)
  const afterPhoto = usePhoto('Their photo today', 'today’s photo', doc.afterPhoto, 'afterPhoto', change)

  const decide = async (status: 'approved' | 'rejected') => {
    setBusy(status)
    try {
      await save({ status })
      if (status === 'approved') toast.success('Approved', { description: 'It’s on the website now.' })
      else toast('Rejected', { description: 'It isn’t on the website.' })
    } catch (error) {
      toast.error('That didn’t save', { description: whyItFailed(error) })
    } finally {
      setBusy(null)
    }
  }

  const saveWords = async () => {
    if (!draft) return
    if (!draft[story ? 'headline' : 'title']?.trim()) {
      toast.error('Please add a title')
      return
    }
    setSaving(true)
    try {
      await save(nested(draft))
      setDraft(null)
      toast.success('Changes saved')
    } catch (error) {
      toast.error('That didn’t save', { description: whyItFailed(error) })
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    try {
      await api(`/api/${section.collection}/${doc.id}`, { method: 'DELETE' })
      toast.success('Deleted')
      everywhere()
      go(`/dashboard/${key}`)
    } catch {
      toast.error('That couldn’t be deleted', { description: 'Please try again.' })
    }
  }

  const words = story ? (
    <>
      <Words label="Who they were before Dunamis" text={textOf(doc, 'story.before')} />
      <Words label="Their journey and encounter" text={textOf(doc, 'story.encounter')} />
      <Words label="How they were transformed" text={textOf(doc, 'story.transformation')} />
      <Words label="Where they are today" text={textOf(doc, 'story.today')} />
      <Words label="What Dunamis means to them" text={textOf(doc, 'story.meaning')} />
      <Words label="Their message of appreciation" text={textOf(doc, 'appreciation')} />
    </>
  ) : (
    <>
      <Words label="In short" text={textOf(doc, 'summary')} />
      <Words label="Their testimony" text={textOf(doc, 'body')} />
    </>
  )
  const hasWords = specs.some((spec) => spec.long && textOf(doc, spec.path)) || Boolean(textOf(doc, 'appreciation'))

  return (
    <>
      <Header title={<span className="line-clamp-2">{textOf(doc, story ? 'headline' : 'title')}</span>} you={you} />
      <div className="mt-4 flex items-center gap-3">
        <A href={`/dashboard/${key}`} aria-label={`Back to ${section.title}`} className="grid size-12 shrink-0 place-items-center rounded-full bg-white">
          <Glyph icon={backIcon} />
        </A>
        <p className="text-[15px] text-soft">Received {longDate(doc.createdAt)}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-6">
        <div className="order-2 min-w-0 xl:order-1">
          <Tile className="grid grid-cols-1 gap-7 p-6 sm:p-8">
            {video.player}
            {story ? (
              (beforePhoto.picture || afterPhoto.picture) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {beforePhoto.picture}
                  {afterPhoto.picture}
                </div>
              )
            ) : (
              photo.picture
            )}
            {draft ? (
              <div className="grid gap-5">
                {specs.map((spec) => (
                  <Box key={spec.path} spec={spec} value={draft[spec.path] ?? ''} onChange={(value) => setDraft({ ...draft, [spec.path]: value })} />
                ))}
                <div className="flex flex-wrap gap-2">
                  <Button className={buttonSize} disabled={saving} onClick={() => void saveWords()}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>
                  <Button variant="secondary" className={buttonSize} onClick={() => setDraft(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : hasWords ? (
              words
            ) : doc.hasVideo ? null : (
              <p className="text-[15px] text-soft">There’s no write-up, so the website won’t show one.</p>
            )}
            {!draft && (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" className={buttonSize} onClick={() => setDraft(Object.fromEntries(specs.map((spec) => [spec.path, textOf(doc, spec.path)])))}>
                  <Glyph icon={penIcon} /> Fix a spelling mistake
                </Button>
                {video.tools}
                {story ? (
                  <>
                    {beforePhoto.tools}
                    {afterPhoto.tools}
                  </>
                ) : (
                  photo.tools
                )}
              </div>
            )}
          </Tile>
        </div>

        {/* On a phone these fall around the words: the decision first, the details after. */}
        <aside className="contents xl:sticky xl:top-8 xl:order-2 xl:grid xl:content-start xl:gap-4 xl:self-start">
          <div className="order-1 xl:order-none">
            <Decision status={doc.status ?? 'pending'} busy={busy} liveHref={doc.slug ? `${story ? '/sons-of-the-prophet' : '/testimonies'}/${doc.slug}` : undefined} onDecide={(status) => void decide(status)} />
          </div>
          <div className="order-3 xl:order-none">
            <Tile>
              <dl className="grid gap-3">
                <Fact label="From">{doc.name || 'No name given'}</Fact>
                <Fact label="Where">{doc.location}</Fact>
                {story ? <Fact label="Today">{textOf(doc, 'currentRole')}</Fact> : <TypePicker value={textOf(doc, 'category')} change={change} />}
              </dl>
              {doc.showName === false && <p className="mt-3 rounded-2xl bg-butter p-3 text-sm font-medium">They asked for their name not to be shown on the website.</p>}
            </Tile>
          </div>
          {(doc.submitter?.email || doc.submitter?.phone) && (
            <div className="order-4 xl:order-none">
              <Tile tone="lilac">
                <h3 className="text-[17px] font-medium">How to reach them</h3>
                <p className="mt-0.5 text-[13.5px] text-soft">Private. Never shown on the website.</p>
                <div className="mt-3 grid gap-2 text-[15px] font-medium">
                  {doc.submitter?.email && (
                    <a href={`mailto:${doc.submitter.email}`} className="flex items-center gap-2 break-all">
                      <Glyph icon={letterIcon} /> {doc.submitter.email}
                    </a>
                  )}
                  {doc.submitter?.phone && (
                    <a href={`tel:${doc.submitter.phone}`} className="flex items-center gap-2">
                      <Glyph icon={phoneIcon} /> {doc.submitter.phone}
                    </a>
                  )}
                </div>
              </Tile>
            </div>
          )}
          {/* An entry with an uploaded video can't be deleted outright: an admin removes the video first. */}
          {canDelete && !doc.videoFile?.path && (
            <div className="order-5 xl:order-none">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="h-11 justify-start rounded-2xl px-4 text-soft">
                    <Glyph icon={trashIcon} /> Delete this for good
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[28px]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this for good?</AlertDialogTitle>
                    <AlertDialogDescription>This can’t be undone. Its photos and video go too.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-2xl">Keep it</AlertDialogCancel>
                    <AlertDialogAction className="rounded-2xl" onClick={() => void remove()}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}

export function ReviewScreen({ section: key, id, you, canDelete }: { section: 'testimonies' | 'stories'; id: string; you: string; canDelete: boolean }) {
  const section = sections[key]
  const url = detailUrl(section, id)
  const { data: doc, failed } = useData<Doc>(url)

  if (doc) return <Review section={key} doc={doc} url={url} you={you} canDelete={canDelete} />
  if (failed) {
    return (
      <>
        <Header title="This isn’t here any more" you={you} />
        <A href={`/dashboard/${key}`} aria-label={`Back to ${section.title}`} className="mt-6 grid size-12 place-items-center rounded-full bg-white">
          <Glyph icon={backIcon} />
        </A>
      </>
    )
  }
  return (
    <>
      <Header title={<Skeleton className="h-12 w-[300px] max-w-full rounded-2xl bg-white" />} you={you} />
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-[460px] rounded-[28px] bg-white" />
        <div className="grid content-start gap-4">
          <Skeleton className="h-[190px] rounded-[28px] bg-white" />
          <Skeleton className="h-[160px] rounded-[28px] bg-white" />
        </div>
      </div>
    </>
  )
}
