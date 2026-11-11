'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { categoryLabels } from '@/lib/categories'
import { A, Glyph, Header, Plain, Tile } from './bits'
import { backIcon, photoIcon, videoIcon } from './icons'
import { sections } from './Lists'
import { removePhoto, sendPhoto, sendVideo, type NewVideo } from './media'
import { Box, buttonSize, storyFields, testimonyFields } from './ReviewScreen'
import { api, go, refreshWhere, whyItFailed } from './store'

type Picked = { id: number; preview: string }

function PhotoPick({ label, value, onChange }: { label: string; value: Picked | null; onChange: (value: Picked | null) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  return (
    <div>
      <p className="text-[15px] font-medium">{label}</p>
      {/* eslint-disable-next-line @next/next/no-img-element -- a local preview of the file just chosen */}
      {value && <img src={value.preview} alt="" className="mt-2 max-h-[300px] rounded-[22px] object-cover" />}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          className={buttonSize}
          onClick={() => {
            if (!value) return input.current?.click()
            void removePhoto(value.id)
            onChange(null)
          }}
        >
          <Glyph icon={photoIcon} /> {busy ? 'Adding…' : value ? 'Remove this photo' : 'Choose a photo'}
        </Button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          setBusy(true)
          try {
            onChange(await sendPhoto(file, label))
          } catch {
            toast.error('That photo couldn’t be added', { description: 'Please try a JPG or PNG.' })
          } finally {
            setBusy(false)
          }
        }}
      />
    </div>
  )
}

export function AddEntry({ section: key, you }: { section: 'testimonies' | 'stories'; you: string }) {
  const section = sections[key]
  const story = key === 'stories'
  const specs = story ? storyFields : testimonyFields.filter((spec) => spec.path !== 'summary')
  const titlePath = story ? 'headline' : 'title'
  const [values, setValues] = useState<Record<string, string>>({})
  const [category, setCategory] = useState('other')
  const [photo, setPhoto] = useState<Picked | null>(null)
  const [before, setBefore] = useState<Picked | null>(null)
  const [video, setVideo] = useState<NewVideo | null>(null)
  const [work, setWork] = useState<{ words: string; share?: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [missing, setMissing] = useState(false)
  const videoInput = useRef<HTMLInputElement>(null)

  const save = async () => {
    if (!values[titlePath]?.trim()) {
      setMissing(true)
      document.getElementById(`field-${titlePath}`)?.focus()
      toast.error('Please add a title', { description: 'A title is the only thing you must fill in.' })
      return
    }
    setSaving(true)
    const data: Record<string, unknown> = {}
    for (const [path, value] of Object.entries(values)) {
      if (!value.trim()) continue
      const [head, tail] = path.split('.')
      if (tail) data[head] = { ...(data[head] as object), [tail]: value }
      else data[head] = value
    }
    if (!story) {
      data.category = category
      if (photo) data.photo = photo.id
    } else {
      if (photo) data.afterPhoto = photo.id
      if (before) data.beforePhoto = before.id
    }
    if (video) {
      data.videoFile = video.videoFile
      if (video.videoPoster) data.videoPoster = video.videoPoster
    }
    try {
      const { doc } = await api<{ doc: { id: number } }>(`/api/${section.collection}`, { method: 'POST', json: data })
      toast.success('Saved', { description: 'It’s waiting for your approval.' })
      refreshWhere((other) => other === '/dashboard/data' || other.startsWith(`/api/${section.collection}?`))
      go(`/dashboard/${key}/${doc.id}`, { replace: true })
    } catch (error) {
      toast.error('That didn’t save', { description: whyItFailed(error) })
      setSaving(false)
    }
  }

  return (
    <>
      <Header title={story ? 'Add a story' : 'Add a testimony'} you={you} />
      <div className="mt-4">
        <A back href={`/dashboard/${key}`} aria-label={`Back to ${section.title}`} className="grid size-12 place-items-center rounded-full bg-white">
          <Glyph icon={backIcon} />
        </A>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Tile className="order-2 grid grid-cols-1 gap-5 p-6 sm:p-8 xl:order-1">
          {specs.slice(0, story ? 4 : 3).map((spec) => (
            <Box
              key={spec.path}
              spec={spec}
              value={values[spec.path] ?? ''}
              problem={spec.required && missing && !values[spec.path]?.trim() ? 'Please add a title.' : undefined}
              onChange={(value) => setValues({ ...values, [spec.path]: value })}
            />
          ))}

          {!story && (
            <div className="grid gap-2">
              <Label htmlFor="field-category" className="text-[15px]">
                Type
              </Label>
              <select id="field-category" value={category} onChange={(event) => setCategory(event.target.value)} className="h-13 rounded-2xl bg-canvas px-5 text-base">
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <p className="text-[15px] font-medium">A video</p>
            {video && <video src={video.playHere} controls playsInline preload="metadata" className="mt-2 max-h-[360px] w-full rounded-[22px] bg-ink" />}
            {work && (
              <div className="mt-2">
                <p className="text-sm font-medium">{work.words}</p>
                {work.share !== undefined && <Progress value={work.share * 100} className="mt-2 h-2 rounded-[3px]" />}
              </div>
            )}
            <div className="mt-2">
              <Button
                type="button"
                variant="secondary"
                disabled={Boolean(work)}
                className={buttonSize}
                onClick={() => {
                  if (!video) return videoInput.current?.click()
                  setVideo(null)
                }}
              >
                <Glyph icon={videoIcon} /> {video ? 'Remove this video' : 'Choose a video'}
              </Button>
            </div>
            <input
              ref={videoInput}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                try {
                  setVideo(await sendVideo(file, section.collection, (words, share) => setWork({ words, share })))
                } catch (error) {
                  toast.error('The video couldn’t be added', { description: error instanceof Error ? error.message : 'Please try again.' })
                } finally {
                  setWork(null)
                }
              }}
            />
          </div>

          {story ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <PhotoPick label="Photo from before" value={before} onChange={setBefore} />
              <PhotoPick label="Photo from today" value={photo} onChange={setPhoto} />
            </div>
          ) : (
            <PhotoPick label="A photo" value={photo} onChange={setPhoto} />
          )}

          {specs.slice(story ? 4 : 3).map((spec) => (
            <Box key={spec.path} spec={spec} value={values[spec.path] ?? ''} onChange={(value) => setValues({ ...values, [spec.path]: value })} />
          ))}

          <div>
            <Button type="button" disabled={saving || Boolean(work)} className={buttonSize} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </Tile>

        <aside className="order-1 xl:sticky xl:top-8 xl:order-2 xl:self-start">
          <Tile tone="butter">
            <h2 className="text-[22px] leading-tight font-medium">Only the title is needed</h2>
            <div className="mt-2 grid gap-2">
              <Plain>Add anything else you have. If there’s no write-up, the website simply won’t show one.</Plain>
              <Plain>Saving doesn’t put it on the website. You can approve it on the next screen.</Plain>
            </div>
          </Tile>
        </aside>
      </div>
    </>
  )
}
