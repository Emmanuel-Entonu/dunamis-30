'use client'

import Image from 'next/image'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { hasRole } from '@/access/roles'
import crest from '@/assets/brand/crest-official.webp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { DashboardData } from '@/lib/dashboardData'
import { cn } from '@/lib/utils'
import { AddEntry } from './AddEntry'
import { A, Glyph } from './bits'
import { GuestScreen } from './GuestScreen'
import { bookIcon, chatIcon, eyeIcon, logoutIcon, overviewIcon, planeIcon } from './icons'
import { listUrl, sections, SectionList } from './Lists'
import { Overview } from './Overview'
import { ReviewScreen } from './ReviewScreen'
import { api, forgetAll, go, refresh, useData, useLocation } from './store'

type Me = { user: { id: number; name?: string | null; username?: string | null; email?: string | null; roles?: ('admin' | 'editor' | 'logistics')[] | null } | null }
type User = NonNullable<Me['user']>

function SignIn() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      await api('/api/users/login', { method: 'POST', json: { username: username.trim(), password } })
      await refresh('/api/users/me', { force: true })
    } catch {
      toast.error('Those sign-in details aren’t right', { description: 'Please check them and try again.' })
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="grid w-full max-w-[880px] overflow-hidden rounded-[36px] bg-white md:grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-5 bg-butter p-10 text-center">
          <Image src={crest} alt="Dunamis International Gospel Centre 30th Anniversary, since 1996" priority sizes="200px" className="h-auto w-[170px]" />
          <p className="text-[26px] leading-tight font-medium">Dunamis at 30</p>
        </div>
        <form onSubmit={submit} className="flex flex-col justify-center gap-5 p-8 sm:p-12">
          <h1 className="text-[34px] leading-tight font-medium tracking-[-0.01em]">Sign in</h1>
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} className="h-13 rounded-2xl bg-canvas px-5 text-base" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-13 rounded-2xl bg-canvas px-5 text-base" />
          </div>
          <Button type="submit" disabled={busy} className="mt-1 h-13 rounded-2xl text-base">
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </main>
  )
}

const navItems = [
  { key: '', label: 'Overview', icon: overviewIcon, allowed: () => true },
  { key: 'testimonies', label: 'Testimonies', icon: chatIcon, allowed: (user: User) => hasRole(user, 'admin', 'editor') },
  { key: 'guests', label: 'Guests', icon: planeIcon, allowed: (user: User) => hasRole(user, 'admin', 'logistics') },
  { key: 'stories', label: 'Stories', icon: bookIcon, allowed: (user: User) => hasRole(user, 'admin', 'editor') },
]

function NavLink({ item, active, waiting, stacked }: { item: (typeof navItems)[number]; active: boolean; waiting: number; stacked: boolean }) {
  return (
    <A
      href={`/dashboard${item.key ? `/${item.key}` : ''}`}
      aria-current={active ? 'page' : undefined}
      aria-label={item.label}
      className={cn('group relative flex flex-col items-center', stacked && 'gap-1.5')}
    >
      <span className={cn('grid place-items-center rounded-full transition-colors', stacked ? 'size-14' : 'size-12', active ? 'bg-ink text-white' : 'text-ink group-hover:bg-canvas')}>
        <Glyph icon={item.icon} className="size-6" />
      </span>
      {stacked && (
        <span className={cn('text-xs', active ? 'font-semibold' : 'font-medium text-soft')}>
          {item.label}
          {waiting > 0 && ` (${waiting > 99 ? '99+' : waiting})`}
        </span>
      )}
      {!stacked && waiting > 0 && <span className="absolute top-0 right-0 text-[11px] font-bold text-ink">{waiting > 99 ? '99+' : waiting}</span>}
    </A>
  )
}

