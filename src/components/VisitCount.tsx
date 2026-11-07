'use client'

import { useEffect } from 'react'

const SEEN = 'dunamis-visit'

/**
 * Tells the dashboard someone came. Once a day per device, so people are counted rather than page
 * views. It remembers the last day on this device, which is all it keeps: no cookie, no name. The
 * local preview doesn't count, because it runs against the real database.
 */
export function VisitCount() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    try {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date())
      const last = localStorage.getItem(SEEN)
      if (last === today) return
      localStorage.setItem(SEEN, today)
      void fetch('/visit', { method: 'POST', keepalive: true, body: last ? 'back' : 'first' }).catch(() => undefined)
    } catch {
      // Private browsing can refuse storage. That visit simply isn't counted.
    }
  }, [])
  return null
}
