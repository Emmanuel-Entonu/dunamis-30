import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const icon = (children: ReactNode) =>
  function Icon(props: IconProps) {
    return (
      <svg aria-hidden width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...props}>
        {children}
      </svg>
    )
  }

export const OverviewIcon = icon(
  <>
    <rect x="3.5" y="3.5" width="7" height="9" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="1.6" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="1.6" />
    <rect x="3.5" y="15.5" width="7" height="5" rx="1.6" />
  </>,
)

export const TestimonyIcon = icon(
  <>
    <path d="M20.5 11.6a8.1 8.1 0 0 1-8.3 8 8.8 8.8 0 0 1-3.5-.7L3.5 20.5l1.6-4.5a7.6 7.6 0 0 1-1-4.4 8.1 8.1 0 0 1 8.2-8 8.1 8.1 0 0 1 8.2 8Z" />
    <path d="M8.5 11.8h.01M12.2 11.8h.01M15.9 11.8h.01" strokeWidth={2.2} />
  </>,
)

export const GuestIcon = icon(<path d="m20.6 3.4-.2-.1a2.7 2.7 0 0 0-3.7.2l-3.2 3.2L5.2 4.4 3.6 6l6.6 4.2-3.4 3.4-2.7-.6-1.2 1.2 3.6 2 2 3.6 1.2-1.2-.6-2.7 3.4-3.4L16.7 19l1.6-1.6-2.3-8.3 3.2-3.2c1-1 1.1-1.8 1.4-2.5Z" />)

export const StoryIcon = icon(
  <>
    <path d="M12 6.6c-1.7-1.5-4.2-2.1-8.5-2.1v14c4.3 0 6.8.6 8.5 2.1 1.7-1.5 4.2-2.1 8.5-2.1v-14c-4.3 0-6.8.6-8.5 2.1Z" />
    <path d="M12 6.6v14" />
  </>,
)

export const WaitingIcon = icon(
  <>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 7.2V12l3.2 1.9" />
  </>,
)

export const InboxIcon = icon(
  <>
    <path d="M3.5 13.5h5l1.6 2.8h3.8l1.6-2.8h5" />
    <path d="M5.9 5.3 3.5 13.5v5a1.6 1.6 0 0 0 1.6 1.6h13.8a1.6 1.6 0 0 0 1.6-1.6v-5l-2.4-8.2a1.6 1.6 0 0 0-1.5-1.1H7.4a1.6 1.6 0 0 0-1.5 1.1Z" />
  </>,
)

export const GlobeIcon = icon(
  <>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M3.4 12h17.2M12 3.4c2.4 2.4 3.6 5.3 3.6 8.6s-1.2 6.2-3.6 8.6c-2.4-2.4-3.6-5.3-3.6-8.6s1.2-6.2 3.6-8.6Z" />
  </>,
)

export const ExternalIcon = icon(
  <>
    <path d="M14 4.5h5.5V10" />
    <path d="m19.5 4.5-8.5 8.5" />
    <path d="M18 14.5v3.6a1.4 1.4 0 0 1-1.4 1.4H5.9a1.4 1.4 0 0 1-1.4-1.4V7.4A1.4 1.4 0 0 1 5.9 6h3.6" />
  </>,
)

export const SignOutIcon = icon(
  <>
    <path d="M9.5 20.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5h3.5" />
    <path d="m15.5 16.5 4.5-4.5-4.5-4.5M20 12H9.5" />
  </>,
)

export const CloseIcon = icon(<path d="m6 6 12 12M18 6 6 18" />)

export const ChevronIcon = icon(<path d="m9.5 6 6 6-6 6" />)
