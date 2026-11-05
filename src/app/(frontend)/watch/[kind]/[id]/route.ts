import { hasRole } from '@/access/roles'
import { getPayloadClient } from '@/lib/content'
import { signedVideoUrl } from '@/lib/videoStorage'

const collections = { testimony: 'testimonies', story: 'sons-stories' } as const

const LINK_LIFETIME_SECONDS = 6 * 60 * 60
const notFound = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })

/**
 * The only way to reach a video. Approved videos are open to everyone. A video waiting for review
 * opens only for a signed-in editor. Either way the browser is sent on to a temporary link, so the
 * file itself comes straight from storage and this server never has to carry it.
 */
export async function GET(request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params
  const collection = collections[kind as keyof typeof collections]
  if (!collection || !/^\d+$/.test(id)) return notFound()

  try {
    const payload = await getPayloadClient()
    const doc = await payload.findByID({ collection, id: Number(id), depth: 0, overrideAccess: true, disableErrors: true, select: { status: true, videoFile: true } })
    const path = doc?.videoFile?.path
    if (!path) return notFound()

    const approved = doc.status === 'approved'
    if (!approved) {
      const { user } = await payload.auth({ headers: request.headers })
      if (!hasRole(user as never, 'admin', 'editor')) return notFound()
    }

    const location = await signedVideoUrl(path, LINK_LIFETIME_SECONDS)
    if (new URL(request.url).searchParams.get('link') === '1') return Response.json({ url: location }, { headers: { 'Cache-Control': 'private, no-store' } })

    return new Response(null, {
      status: 302,
      headers: {
        Location: location,
        // Sharing the redirect briefly saves work at busy moments. Taking a video down stops new views within ten minutes.
        'Cache-Control': approved ? 'public, max-age=300, s-maxage=600' : 'private, no-store',
      },
    })
  } catch (error) {
    console.error('[watch] could not open a video', error)
    return new Response('Unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
