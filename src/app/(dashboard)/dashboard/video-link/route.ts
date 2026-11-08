import { getPayloadClient } from '@/lib/content'
import { playableVideo } from '@/lib/youtube'

export const dynamic = 'force-dynamic'

/**
 * The player for a video link a reviewer is looking at, such as a YouTube clip pasted into a testimony.
 * A browser can't look a clip up itself, so this does it. Only for someone signed in.
 */
export async function GET(request: Request) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ error: 'Please sign in' }, { status: 401 })
  const url = new URL(request.url).searchParams.get('url')?.slice(0, 600) ?? ''
  if (!/^https:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be|vimeo\.com)\//i.test(url)) return Response.json({ embed: null })
  return Response.json({ embed: await playableVideo(url) }, { headers: { 'cache-control': 'private, max-age=3600' } })
}
