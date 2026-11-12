// Used in link previews, the sitemap and robots.txt. The main address is the www one, because the bare
// domain redirects to it and some link previews don't follow redirects to their image.
const LIVE_SITE = 'https://www.dunamis30thanniversary.com'
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL ? LIVE_SITE : 'http://localhost:3000')).replace(/\/$/, '')

/** The picture shown when a link to the site is shared. Rendered by scripts/render-og.mjs. */
export const shareImage = { url: '/og-dunamis-30-since-1996.jpg', width: 1200, height: 630, alt: 'Dunamis at 30. Same Mission. Greater Impact.' }

export const siteName = 'Dunamis at 30'

export const tagline = 'One ministry. Thirty years. Millions of stories. One continuing legacy.'

export const defaultDescription =
  'Dunamis International Gospel Centre is 30. Join us at the Glory Dome, Abuja, for Kingdom Power & Glory, 23 to 29 November 2026, read the testimonies, and make your I Am Attending card.'

export type NavItem = { href: string; label: string }

/**
 * Main menu. No attendance registration: "I Am Attending" is the personalised card
 * generator, and the only form is for guests travelling from outside Nigeria.
 */
export const navItems: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/our-story', label: 'Our Story' },
  { href: '/senior-pastor', label: 'Our Senior Pastor' },
  { href: '/impact', label: '30 Years of Impact' },
  { href: '/testimonies', label: 'Testimonies' },
  { href: '/sons-of-the-prophet', label: 'Sons of the Prophet' },
  { href: '/gallery', label: 'Media Gallery' },
  { href: '/social-card', label: 'I Am Attending' },
  { href: '/invite', label: 'Invite Someone' },
  { href: '/international', label: 'International Guests' },
  { href: '/contact', label: 'Contact Us' },
]

/** Desktop header: these sit in the bar, everything else lives under "More". */
export const headerLinks = ['/our-story', '/senior-pastor', '/testimonies', '/sons-of-the-prophet', '/gallery']

export const moreLinks: NavItem[] = [
  { href: '/invite', label: 'Invite Someone' },
  { href: '/impact', label: '30 Years of Impact' },
  { href: '/international', label: 'International Guests' },
  { href: '/contact', label: 'Contact Us' },
]

/**
 * Fallback copy and facts, used until the communications team fills the CMS.
 * Campaign line "Same Mission. Greater Impact." is from the official anniversary poster.
 */
export const defaults = {
  headline: 'Same Mission. Greater Impact.',
  welcome:
    'In 1996, a young couple held on to one instruction from God and started a church in Abuja. Thirty years on, we want to say thank you, and we’d love you to be there when we do.',
  venue: 'The Glory Dome',
  city: 'Lord’s Garden, Airport Road, Abuja',
  officialWebsite: 'https://dunamisgospel.org',
}

/**
 * The anniversary is celebrated at this conference, and the home page timer counts down to it. The church confirmed it
 * starts on the 23rd, though dunamisgospel.org/calendar/kingdom-power-and-glory-world-conference-2026 still says the 24th.
 */
export const kpg = {
  title: 'Kingdom Power & Glory',
  dates: '23 to 29 November',
  startsAt: '2026-11-23T09:30:00+01:00',
  programmeUrl: 'https://dunamisgospel.org/upcoming-programs/',
}

/** Official channels linked from dunamisgospel.org — overridden by Settings → Contacts & socials. */
export const defaultSocials = [
  { platform: 'youtube', url: 'https://www.youtube.com/@dunamistvworldwide' },
  { platform: 'facebook', url: 'https://www.facebook.com/DunamisGospelHqtrs' },
  { platform: 'instagram', url: 'https://www.instagram.com/dunamisworldwide/' },
  { platform: 'x', url: 'https://x.com/dunamiswrldwide' },
  { platform: 'tiktok', url: 'https://www.tiktok.com/@dunamisintlgospelcentre' },
] as const
