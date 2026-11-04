export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const siteName = 'Dunamis at 30'

export const tagline = 'One ministry. Thirty years. Millions of stories. One continuing legacy.'

export const defaultDescription =
  'Dunamis International Gospel Centre is 30. Join us at the Glory Dome, Abuja, on 10 November 2026, read the testimonies, and make your I Am Attending card.'

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
  { href: '/international', label: 'International Guests' },
  { href: '/contact', label: 'Contact Us' },
]

/** Desktop header: these sit in the bar, everything else lives under "More". */
export const headerLinks = ['/our-story', '/senior-pastor', '/testimonies', '/sons-of-the-prophet', '/gallery']

export const moreLinks: NavItem[] = [
  { href: '/impact', label: '30 Years of Impact' },
  { href: '/international', label: 'International Guests' },
  { href: '/contact', label: 'Contact Us' },
]

/**
 * Fallback copy and facts, used until the communications team fills the CMS.
 * Event details: dunamisgospel.org/calendar/dunamis-intl-gospel-centre-30th-anniversary
 * Campaign line "Same Mission. Greater Impact." is from the official anniversary poster.
 */
export const defaults = {
  headline: 'Same Mission. Greater Impact.',
  heroMessage:
    'Join us at the Glory Dome on 10 November 2026 as Dunamis International Gospel Centre turns 30.',
  welcome:
    'In 1996, a young couple held on to one instruction from God and started a church in Abuja. Thirty years on, we want to say thank you, and we’d love you to be there when we do.',
  eventTitle: '30th Anniversary Service',
  eventStartsAt: '2026-11-10T09:30:00+01:00',
  venue: 'The Glory Dome',
  city: 'Lord’s Garden, Airport Road, Abuja',
  officialWebsite: 'https://dunamisgospel.org',
}

/** The home page timer counts down to this. dunamisgospel.org/calendar/kingdom-power-and-glory-world-conference-2026 */
export const kpg = {
  title: 'Kingdom Power & Glory',
  startsAt: '2026-11-24T09:30:00+01:00',
  programmeUrl: 'https://dunamisgospel.org/upcoming-programs/',
}

/** Official channels linked from dunamisgospel.org — overridden by Settings → Contacts & socials. */
export const defaultSocials = [
  { platform: 'youtube', url: 'https://www.youtube.com/@dunamistvworldwide' },
  { platform: 'facebook', url: 'https://www.facebook.com/DunamisGospelHqtrs' },
  { platform: 'instagram', url: 'https://www.instagram.com/dunamisgospel/' },
  { platform: 'x', url: 'https://x.com/dunamiswrldwide' },
  { platform: 'tiktok', url: 'https://www.tiktok.com/@dunamisintlgospelcentre' },
] as const
