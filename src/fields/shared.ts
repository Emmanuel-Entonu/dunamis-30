import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionBeforeChangeHook, Endpoint, Field, TextFieldSingleValidation } from 'payload'
import { text } from 'payload/shared'

import { editorFieldOnly, hasRole } from '@/access/roles'
import { findYouTubeLink } from '@/lib/video'

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)

/** Every testimony and story needs a title, and spaces alone don't count. */
export const needsTitle: TextFieldSingleValidation = (value, args) => (value?.trim() ? text(value, args) : 'Please add a title.')

/** URL slug generated from another field when left blank. */
export const slugField = (from: string): Field => ({
  name: 'slug',
  type: 'text',
  index: true,
  unique: true,
  admin: { hidden: true },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        // An address that already exists is kept exactly as it is. Cutting it to length on a later save used to
        // drop its random ending, so two long titles that start the same ended up with the same address.
        if (typeof value === 'string' && value) return value
        const source = data?.[from]
        if (typeof source !== 'string' || !source.trim()) return value
        return `${slugify(source).slice(0, 70)}-${Math.random().toString(36).slice(2, 8)}`
      },
    ],
  },
})

export const moderationFields: Field[] = [
  {
    name: 'status',
    type: 'select',
    defaultValue: 'pending',
    required: true,
    index: true,
    options: [
      { label: 'Waiting for review', value: 'pending' },
      { label: 'On the website', value: 'approved' },
      { label: 'Rejected', value: 'rejected' },
    ],
    // Set with the Approve and Reject buttons.
    admin: { hidden: true },
  },
  {
    name: 'featured',
    type: 'checkbox',
    defaultValue: false,
    admin: { hidden: true },
  },
  {
    name: 'publishedAt',
    type: 'date',
    index: true,
    admin: { hidden: true },
  },
  {
    name: 'consentToPublish',
    type: 'checkbox',
    required: true,
    // The public forms ask for it. A reviewer adding an entry has it already.
    defaultValue: true,
    admin: { hidden: true },
  },
]

export const showNameField: Field = {
  name: 'showName',
  type: 'checkbox',
  defaultValue: true,
  label: 'Show their name on the website',
}

export const submitterFields: Field = {
  name: 'submitter',
  type: 'group',
  label: 'Their contact details',
  access: { read: editorFieldOnly, update: editorFieldOnly },
  admin: { description: 'Private. Never shown on the website.' },
  fields: [
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
  ],
}

/** A video sent with a submission. The file lives in a private bucket and is only ever reached through /watch. */
export const uploadedVideoFields: Field[] = [
  {
    name: 'hasVideo',
    type: 'checkbox',
    defaultValue: false,
    index: true,
    label: 'Video',
    admin: { readOnly: true, hidden: true, components: { Cell: '/components/admin/Cells#YesNo' } },
  },
  {
    name: 'videoFile',
    type: 'group',
    admin: { hidden: true },
    fields: [
      { name: 'path', type: 'text', access: { read: editorFieldOnly } },
      { name: 'sizeBytes', type: 'number' },
      { name: 'durationSec', type: 'number' },
      { name: 'width', type: 'number' },
      { name: 'height', type: 'number' },
    ],
  },
  { name: 'videoPoster', type: 'upload', relationTo: 'media', admin: { hidden: true } },
]

type SubmissionDoc = Record<string, unknown> & {
  status?: string
  slug?: string | null
  videoFile?: { path?: string | null } | null
  videoPoster?: unknown
  videoUrl?: string | null
  publishedAt?: string | null
}

const mediaIds = (doc: SubmissionDoc, fields: string[]) =>
  fields
    .map((field) => {
      const value = doc[field] as number | { id?: number } | null | undefined
      return typeof value === 'object' ? value?.id : value
    })
    .filter((id): id is number => typeof id === 'number')

/** Stamps publishedAt the first time something is approved, and keeps hasVideo accurate. */
export const prepareSubmission: CollectionBeforeChangeHook = ({ data, originalDoc, context, req }) => {
  const before = (originalDoc ?? {}) as SubmissionDoc
  const status = data.status ?? before.status
  if (status === 'approved' && !data.publishedAt && !before.publishedAt) data.publishedAt = new Date().toISOString()
  // A video stays with its submission once saved, so no ordinary save takes it off or swaps it by accident.
  // The one way off is an admin's Remove video (removeVideoEndpoint below).
  const removing = context?.removeVideo === true && hasRole(req.user as never, 'admin')
  if (before.videoFile?.path && !removing) {
    data.videoFile = before.videoFile
    data.videoPoster = before.videoPoster
  }
  const file = data.videoFile !== undefined ? data.videoFile : before.videoFile
  const link = data.videoUrl !== undefined ? data.videoUrl : before.videoUrl
  // A YouTube link pasted into the words plays on the page too, so it counts as a video.
  const now = (key: string) => (data[key] !== undefined ? data[key] : before[key])
  const story = (now('story') ?? {}) as Record<string, string | null | undefined>
  const pasted = findYouTubeLink(now('summary') as string, now('body') as string, now('appreciation') as string, story.before, story.encounter, story.transformation, story.today, story.meaning)
  data.hasVideo = Boolean(file?.path || link || pasted)
  return data
}

