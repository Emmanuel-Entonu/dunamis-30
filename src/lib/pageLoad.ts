import { useSyncExternalStore } from 'react'

/**
 * The page someone has just asked for, while it's on its way. Pages are only fetched once they're
 * wanted, so on a phone connection there's a wait after a tap. SiteLink reports each move the moment
 * it happens, which lets a skeleton show at once, with no trip to the server first.
 */
export type PageLoad = { path: string; samePage: boolean }

let current: PageLoad | null = null
const listeners = new Set<() => void>()
const tell = () => listeners.forEach((listener) => listener())

export const pageLoad = {
  start(href: string) {
    const next = new URL(href, window.location.href)
    const samePage = next.pathname === window.location.pathname
    // A jump to a section, or a link to where you already are, has nothing to wait for.
    if (samePage && next.search === window.location.search) return
    current = { path: next.pathname, samePage }
    tell()
  },
  stop() {
    if (!current) return
    current = null
    tell()
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  read: () => current,
}

export const usePageLoad = () => useSyncExternalStore(pageLoad.subscribe, pageLoad.read, () => null)
