import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = (props: IconProps) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
})

export const ArrowRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)
export const Play = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
  </svg>
)
export const Menu = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </svg>
)
export const Close = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)
/** An envelope with its flap closed by a round button. */
export const Envelope = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="m3.6 6.4 8.4 6.1 8.4-6.1" />
    <circle cx="12" cy="12.5" r="1.9" fill="currentColor" stroke="none" />
  </svg>
)
export const Share = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="18" cy="5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="19" r="2.5" />
    <path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" />
  </svg>
)
export const Link2 = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
    <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
  </svg>
)
export const MapPin = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
)
export const Calendar = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
)
export const Globe = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
  </svg>
)
/** Four-point sparkle — the site's recurring ✦ motif. */
export const Sparkle = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M12 1.5c.5 5.6 4.9 10 10.5 10.5-5.6.5-10 4.9-10.5 10.5-.5-5.6-4.9-10-10.5-10.5C7.1 11.5 11.5 7.1 12 1.5Z" />
  </svg>
)
export const Flame = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.2 3.4-8.3.2-.6.9-.8 1.3-.3 1 1.3 1.3 2.7 1.3 3.8 1.2-.8 2-2.4 2-4.2 0-.6.7-1 1.2-.6 2.4 1.9 4.3 5.3 4.3 8.9 0 4-3 6.9-7 6.9Z" />
    <path d="M12 21c-1.7 0-2.8-1.2-2.8-2.8 0-1.8 1.5-2.7 2.1-4.2.8 1 2.1 1.7 2.8 2.9.9 1.6-.1 4.1-2.1 4.1Z" />
  </svg>
)
export const BookOpen = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 6.5C10.2 5 7.6 4.5 4 4.8v13c3.6-.3 6.2.2 8 1.7 1.8-1.5 4.4-2 8-1.7v-13c-3.6-.3-6.2.2-8 1.7Z" />
    <path d="M12 6.5v13" />
  </svg>
)
export const Crown = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m3.5 8 4.3 3.6L12 5l4.2 6.6L20.5 8l-1.8 9.5H5.3L3.5 8Z" />
    <path d="M5.5 20.5h13" />
  </svg>
)
export const Heart = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />
  </svg>
)
export const CrossIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3v18M7 8.5h10" />
  </svg>
)
export const ChevronDown = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)
export const ChevronLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m15 6-6 6 6 6" />
  </svg>
)
export const ChevronRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m9 6 6 6-6 6" />
  </svg>
)
export const Quote = (p: IconProps) => (
  <svg {...base(p)} viewBox="0 0 32 24" fill="currentColor" stroke="none">
    <path d="M0 24V14.4C0 6.2 4.6 1.4 12.2 0l1.3 3.4C9.4 4.6 7.4 7.4 7.2 11H13v13H0Zm18.6 0V14.4C18.6 6.2 23.2 1.4 30.8 0l1.2 3.4C28 4.6 26 7.4 25.8 11h5.8v13h-13Z" />
  </svg>
)

const brand = (p: IconProps) => ({ ...base(p), fill: 'currentColor', stroke: 'none' })

export const WhatsApp = (p: IconProps) => (
  <svg {...brand(p)}>
    <path d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.4 4.8 5-1.3A9.8 9.8 0 1 0 12 2.2Zm0 17.9a8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.1 8.1 0 1 1 12 20.1Zm4.5-6c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3Z" />
  </svg>
)
export const Facebook = (p: IconProps) => (
  <svg {...brand(p)}>
    <path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.2-1.4 1.5-1.4h1.5V4.5a20 20 0 0 0-2.3-.1c-2.2 0-3.7 1.4-3.7 3.9v2.2H8v3h2.5V21h3Z" />
  </svg>
)
export const XLogo = (p: IconProps) => (
  <svg {...brand(p)}>
    <path d="M17.5 3h3.1l-6.8 7.7L21.8 21h-6.2l-4.9-6.4L5.1 21H2l7.3-8.3L1.6 3H8l4.4 5.8L17.5 3Zm-1.1 16.2h1.7L7.2 4.7H5.4l11 14.5Z" />
  </svg>
)
export const Instagram = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" />
  </svg>
)
export const YouTube = (p: IconProps) => (
  <svg {...brand(p)}>
    <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.7 19 12 19 12 19s6.3 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
  </svg>
)
export const TikTok = (p: IconProps) => (
  <svg {...brand(p)}>
    <path d="M16.6 3h-3.1v12.2a2.7 2.7 0 1 1-2.7-2.7c.3 0 .6 0 .8.1V9.4a5.9 5.9 0 1 0 5 5.8V9.1a7.4 7.4 0 0 0 4.3 1.4V7.4A4.3 4.3 0 0 1 16.6 3Z" />
  </svg>
)

export const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: YouTube,
  x: XLogo,
  tiktok: TikTok,
  whatsapp: WhatsApp,
} as const
