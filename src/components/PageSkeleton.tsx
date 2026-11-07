'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react'

import { pageLoad, usePageLoad } from '@/lib/pageLoad'

/** A page that's ready this quickly never shows a skeleton, so a fast connection sees no flash. */
const SHOW_AFTER = 120
const FADE_OUT = 200
/** Past this, the page you were on comes back. It still changes if the new one arrives. */
const GIVE_UP_AFTER = 15000

const Bone = ({ className = '' }: { className?: string }) => <span className={`bone ${className}`} />

const lines = (widths: string[]) => widths.map((width, i) => <Bone key={i} className={`h-4 ${i ? 'mt-3' : ''} ${width}`} />)

function Hero({ button = false }: { button?: boolean }) {
  return (
    <div className="container-site flex flex-col items-center pt-[130px] pb-[104px] sm:pt-[170px] sm:pb-24">
      <Bone className="h-[34px] w-[150px]" />
      <Bone className="mt-[30px] h-[clamp(2rem,1.1rem+4.2vw,4.25rem)] w-[min(92%,500px)]" />
      <Bone className="mt-[13px] h-[clamp(2rem,1.1rem+4.2vw,4.25rem)] w-[min(68%,370px)]" />
      <Bone className="mt-7 h-4 w-[min(92%,540px)]" />
      <Bone className="mt-3 h-4 w-[min(66%,380px)]" />
      {button && <Bone className="mt-8 h-[50px] w-[210px]" />}
    </div>
  )
}

