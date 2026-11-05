'use client'

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'

/** Rises children into view once. CSS-only animation, so it stays cheap on phones. */
export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className = '',
}: {
  children: ReactNode
  as?: ElementType
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag ref={ref} style={{ animationDelay: `${delay}ms` }} className={`${shown ? 'animate-rise' : 'reveal-wait opacity-0'} ${className}`}>
      {children}
    </Tag>
  )
}
