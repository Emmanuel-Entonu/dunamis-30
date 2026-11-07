'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'

/**
 * What makes the dashboard quick. Moving around never goes to the server: the address changes and the
 * screen swaps at once. Whatever has been loaded stays in memory and shows immediately, while a fresh
 * copy loads quietly behind it.
 */

// Where we are.
const moved = new Set<() => void>()
const tellMoved = () => moved.forEach((listener) => listener())

if (typeof window !== 'undefined') window.addEventListener('popstate', tellMoved)

export const go = (href: string, { keepScroll = false } = {}) => {
  window.history.pushState(null, '', href)
  if (!keepScroll) window.scrollTo(0, 0)
  tellMoved()
}

const readLocation = () => window.location.pathname + window.location.search

export const useLocation = () =>
  useSyncExternalStore(
    (listener) => {
      moved.add(listener)
      return () => moved.delete(listener)
    },
    readLocation,
    () => '/dashboard',
  )

// What we know.
type Slot = { data?: unknown; failed?: number; at: number }

const slots = new Map<string, Slot>()
const flying = new Map<string, Promise<void>>()
const watchers = new Map<string, Set<() => void>>()
/** Anything younger than this isn't fetched again just because a screen opened. */
const FRESH_MS = 4000

const tell = (url: string) => watchers.get(url)?.forEach((listener) => listener())

export class ApiProblem extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {}
  const res = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
    ...rest,
    ...(json === undefined ? {} : { body: JSON.stringify(json), headers: { 'content-type': 'application/json' } }),
  })
  if (!res.ok) throw new ApiProblem(`Request failed (${res.status})`, res.status)
  return (res.status === 204 ? undefined : await res.json()) as T
}

export function refresh(url: string, { force = false } = {}) {
  const slot = slots.get(url)
  if (!force && slot && slot.data !== undefined && Date.now() - slot.at < FRESH_MS) return Promise.resolve()
  const running = flying.get(url)
  if (running) return running
  const job = api<unknown>(url)
    .then((data) => {
      slots.set(url, { data, at: Date.now() })
    })
    .catch((error: unknown) => {
      const status = error instanceof ApiProblem ? error.status : 0
      slots.set(url, { ...slots.get(url), failed: status || 1, at: slots.get(url)?.at ?? 0 })
    })
    .finally(() => {
      flying.delete(url)
      tell(url)
    })
  flying.set(url, job)
  return job
}

/** Changes what's on screen straight away, ahead of the server. */
export function setData<T>(url: string, change: (current: T | undefined) => T | undefined) {
  const slot = slots.get(url)
  slots.set(url, { data: change(slot?.data as T | undefined), at: Date.now() })
  tell(url)
}

/** After a change, everything that might show it loads again in the background. */
export function refreshWhere(match: (url: string) => boolean) {
  for (const url of slots.keys()) if (match(url)) void refresh(url, { force: true })
}

export const forgetAll = () => {
  slots.clear()
  watchers.forEach((_, url) => tell(url))
}

export function useData<T>(url: string | null) {
  const subscribe = useCallback(
    (listener: () => void) => {
      if (!url) return () => undefined
      const set = watchers.get(url) ?? new Set()
      set.add(listener)
      watchers.set(url, set)
      return () => set.delete(listener)
    },
    [url],
  )
  const slot = useSyncExternalStore(
    subscribe,
    () => (url ? slots.get(url) : undefined),
    () => undefined,
  )
  useEffect(() => {
    if (url) void refresh(url)
  }, [url])
  return { data: slot?.data as T | undefined, failed: slot?.failed }
}