/** Stands in for testimony cards, here and while a list changes on the Testimonies page. */
function TestimonyBones({ count, className = '' }: { count: number; className?: string }) {
  return (
    <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="flex h-[65px] items-center justify-between gap-3 rounded-2xl border border-hair bg-surface p-2">
            <Bone className="size-12" />
            <Bone className="h-[42px] w-[130px]" />
          </div>
          <div className="card flex min-h-[400px] flex-col p-6 sm:p-8">
            <Bone className="h-[17px] w-[21px]" />
            <Bone className="mt-6 h-7 w-[88%]" />
            <Bone className="mt-2.5 h-7 w-[58%]" />
            <div className="mt-5">{lines(['w-full', 'w-[94%]', 'w-[72%]'])}</div>
            <div className="mt-auto border-l border-hair pl-5">
              <Bone className="h-5 w-[150px]" />
              <Bone className="mt-2.5 h-4 w-[110px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Testimonies() {
  return (
    <>
      <Hero button />
      <div className="container-site">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-[1fr_170px_170px_110px]">
          <Bone className="col-span-2 h-[50px] lg:col-span-1" />
          <Bone className="h-[50px]" />
          <Bone className="h-[50px]" />
          <Bone className="col-span-2 h-[50px] lg:col-span-1" />
        </div>
        <div className="mt-5 flex gap-2 overflow-hidden sm:flex-wrap">
          {['w-[100px]', 'w-[60px]', 'w-[170px]', 'w-[180px]', 'w-[190px]', 'w-[170px]'].map((width, i) => (
            <Bone key={i} className={`h-[43px] shrink-0 ${width}`} />
          ))}
        </div>
        <TestimonyBones count={3} className="mt-8" />
      </div>
    </>
  )
}

function Stories() {
  return (
    <>
      <Hero button />
      <div className="container-site grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card flex flex-col overflow-hidden">
            <Bone className="aspect-[4/3] w-full !rounded-none" />
            <div className="p-5 sm:p-7">
              <Bone className="h-7 w-[82%]" />
              <div className="mt-4">{lines(['w-full', 'w-[90%]', 'w-[62%]'])}</div>
              <Bone className="mt-7 h-5 w-[140px]" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function Gallery() {
  return (
    <>
      <Hero />
      <div className="container-site columns-2 gap-3 sm:gap-5 lg:columns-3">
        {['aspect-[4/3]', 'aspect-[4/5]', 'aspect-square', 'aspect-[4/5]', 'aspect-[4/3]', 'aspect-square'].map((shape, i) => (
          <Bone key={i} className={`mb-3 w-full sm:mb-5 ${shape}`} />
        ))}
      </div>
    </>
  )
}

function Article() {
  return (
    <div className="container-site max-w-[860px] pt-[120px] pb-24 sm:pt-[150px]">
      <Bone className="h-5 w-[150px]" />
      <Bone className="mt-8 h-9 w-[150px]" />
      <Bone className="mt-6 h-[clamp(2.4rem,1.7rem+3vw,3.9rem)] w-[92%]" />
      <Bone className="mt-3 h-[clamp(2.4rem,1.7rem+3vw,3.9rem)] w-[56%]" />
      <Bone className="mt-5 h-4 w-[210px]" />
      <Bone className="mt-10 aspect-[16/10] w-full" />
      <div className="mt-10">{lines(['w-full', 'w-[96%]', 'w-[90%]', 'w-[68%]'])}</div>
    </div>
  )
}

/** Our Story, the Senior Pastor and Impact: words beside a large picture. */
function Feature() {
  return (
    <>
      <Hero />
      <div className="container-site grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div>
          <Bone className="h-10 w-[80%]" />
          <div className="mt-6">{lines(['w-full', 'w-[96%]', 'w-[90%]', 'w-full', 'w-[58%]'])}</div>
        </div>
        <Bone className="aspect-[4/3] w-full" />
      </div>
    </>
  )
}

function FormPage() {
  return (
    <>
      <Hero />
      <div className="container-site max-w-[760px]">
        <div className="card grid gap-7 p-6 sm:p-10">
          {['w-[120px]', 'w-[170px]', 'w-[140px]'].map((width, i) => (
            <div key={i}>
              <Bone className={`h-4 ${width}`} />
              <Bone className="mt-3 h-[50px] w-full" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function Legal() {
  return (
    <>
      <Hero />
      <div className="container-site max-w-[760px]">
        <Bone className="h-8 w-[55%]" />
        <div className="mt-6">{lines(['w-full', 'w-[96%]', 'w-[92%]', 'w-[74%]'])}</div>
        <Bone className="mt-12 h-8 w-[45%]" />
        <div className="mt-6">{lines(['w-full', 'w-[90%]', 'w-[62%]'])}</div>
      </div>
    </>
  )
}

function Home() {
  return (
    <div className="flex h-svh flex-col items-center justify-center px-5 pt-[90px] text-center">
      <div className="grid size-[min(80vw,56svh)] place-items-center rounded-full border border-hair">
        <Bone className="size-[56%] !rounded-full" />
      </div>
      <Bone className="mt-8 h-5 w-[min(84%,420px)]" />
      <Bone className="mt-8 h-[50px] w-[200px]" />
    </div>
  )
}

const skeletonFor = (path: string) => {
  if (path === '/') return <Home />
  if (path === '/testimonies') return <Testimonies />
  if (path === '/sons-of-the-prophet') return <Stories />
  if (path === '/gallery') return <Gallery />
  if (path === '/privacy' || path === '/terms') return <Legal />
  if (['/international', '/contact', '/social-card', '/attend'].includes(path)) return <FormPage />
  if (/^\/(testimonies|sons-of-the-prophet)\/./.test(path)) return <Article />
  return <Feature />
}

/**
 * Covers the page while the next one is on its way, shaped like what's coming. It sits over the page
 * rather than inside it, so the animations underneath never know it was there.
 */
export function PageSkeleton() {
  const load = usePageLoad()
  const pathname = usePathname()
  const path = load && !load.samePage ? load.path : null
  const [shown, setShown] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)

  // The new page is in.
  useLayoutEffect(() => {
    pageLoad.stop()
  }, [pathname])

  useEffect(() => {
    const stop = () => pageLoad.stop()
    window.addEventListener('popstate', stop)
    return () => window.removeEventListener('popstate', stop)
  }, [])

  useEffect(() => {
    if (!load) return
    const giveUp = setTimeout(() => pageLoad.stop(), GIVE_UP_AFTER)
    return () => clearTimeout(giveUp)
  }, [load])

  useEffect(() => {
    if (!path) return
    const wait = setTimeout(() => {
      setShown(path)
      setLeaving(false)
    }, SHOW_AFTER)
    return () => {
      clearTimeout(wait)
      setLeaving(true)
    }
  }, [path])

  useEffect(() => {
    if (!leaving) return
    const gone = setTimeout(() => {
      setShown(null)
      setLeaving(false)
    }, FADE_OUT)
    return () => clearTimeout(gone)
  }, [leaving])

  if (!shown) return null
  return (
    <div role="status" aria-label="Loading the page" className={`page-skeleton${leaving ? ' page-skeleton--out' : ''}`}>
      <div aria-hidden>{skeletonFor(shown)}</div>
    </div>
  )
}

/** The list of testimonies, while another category or page of them is on its way. */
export function ResultsLoading({ count, children }: { count: number; children: ReactNode }) {
  const load = usePageLoad()
  const params = useSearchParams()
  const waiting = Boolean(load?.samePage)
  const [late, setLate] = useState(false)

  // The new list is in.
  useLayoutEffect(() => {
    pageLoad.stop()
  }, [params])

  useEffect(() => {
    if (!waiting) return
    const wait = setTimeout(() => setLate(true), SHOW_AFTER)
    return () => {
      clearTimeout(wait)
      setLate(false)
    }
  }, [waiting])

  if (!waiting || !late) return children
  return (
    <div role="status" aria-label="Loading testimonies">
      <TestimonyBones count={count} className="mt-8" />
    </div>
  )
}
