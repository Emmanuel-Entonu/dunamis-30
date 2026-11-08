// Server only: it fetches YouTube's pages, which a browser can't do.
import { unstable_cache } from 'next/cache'

import { embedUrl, isYouTubeClip } from './video'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'

/**
 * A clip's own page names the video and the part to play, in its preview tags. Looked up once and kept for
 * a month. A failed look-up isn't kept, so the next visit tries again.
 */
const clipPlayer = unstable_cache(
  async (clipUrl: string) => {
    const res = await fetch(clipUrl, {
      headers: { 'user-agent': UA, 'accept-language': 'en-GB,en;q=0.9', cookie: 'CONSENT=YES+1; SOCS=CAI' },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`The clip page answered ${res.status}`)
    const html = await res.text()
    const found = html.match(/<meta property="og:video:url" content="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&')
    const player = embedUrl(found)
    if (!player) throw new Error('No video on the clip page')
    return player
  },
  ['youtube-clip-player'],
  { revalidate: 60 * 60 * 24 * 30 },
)

/** An embeddable player for a YouTube or Vimeo link, clips included. Null when it can't be played here. */
export async function playableVideo(url?: string | null) {
  if (!url) return null
  if (!isYouTubeClip(url)) return embedUrl(url)
  try {
    return await clipPlayer(url.split(/[?#]/)[0])
  } catch (error) {
    console.error('[youtube] could not open a clip', error)
    return null
  }
}
