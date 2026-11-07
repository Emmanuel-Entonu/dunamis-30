import { getPayloadClient } from '@/lib/content'
import { readDashboard, searchDashboard } from '@/lib/dashboardData'

export const dynamic = 'force-dynamic'

/** The overview's numbers, or a search with ?q=. Only for someone signed in, and only what their account may open. */
export async function GET(request: Request) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ error: 'Please sign in' }, { status: 401 })

  const words = new URL(request.url).searchParams.get('q')?.trim().slice(0, 80)
  try {
    const body = words === undefined ? await readDashboard(payload, user, new Date()) : words ? await searchDashboard(payload, user, words) : []
    return Response.json(body, { headers: { 'cache-control': 'private, no-store' } })
  } catch (error) {
    payload.logger.error({ err: error, msg: 'The dashboard numbers failed' })
    return Response.json({ error: 'Couldn’t load' }, { status: 500 })
  }
}
