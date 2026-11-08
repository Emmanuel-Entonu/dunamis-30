// Server only: it fetches YouTube's pages, which a browser can't do.
import { unstable_cache } from 'next/cache'

import { embedUrl, isYouTubeClip } from './video'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'

/** A protobuf varint, the way YouTube packs numbers into its link data. */
function readVarint(bytes: Uint8Array, at: number) {
  let value = 0
  for (let i = at, shift = 0; i < bytes.length && shift < 64; i++, shift += 7) {
    value += (bytes[i] & 0x7f) * 2 ** shift
    if (bytes[i] < 0x80) return { value, next: i + 1 }
  }
  return null
}
const varint = (n: number) => {
  const out: number[] = []
  while (n > 127) {
    out.push((n % 128) | 0x80)
    n = Math.floor(n / 128)
  }
  out.push(n)
  return out
}

/**
 * YouTube's own link resolver: the video a clip comes from, and the part of it the clip plays. In its answer
 * the clip's start and end (milliseconds) follow the clip's id, and they're what the player's clipt holds.
 */
async function clipFromResolver(clipId: string) {
  const res = await fetch('https://www.youtube.com/youtubei/v1/navigation/resolve_url?prettyPrint=false', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': UA },
    body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion: '2.20241101.00.00', hl: 'en' } }, url: `https://www.youtube.com/clip/${clipId}` }),
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`The resolver answered ${res.status}`)
  const watch = ((await res.json()) as { endpoint?: { watchEndpoint?: { videoId?: string; params?: string } } }).endpoint?.watchEndpoint
  if (!watch?.videoId || !/^[\w-]{11}$/.test(watch.videoId)) throw new Error('No video in the resolver’s answer')
  const bytes = Buffer.from(decodeURIComponent(watch.params ?? ''), 'base64')
  const idAt = bytes.indexOf(Buffer.from(clipId))
  const after = idAt >= 0 ? idAt + clipId.length : -1
  if (after >= 0 && bytes[after] === 0x10) {
    const start = readVarint(bytes, after + 1)
    const end = start && bytes[start.next] === 0x18 ? readVarint(bytes, start.next + 1) : null
    if (start && end && end.value > start.value) {
      const clipt = Buffer.from([0x10, ...varint(start.value), 0x18, ...varint(end.value)]).toString('base64url')
      return `https://www.youtube.com/embed/${watch.videoId}?clip=${clipId}&clipt=${clipt}`
    }
  }
  // The times weren't where expected: play the whole video rather than nothing.
  return `https://www.youtube-nocookie.com/embed/${watch.videoId}`
}

/**
 * A clip, looked up once and kept for a month: first through YouTube's resolver, then through the clip's own
 * page as a fallback. A failed look-up isn't kept, so the next visit tries again.
 */
const clipPlayer = unstable_cache(
  async (clipUrl: string) => {
    const clipId = clipUrl.match(/\/clip\/([\w-]+)/)?.[1]
    if (!clipId) throw new Error('Not a clip link')
    try {
      return await clipFromResolver(clipId)
    } catch (error) {
      console.warn('[youtube] the resolver didn’t answer, trying the clip page', error)
    }
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

/**
 * A YouTube video's own thumbnail, for cards: the sharp 1280px one when YouTube has made it, otherwise the
 * 480px one every video has. That one carries black bands, which a widescreen frame crops off exactly.
 */
const bestThumbnail = unstable_cache(
  async (id: string) => {
    const sharp = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`
    const res = await fetch(sharp, { method: 'HEAD', signal: AbortSignal.timeout(5000), cache: 'no-store' }).catch(() => null)
    return res?.ok ? sharp : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
  },
  ['youtube-thumbnail'],
  { revalidate: 60 * 60 * 24 * 30 },
)

/** The thumbnail of the YouTube video a link plays (clips included), or null for anything else. */
export async function videoThumbnail(url?: string | null) {
  const player = await playableVideo(url)
  const id = player?.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/)?.[1]
  return id ? bestThumbnail(id) : null
}

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
