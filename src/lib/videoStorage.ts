import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

/**
 * Videos go straight from the visitor's browser to a private Supabase bucket, because Vercel's
 * functions can't accept a file this large. The server hands out a one-time signed ticket for one
 * file, then checks the file is really there before saving anything. All of this runs on the
 * server: the service key never reaches a browser.
 */

/** Videos sent with the public forms. The bucket itself refuses anything over 50 MB. */
export const VIDEO_BUCKET = 'testimony-videos'
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024
/**
 * Videos the team adds in the dashboard. Only signed-in editors get tickets for this bucket, and it has
 * no cap of its own: it follows the project's upload limit in Supabase. The browser aims to stay under this.
 */
export const DASHBOARD_VIDEO_BUCKET = 'dashboard-videos'
export const MAX_DASHBOARD_VIDEO_BYTES = 2 * 1024 * 1024 * 1024
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

export type VideoTicket = {
  endpoint: string
  apikey: string
  bucket: string
  path: string
  token: string
  proof: string
  maxBytes: number
}

const projectUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const storageApi = () => `${projectUrl()}/storage/v1`
const serviceHeaders = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return { apikey: key, authorization: `Bearer ${key}` }
}

export const videoStorageReady = () => Boolean(projectUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

/** Dashboard videos are kept under their own folder name, so every path says which bucket it's in. */
const bucketFor = (path: string) => (path.startsWith('dashboard/') ? DASHBOARD_VIDEO_BUCKET : VIDEO_BUCKET)

const proofOf = (path: string) => createHmac('sha256', process.env.PAYLOAD_SECRET ?? '').update(`video:${path}`).digest('hex')

/** True only for a path this server issued, so a form can't claim someone else's video. */
export function isIssuedVideoPath(path: string, proof: string) {
  if (!/^videos\/[0-9a-f-]{36}$/.test(path) || !/^[0-9a-f]{64}$/.test(proof)) return false
  return timingSafeEqual(Buffer.from(proofOf(path)), Buffer.from(proof))
}

/** A signed ticket for one new file. The token is good for one upload, for two hours. */
export async function issueVideoTicket(from: 'form' | 'dashboard' = 'form'): Promise<VideoTicket> {
  const dashboard = from === 'dashboard'
  const path = `${dashboard ? 'dashboard' : 'videos'}/${randomUUID()}`
  const bucket = bucketFor(path)
  const res = await fetch(`${storageApi()}/object/upload/sign/${bucket}/${path}`, {
    method: 'POST',
    headers: { ...serviceHeaders(), 'content-type': 'application/json' },
    body: '{}',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Could not sign a video upload (${res.status})`)
  const { url } = (await res.json()) as { url: string }
  const token = new URL(url, projectUrl()).searchParams.get('token')
  if (!token) throw new Error('The signed upload had no token')
  // Supabase's storage host handles large uploads better than the main project host.
  const host = new URL(projectUrl()).hostname.replace('.supabase.co', '.storage.supabase.co')
  return {
    endpoint: `https://${host}/storage/v1/upload/resumable/sign`,
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    bucket,
    path,
    token,
    proof: proofOf(path),
    maxBytes: dashboard ? MAX_DASHBOARD_VIDEO_BYTES : MAX_VIDEO_BYTES,
  }
}

/** The stored file's size, or null when no acceptable video is there. */
export async function readVideoSize(path: string) {
  const res = await fetch(`${storageApi()}/object/info/${bucketFor(path)}/${path}`, { headers: serviceHeaders(), cache: 'no-store' })
  if (!res.ok) return null
  const info = (await res.json()) as { size?: number; content_type?: string }
  if (!info.size || !ALLOWED_TYPES.includes(info.content_type ?? '')) return null
  return info.size
}

/** A temporary link to the private file. */
export async function signedVideoUrl(path: string, seconds: number) {
  const res = await fetch(`${storageApi()}/object/sign/${bucketFor(path)}/${path}`, {
    method: 'POST',
    headers: { ...serviceHeaders(), 'content-type': 'application/json' },
    body: JSON.stringify({ expiresIn: seconds }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Could not sign a video link (${res.status})`)
  const { signedURL } = (await res.json()) as { signedURL: string }
  return `${storageApi()}${signedURL}`
}

export async function removeVideo(path: string) {
  const res = await fetch(`${storageApi()}/object/${bucketFor(path)}`, {
    method: 'DELETE',
    headers: { ...serviceHeaders(), 'content-type': 'application/json' },
    body: JSON.stringify({ prefixes: [path] }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Could not delete a video (${res.status})`)
}
