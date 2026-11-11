import { getPayloadClient } from '@/lib/content'
import { readReport } from '@/lib/dashboardReport'

export const dynamic = 'force-dynamic'

/** Everything since the first day, for the statistics PDF. Only for someone signed in, and only what their account may open. */
export async function GET(request: Request) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ error: 'Please sign in' }, { status: 401 })
  try {
    return Response.json(await readReport(payload, user, new Date()), { headers: { 'cache-control': 'private, no-store' } })
  } catch (error) {
    payload.logger.error({ err: error, msg: 'The statistics report failed' })
    return Response.json({ error: 'Couldn’t load the statistics' }, { status: 500 })
  }
}
