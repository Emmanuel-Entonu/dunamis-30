'use client'

import Link from '@/components/SiteLink'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { headerLinks, moreLinks, navItems } from '@/lib/site'
import { ArrowRight, ChevronDown } from './icons'
import { Logo } from './Logo'

/** Floating glass navbar: inset from the edges, rounded, blurred; the mobile menu drops from it. */
export function SiteHeader() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Moving to another page closes any open menu.
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setMenuOpen(false)
    setMoreOpen(false)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setMenuOpen(false)
      setMoreOpen(false)
    }
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [])

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))
  const link = (href: string) =>
    `rounded-lg px-3 py-2 text-[15px] whitespace-nowrap transition-colors ${isActive(href) ? 'text-gold' : 'text-fg/85 hover:bg-white/[0.06] hover:text-fg'}`

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-5 sm:px-5">
      <div
        data-nav
        className={`relative mx-auto flex h-[60px] max-w-[1200px] items-center justify-between gap-4 rounded-2xl border pr-2 pl-4 backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300 lg:h-[66px] lg:pl-5 ${
          scrolled || menuOpen
            ? 'border-white/[0.12] bg-[#0f0f0f]/80 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]'
            : 'border-white/[0.08] bg-[#0f0f0f]/45'
        }`}
      >
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-0.5 xl:flex">
          <Link href="/" className={link('/')} aria-current={isActive('/') ? 'page' : undefined}>
            Home
          </Link>
          {navItems
            .filter((item) => headerLinks.includes(item.href))
            .map((item) => (
              <Link key={item.href} href={item.href} className={link(item.href)} aria-current={isActive(item.href) ? 'page' : undefined}>
                {item.label.replace('Our Senior Pastor', 'Senior Pastor')}
              </Link>
            ))}
          <div ref={moreRef} className="relative">
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls="more-menu"
              onClick={() => setMoreOpen((v) => !v)}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[15px] transition-colors ${
                moreLinks.some((l) => isActive(l.href)) ? 'text-gold' : 'text-fg/85 hover:bg-white/[0.06] hover:text-fg'
              }`}
            >
              More
              <ChevronDown width={16} height={16} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
              id="more-menu"
              className={`absolute top-[calc(100%+14px)] right-0 w-64 rounded-2xl border border-white/[0.12] bg-[#0f0f0f]/95 p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-[opacity,transform,visibility] duration-200 ${
                moreOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'
              }`}
            >
              {moreLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  tabIndex={moreOpen ? 0 : -1}
                  className={`block rounded-xl px-4 py-2.5 text-[15px] transition-colors hover:bg-white/[0.06] ${isActive(item.href) ? 'text-gold' : 'text-fg'}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-1.5">
          <Link href="/social-card" className="btn btn-primary hidden !min-h-[44px] !px-5 !text-[15px] sm:inline-flex">
            I Am Attending
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="grid size-11 place-items-center rounded-xl text-fg transition-colors hover:bg-white/[0.06] xl:hidden"
          >
            <span className="relative block h-3.5 w-6">
              <span className={`absolute left-0 h-0.5 w-6 rounded bg-current transition-all duration-300 ${menuOpen ? 'top-1.5 rotate-45' : 'top-0'}`} />
              <span className={`absolute top-1.5 left-0 h-0.5 rounded bg-current transition-all duration-300 ${menuOpen ? 'w-0 opacity-0' : 'w-6'}`} />
              <span className={`absolute left-0 h-0.5 w-6 rounded bg-current transition-all duration-300 ${menuOpen ? 'top-1.5 -rotate-45' : 'top-3'}`} />
            </span>
          </button>
        </div>

        {/* Mobile / tablet menu: a floating panel under the bar */}
        <div
          id="site-menu"
          className={`absolute inset-x-0 top-[calc(100%+8px)] max-h-[calc(100svh-96px)] overflow-y-auto rounded-2xl border border-white/[0.12] bg-[#0f0f0f]/95 p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-[opacity,transform,visibility] duration-300 xl:hidden ${
            menuOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'
          }`}
        >
          <nav aria-label="Mobile">
            <ul>
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    tabIndex={menuOpen ? 0 : -1}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-[17px] transition-colors hover:bg-white/[0.06] ${
                      isActive(item.href) ? 'text-gold' : 'text-fg'
                    }`}
                  >
                    {item.label}
                    <ArrowRight width={16} height={16} className="text-white/30" />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-2 grid gap-2 p-2">
              <Link href="/social-card" tabIndex={menuOpen ? 0 : -1} className="btn btn-primary">
                I Am Attending
              </Link>
              <Link href="/international" tabIndex={menuOpen ? 0 : -1} className="btn btn-outline">
                Coming From Outside Nigeria?
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
