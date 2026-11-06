'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * A Google map costs about 500 KB of data and slows the page down while it starts. A browser's own
 * lazy loading still fetches it from screens away, so this waits until someone is about to reach it.
 */
export function LazyMap({ title, src, className }: { title: string; src: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setNear(true)
        watcher.disconnect()
      },
      { rootMargin: '400px 0px' },
    )
    watcher.observe(el)
    return () => watcher.disconnect()
  }, [])

  return (
    <div ref={box} className="absolute inset-0">
      {near && <iframe title={title} src={src} referrerPolicy="no-referrer-when-downgrade" className={className} />}
    </div>
  )
}
