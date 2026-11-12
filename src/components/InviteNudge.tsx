'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import envelope from '@/assets/invite/envelope.webp'
import { Close } from '@/components/icons'
import Link from '@/components/SiteLink'
import { Toaster } from '@/components/ui/sonner'
import { INVITED_KEY } from '@/lib/invite'

/** Seconds on the site, counted only while the page is in front of the visitor. */
const FIRST = 25
const BETWEEN = 150
const MOST_PER_VISIT = 3
/** Once someone has made an invitation, the reminders rest for this long. */
const REST_AFTER_INVITING = 3 * 24 * 60 * 60 * 1000
const STATE = 'dunamis-invite-nudge'
const ID = 'invite-someone'

type State = { seen: number; next: number; shown: number }

const read = (): State => {
  try {
    return { seen: 0, next: FIRST, shown: 0, ...JSON.parse(sessionStorage.getItem(STATE) ?? '{}') }
  } catch {
    return { seen: 0, next: FIRST, shown: 0 }
  }
}
const write = (state: State) => {
  try {
    sessionStorage.setItem(STATE, JSON.stringify(state))
  } catch {
    // Private browsing: it simply starts again on the next page load.
  }
}
const invitedLately = () => {
  try {
    return Date.now() - Number(localStorage.getItem(INVITED_KEY) ?? 0) < REST_AFTER_INVITING
  } catch {
    return false
  }
}

function NudgeCard({ onInvite, onLater }: { onInvite: () => void; onLater: () => void }) {
  return (
    <div className="invite-nudge relative isolate w-full overflow-hidden rounded-[20px] border border-[#e6bf72] bg-[linear-gradient(135deg,#fffaf0_0%,#fbefd6_55%,#f2dcae_100%)] p-4 pr-11 text-left font-sans min-[601px]:w-[var(--width)] sm:p-5 sm:pr-12">
      <span aria-hidden className="invite-nudge-shine pointer-events-none absolute inset-y-0 left-0 -z-10 w-2/5 bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      <div className="flex items-center gap-3.5 sm:gap-4">
        <Image src={envelope} alt="" sizes="104px" className="invite-nudge-envelope w-[86px] shrink-0 sm:w-[104px]" />
        <div className="min-w-0">
          <p className="text-[17px] leading-snug font-semibold text-balance text-[#17130c] sm:text-lg">Invite someone to Dunamis at 30</p>
          <p className="mt-1 text-[15px] leading-snug text-[#4d4130]">Put your name on an invitation and send it to a friend.</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/invite" onClick={onInvite} className="btn btn-primary !min-h-[42px] !px-4 !py-2 !text-[15px]">
              Invite someone
            </Link>
            <button type="button" onClick={onLater} className="text-[15px] font-medium text-[#6b5a3a] underline-offset-4 hover:underline">
              Not now
            </button>
          </div>
        </div>
      </div>
      <button type="button" onClick={onLater} aria-label="Close" className="absolute top-2.5 right-2.5 grid size-9 place-items-center rounded-full text-[#6b5a3a] transition-colors hover:bg-black/[0.06]">
        <Close width={18} height={18} />
      </button>
    </div>
  )
}

/**
 * Every so often, a toast asks the visitor to invite someone. It waits until they've had time to look
 * around, never interrupts a dialog or the invitation page itself, and stops once they've made one.
 * `?nudge` in the address shows it straight away, for checking how it looks.
 */
export function InviteNudge() {
  const pathname = usePathname()
  const path = useRef(pathname)
  useEffect(() => {
    path.current = pathname
    if (pathname.startsWith('/invite')) toast.dismiss(ID)
  }, [pathname])

  useEffect(() => {
    let state = read()
    const free = () =>
      !path.current.startsWith('/invite') &&
      !path.current.startsWith('/social-card') &&
      !document.querySelector('[aria-modal="true"]') &&
      document.documentElement.style.overflow !== 'hidden' &&
      document.visibilityState === 'visible'

    const show = () => {
      const later = (wait: number) => {
        toast.dismiss(ID)
        state = { ...state, next: Math.max(state.next, state.seen + wait) }
        write(state)
      }
      const mobile = window.matchMedia('(max-width: 600px)').matches
      toast.custom(() => <NudgeCard onInvite={() => toast.dismiss(ID)} onLater={() => later(BETWEEN * 2)} />, {
        id: ID,
        duration: 16000,
        position: mobile ? 'bottom-center' : 'bottom-right',
      })
    }

    const asked = new URLSearchParams(window.location.search).has('nudge')
    const quick = asked ? window.setTimeout(show, 1500) : 0

    const tick = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      state = { ...state, seen: state.seen + 1 }
      if (state.seen >= state.next) {
        if (state.shown >= MOST_PER_VISIT || invitedLately()) state = { ...state, next: Number.MAX_SAFE_INTEGER }
        else if (!free()) state = { ...state, next: state.seen + 8 }
        else {
          show()
          state = { ...state, shown: state.shown + 1, next: state.seen + BETWEEN }
        }
      }
      write(state)
    }, 1000)

    return () => {
      window.clearInterval(tick)
      window.clearTimeout(quick)
    }
  }, [])

  return <Toaster position="bottom-right" offset={24} mobileOffset={12} visibleToasts={1} gap={12} style={{ '--width': '460px' } as React.CSSProperties} />
}
