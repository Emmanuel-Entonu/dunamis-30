import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionBeforeChangeHook, Endpoint, Field } from 'payload'

import { editorFieldOnly, hasRole } from '@/access/roles'

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)

/** URL slug generated from another field when left blank. */
export const slugField = (from: string): Field => ({
  name: 'slug',
  type: 'text',
  index: true,
  unique: true,
  admin: { position: 'sidebar', description: 'Generated automatically. Used in the shareable link.' },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (value) return slugify(value)
        const source = data?.[from]
        if (typeof source !== 'string') return value
        return `${slugify(source)}-${Math.random().toString(36).slice(2, 6)}`
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
      { label: 'Pending review', value: 'pending' },
      { label: 'Approved / published', value: 'approved' },
      { label: 'Rejected', value: 'rejected' },
    ],
    admin: { position: 'sidebar' },
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
    admin: { position: 'sidebar' },
  },
  {
    name: 'consentToPublish',
    type: 'checkbox',
    required: true,
    admin: { position: 'sidebar' },
  },
  {
    name: 'showName',
    type: 'checkbox',
    defaultValue: true,
    admin: { position: 'sidebar', description: 'Display the person’s name publicly.' },
  },
]

export const submitterFields: Field = {
  name: 'submitter',
  type: 'group',
  access: { read: editorFieldOnly, update: editorFieldOnly },
  admin: { description: 'Private — never shown on the website.' },
  fields: [
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
  ],
}

/** A video sent with a submission. The file lives in a private bucket and is only ever reached through /watch. */
export const uploadedVideoFields = (kind: 'testimony' | 'story'): Field[] => [
  {
    name: 'videoReview',
    type: 'ui',
    admin: { components: { Field: { path: '/components/admin/VideoReview#VideoReview', clientProps: { kind } } } },
  },
  {
    name: 'hasVideo',
    type: 'checkbox',
    defaultValue: false,
    index: true,
    label: 'Has a video',
    admin: { readOnly: true, position: 'sidebar' },
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
export const prepareSubmission: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const before = (originalDoc ?? {}) as SubmissionDoc
  const status = data.status ?? before.status
  if (status === 'approved' && !data.publishedAt && !before.publishedAt) data.publishedAt = new Date().toISOString()
  const file = data.videoFile !== undefined ? data.videoFile : before.videoFile
  const link = data.videoUrl !== undefined ? data.videoUrl : before.videoUrl
  data.hasVideo = Boolean(file?.path || link)
  return data
}

/** Publishes or hides a submission's photos with it, removes a replaced video, and refreshes the public pages. */
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

/** Lets an editor upload a video from the admin, straight to storage. */
export const videoTicketEndpoint: Endpoint = {
  path: '/video-ticket',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user as never, 'admin', 'editor')) return Response.json({ error: 'Not allowed' }, { status: 403 })
    const { issueVideoTicket } = await import('@/lib/videoStorage')
    return Response.json(await issueVideoTicket())
  },
}

export const registrationReference = (prefix: string) => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(7))
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
  return `${prefix}-${code}`
}
