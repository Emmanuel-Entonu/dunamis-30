'use client'

import { useEffect } from 'react'

import { keepWatching } from '@/lib/lite'
import { pauseEndlessAnimationsOffscreen } from '@/lib/pauseOffscreen'

/** Rests animations that are off the screen, and lightens the page if this device is still struggling. */
export function PerformanceWatch() {
  useEffect(() => {
    const stopPausing = pauseEndlessAnimationsOffscreen()
    window.addEventListener('scroll', keepWatching, { passive: true })
    return () => {
      stopPausing()
      window.removeEventListener('scroll', keepWatching)
    }
  }, [])
  return null
}
