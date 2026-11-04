/** Turns a YouTube or Vimeo link into an embeddable player URL (null for other hosts). */
export function embedUrl(url?: string | null) {
  if (!url) return null
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\.|^m\./, '')
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`
    if (host === 'youtube.com') {
      const id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]+)/)?.[1]
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
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
