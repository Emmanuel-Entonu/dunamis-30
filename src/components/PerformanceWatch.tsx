'use client'

import { useEffect } from 'react'

import { keepWatching } from '@/lib/lite'

/** Watches how smoothly the page scrolls, and lightens it if this device is struggling. */
export function PerformanceWatch() {
  useEffect(() => {
    window.addEventListener('scroll', keepWatching, { passive: true })
    return () => window.removeEventListener('scroll', keepWatching)
  }, [])
  return null
}