/** Publishes or hides a submission's photos with it, removes a replaced photo or video, and refreshes the public pages. */
export const afterSubmissionChange =
  ({ mediaFields, basePath, tag }: { mediaFields: string[]; basePath: string; tag: string }): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, req }) => {
    const now = doc as SubmissionDoc
    const before = (previousDoc ?? {}) as SubmissionDoc
    const ids = mediaIds(now, mediaFields)
    const approved = now.status === 'approved'
    const wasApproved = before.status === 'approved'

    if (ids.length && (approved || wasApproved)) {
      await req.payload.update({
        collection: 'media',
        where: { and: [{ id: { in: ids } }, { fromSubmission: { equals: true } }, { pendingReview: { equals: approved } }] },
        data: { pendingReview: !approved },
        depth: 0,
        overrideAccess: true,
        req,
      })
    }

    // A photo or video cover taken off a submission goes for good. Nobody's picture stays in storage after it's removed.
    const dropped = mediaIds(before, mediaFields).filter((id) => !ids.includes(id))
    if (dropped.length) {
      await req.payload.delete({ collection: 'media', where: { and: [{ id: { in: dropped } }, { fromSubmission: { equals: true } }] }, overrideAccess: true, req })
    }

    const oldVideo = before.videoFile?.path
    if (oldVideo && oldVideo !== now.videoFile?.path) {
      const { removeVideo } = await import('@/lib/videoStorage')
      await removeVideo(oldVideo).catch((error: unknown) => req.payload.logger.error({ err: error, msg: 'Could not remove a replaced video' }))
    }

    if (approved || wasApproved) {
      try {
        const { revalidatePath, revalidateTag } = await import('next/cache')
        revalidateTag(tag, { expire: 0 })
        revalidatePath(basePath)
        if (now.slug) revalidatePath(`${basePath}/${now.slug}`)
      } catch {
        // Outside a request (a script, for example). The pages refresh on their own within a minute.
      }
    }
    return doc
  }

/** Deleting a submission also deletes its video and the photos that came with it. */
export const afterSubmissionDelete =
  (mediaFields: string[]): CollectionAfterDeleteHook =>
  async ({ doc, req }) => {
    const submission = doc as SubmissionDoc
    if (submission.videoFile?.path) {
      const { removeVideo } = await import('@/lib/videoStorage')
      await removeVideo(submission.videoFile.path).catch((error: unknown) => req.payload.logger.error({ err: error, msg: 'Could not remove a deleted video' }))
    }
    const ids = mediaIds(submission, mediaFields)
    if (ids.length) {
      await req.payload.delete({ collection: 'media', where: { and: [{ id: { in: ids } }, { fromSubmission: { equals: true } }] }, overrideAccess: true, req })
    }
    return doc
  }

/**
 * Lets an admin take the video off a testimony or story: the uploaded file (the change hook above deletes it
 * from storage, with its cover picture), a video link, and any YouTube link pasted into the words, which would
 * otherwise still play. Their words, photos and everything else stay.
 */
export const removeVideoEndpoint = (collection: 'testimonies' | 'sons-stories', texts: string[]): Endpoint => ({
  path: '/:id/remove-video',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user as never, 'admin')) return Response.json({ error: 'Only an admin can remove a video.' }, { status: 403 })
    const id = Number(req.routeParams?.id)
    const found = Number.isInteger(id) ? await req.payload.findByID({ collection, id, depth: 0, overrideAccess: true, disableErrors: true, req }) : null
    if (!found) return Response.json({ error: 'This isn’t here any more.' }, { status: 404 })
    const doc = found as unknown as Record<string, unknown>
    const { withoutYouTubeLinks } = await import('@/lib/video')
    const strip = (text: unknown) => (typeof text === 'string' && findYouTubeLink(text) ? withoutYouTubeLinks(text) : undefined)
    const data: Record<string, unknown> = {
      videoFile: { path: null, sizeBytes: null, durationSec: null, width: null, height: null },
      videoPoster: null,
      videoUrl: null,
    }
    for (const field of texts.filter((path) => !path.includes('.'))) {
      const clean = strip(doc[field])
      if (clean !== undefined) data[field] = clean
    }
    for (const group of new Set(texts.filter((path) => path.includes('.')).map((path) => path.split('.')[0]))) {
      const current = { ...((doc[group] as Record<string, unknown> | null) ?? {}) }
      let changed = false
      for (const path of texts.filter((p) => p.startsWith(`${group}.`))) {
        const key = path.slice(group.length + 1)
        const clean = strip(current[key])
        if (clean !== undefined) {
          current[key] = clean
          changed = true
        }
      }
      if (changed) data[group] = current
    }
    const saved = await req.payload.update({ collection, id, data, depth: 1, overrideAccess: true, context: { removeVideo: true }, req })
    return Response.json({ doc: saved })
  },
})

/** Lets an editor upload a video from the dashboard, straight to the dashboard's own bucket. */
export const videoTicketEndpoint: Endpoint = {
  path: '/video-ticket',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user as never, 'admin', 'editor')) return Response.json({ error: 'Not allowed' }, { status: 403 })
    const { issueVideoTicket } = await import('@/lib/videoStorage')
    return Response.json(await issueVideoTicket('dashboard'))
  },
}

export const registrationReference = (prefix: string) => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(7))
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
  return `${prefix}-${code}`
}
