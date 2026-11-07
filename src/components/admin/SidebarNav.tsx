'use client'

import { useNav } from '@payloadcms/ui'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import crest from '@/assets/brand/crest-official.webp'
import { CloseIcon, ExternalIcon, GuestIcon, OverviewIcon, SignOutIcon, StoryIcon, TestimonyIcon } from './AdminIcons'

type Props = {
  testimonies: number | null
  guests: number | null
  stories: number | null
  person: { name: string; role: string }
}

function Item({ href, icon, label, count, active, onClick }: { href: string; icon: ReactNode; label: string; count?: number | null; active: boolean; onClick: () => void }) {
  return (
    <Link href={href} prefetch={false} onClick={onClick} aria-current={active ? 'page' : undefined} className="sb-link">
      {icon}
      <span className="sb-link__label">{label}</span>
      {Boolean(count) && <span className="sb-count">{count}</span>}
    </Link>
  )
}

export function SidebarNav({ testimonies, guests, stories, person }: Props) {
  const { hydrated, navOpen, setNavOpen } = useNav()
  const pathname = usePathname() ?? ''
  const open = hydrated && navOpen
  // Only matters on phones and tablets, where the menu slides in over the page.
  const close = () => setNavOpen(false)
  const under = (path: string) => pathname === path || pathname.startsWith(`${path}/`)

  return (
    <>
      <button type="button" aria-label="Close the menu" tabIndex={open ? 0 : -1} onClick={close} className={`sb-scrim${open ? ' sb-scrim--open' : ''}`} />
      <aside className={`sb${open ? ' sb--open' : ''}`}>
        <div className="sb-brand">
          <Image src={crest} alt="" width={40} height={45} className="sb-brand__crest" />
          <span className="sb-brand__words">
            <strong>Dunamis at 30</strong>
            <span>Dashboard</span>
          </span>
          <button type="button" aria-label="Close the menu" onClick={close} className="sb-close">
            <CloseIcon />
          </button>
        </div>

        <nav aria-label="Dashboard" className="sb-nav">
          <Item href="/admin" icon={<OverviewIcon />} label="Overview" active={pathname === '/admin' || pathname === '/admin/'} onClick={close} />

          <p className="sb-label">Submissions</p>
          {testimonies !== null && (
            <Item href="/admin/collections/testimonies?where[status][equals]=pending" icon={<TestimonyIcon />} label="Testimonies" count={testimonies} active={under('/admin/collections/testimonies')} onClick={close} />
          )}
          {guests !== null && (
            <Item href="/admin/collections/international-registrations?where[logisticsStatus][equals]=new" icon={<GuestIcon />} label="International guests" count={guests} active={under('/admin/collections/international-registrations')} onClick={close} />
          )}
          {stories !== null && (
            <Item href="/admin/collections/sons-stories?where[status][equals]=pending" icon={<StoryIcon />} label="Sons of the Prophet" count={stories} active={under('/admin/collections/sons-stories')} onClick={close} />
          )}
        </nav>

        <div className="sb-foot">
          <a href="/" target="_blank" rel="noopener noreferrer" className="sb-link">
            <ExternalIcon />
            <span className="sb-link__label">View the website</span>
          </a>
          <div className="sb-person">
            <Link href="/admin/account" prefetch={false} onClick={close} className="sb-person__who" aria-current={under('/admin/account') ? 'page' : undefined}>
              <span aria-hidden className="sb-person__mark">
                {person.name.trim().charAt(0).toUpperCase()}
              </span>
              <span className="sb-person__words">
                <strong>{person.name}</strong>
                <span>{person.role}</span>
              </span>
            </Link>
            {/* Never prefetched: a sign-out link mustn't be something a browser visits on its own */}
            <Link href="/admin/logout" prefetch={false} aria-label="Sign out" title="Sign out" className="sb-person__out">
              <SignOutIcon />
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
