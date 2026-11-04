'use client'

import Link from 'next/link'
import { useState, type ComponentProps } from 'react'

/**
 * Next.js normally downloads every page linked on screen, just in case: over 20 requests and 100 KB
 * on every page, from people who mostly pay for their data. This waits for a sign of intent instead,
 * a pointer resting on the link or a finger touching it, which still makes the next page feel instant.
 */
export default function SiteLink({ onMouseEnter, onTouchStart, onFocus, prefetch, ...props }: ComponentProps<typeof Link>) {
  const [intent, setIntent] = useState(false)
  return (
    <Link
      {...props}
      prefetch={intent ? (prefetch ?? null) : false}
      onMouseEnter={(event) => {
        setIntent(true)
        onMouseEnter?.(event)
      }}
      onTouchStart={(event) => {
        setIntent(true)
        onTouchStart?.(event)
      }}
      onFocus={(event) => {
        setIntent(true)
        onFocus?.(event)
      }}
    />
  )
}
