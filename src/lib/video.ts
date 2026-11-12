/** A YouTube link anywhere in some text, such as one pasted into a testimony. */
const YOUTUBE_LINK = /https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/[^\s<>"'()[\]]+/i

/** The first YouTube link in any of these texts, without trailing punctuation. */
export function findYouTubeLink(...texts: (string | null | undefined)[]) {
  for (const text of texts) {
    const match = text?.match(YOUTUBE_LINK)
    if (match) return match[0].replace(/[.,;:!?]+$/, '')
  }
  return null
}

/** The text with its YouTube links taken out, for when the video is shown as a player instead. */
export const withoutYouTubeLinks = (text?: string | null) =>
  (text ?? '')
    .replace(new RegExp(YOUTUBE_LINK.source, 'gi'), '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

/** A clip is a part of a longer video. Its link alone doesn't say which video, so the server looks it up. */
export const isYouTubeClip = (url?: string | null) => {
  if (!url) return false
  try {
    // Checked as an address, not as text: "youtube.com/clip/" inside some other site's address must not pass.
    const u = new URL(url)
    return /^https?:$/.test(u.protocol) && /^(?:www\.|m\.)?youtube\.com$/i.test(u.hostname) && /^\/clip\/[\w-]+\/?$/.test(u.pathname)
  } catch {
    return false
  }
}

/** Seconds from a YouTube start time: 90, 90s or 1m30s. */
function startSeconds(value: string | null) {
  if (!value) return 0
  if (/^\d+$/.test(value)) return Number(value)
  const m = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0
}

/** Turns a YouTube or Vimeo link into an embeddable player URL (null for other hosts, and for clips not yet looked up). */
export function embedUrl(url?: string | null) {
  if (!url) return null
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\.|^m\./, '')
    const start = startSeconds(u.searchParams.get('t') ?? u.searchParams.get('start'))
    const at = start ? `?start=${start}` : ''
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      return /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}${at}` : null
    }
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/)?.[1]
      if (!id || !/^[\w-]{11}$/.test(id)) return null
      // A clip once looked up: the video, plus which part of it to play.
      const clip = u.searchParams.get('clip')
      const clipt = u.searchParams.get('clipt')
      if (clip && clipt) return `https://www.youtube.com/embed/${id}?clip=${encodeURIComponent(clip)}&clipt=${encodeURIComponent(clipt)}`
      return `https://www.youtube-nocookie.com/embed/${id}${at}`
    }
    if (host === 'vimeo.com') {
      const id = u.pathname.match(/^\/(\d+)/)?.[1]
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
  } catch {
    // not a URL
  }
  return null
}
