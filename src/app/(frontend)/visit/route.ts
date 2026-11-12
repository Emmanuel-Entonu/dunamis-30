import { getPayloadClient } from '@/lib/content'
import { recordEvent } from '@/lib/siteEvents'
import { underLimit } from '@/lib/spam'

const nothing = () => new Response(null, { status: 204 })

/** One anonymous count per device per day, sent by VisitCount. It answers the same whatever happens: a count must never get in the way. */
export async function POST(request: Request) {
  const site = request.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin') return nothing()
  if (/bot|crawl|spider|slurp|preview/i.test(request.headers.get('user-agent') ?? '')) return nothing()
  // A real visitor counts once a day, so a handful from one address is already plenty.
  if (!(await underLimit('visit', 12))) return nothing()
  try {
    const first = (await request.text()) === 'first'
    await recordEvent(await getPayloadClient(), 'visit', request.headers, first)
  } catch {
    // A missed count costs nothing.
  }
  return nothing()
}