function Shell({ user }: { user: User }) {
  const where = useLocation()
  const { data } = useData<DashboardData>('/dashboard/data')
  const [path, query = ''] = where.split('?')
  const [section = '', id] = path.replace(/^\/dashboard\/?/, '').split('/').filter(Boolean)
  const you = user.name || user.username || user.email || 'You'
  const items = navItems.filter((item) => item.allowed(user))

  // Everything people go to next loads now, quietly, so moving around never waits.
  useEffect(() => {
    if (hasRole(user, 'admin', 'editor')) {
      void refresh(listUrl(sections.testimonies, 'pending', 24))
      void refresh(listUrl(sections.stories, 'pending', 24))
    }
    if (hasRole(user, 'admin', 'logistics')) void refresh(listUrl(sections.guests, 'new', 24))
  }, [user])

  const signOut = async () => {
    await api('/api/users/logout', { method: 'POST' }).catch(() => undefined)
    forgetAll()
    go('/dashboard')
    await refresh('/api/users/me', { force: true })
  }

  const waitingFor = (key: string) => (key === 'testimonies' ? (data?.testimonies?.pending ?? 0) : key === 'stories' ? (data?.stories?.pending ?? 0) : key === 'guests' ? (data?.guests?.new ?? 0) : 0)
  const canOpen = (key: 'testimonies' | 'stories' | 'guests') => items.some((item) => item.key === key)

  let screen = <Overview you={you} />
  if ((section === 'testimonies' || section === 'stories') && canOpen(section)) {
    if (id === 'new') screen = <AddEntry section={section} you={you} />
    else if (id) screen = <ReviewScreen key={`${section}-${id}`} section={section} id={id} you={you} canDelete={hasRole(user, 'admin')} />
    else screen = <SectionList section={section} query={query} you={you} />
  } else if (section === 'guests' && canOpen('guests')) {
    screen = id ? <GuestScreen key={id} id={id} you={you} /> : <SectionList section="guests" query={query} you={you} />
  }

  return (
    <TooltipProvider delayDuration={100}>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[112px] flex-col items-center bg-white py-7 lg:flex">
        <A href="/dashboard" aria-label="Overview">
          <Image src={crest} alt="" priority sizes="64px" className="h-auto w-[58px]" />
        </A>
        <nav aria-label="Sections" className="my-auto flex flex-col items-center gap-6">
          {items.map((item) => (
            <NavLink key={item.key} item={item} active={section === item.key} waiting={waitingFor(item.key)} stacked />
          ))}
        </nav>
        <div className="flex flex-col items-center gap-2">
          <a href="/" target="_blank" rel="noopener noreferrer" aria-label="View the website" className="grid size-12 place-items-center rounded-full text-ink hover:bg-canvas">
            <Glyph icon={eyeIcon} className="size-6" />
          </a>
          <button type="button" aria-label="Sign out" onClick={signOut} className="grid size-12 place-items-center rounded-full text-ink hover:bg-canvas">
            <Glyph icon={logoutIcon} className="size-6" />
          </button>
        </div>
      </aside>

      <nav aria-label="Sections" className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-[22px] bg-white p-1.5 shadow-[0_10px_30px_-10px_#00000040] lg:hidden">
        {items.map((item) => (
          <NavLink key={item.key} item={item} active={section === item.key} waiting={waitingFor(item.key)} stacked={false} />
        ))}
        <button type="button" aria-label="Sign out" onClick={signOut} className="grid size-12 place-items-center rounded-full text-ink">
          <Glyph icon={logoutIcon} className="size-6" />
        </button>
      </nav>

      <main className="lg:pl-[112px]">
        <div className="mx-auto max-w-[1400px] px-4 pt-6 pb-28 sm:px-8 lg:px-12 lg:pt-10 lg:pb-14">{screen}</div>
      </main>
    </TooltipProvider>
  )
}

function Starting() {
  return (
    <div aria-label="Loading" className="lg:pl-[112px]">
      <div className="fixed inset-y-0 left-0 hidden w-[112px] bg-white lg:block" />
      <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-8 lg:px-12 lg:pt-10">
        <Skeleton className="h-14 w-[320px] rounded-2xl bg-white" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-[210px] rounded-[28px] bg-white" />
          <Skeleton className="h-[210px] rounded-[28px] bg-white" />
        </div>
      </div>
    </div>
  )
}

export function App() {
  const { data: me, failed } = useData<Me>('/api/users/me')
  if (!me && !failed) return <Starting />
  if (!me?.user) return <SignIn />
  return <Shell user={me.user} />
}
