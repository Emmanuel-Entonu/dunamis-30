/**
 * Orders the testimony library so a visitor meets a real mix, not just whatever was approved last.
 *
 *   1. Shuffle fairly, with newer testimonies more likely to rise. Age only tilts the odds: an
 *      older testimony can still land first, and nothing is locked to the top.
 *   2. Spread videos evenly through the written ones, with one near the top whenever any exist.
 *   3. Pull apart neighbours from the same person or the same category, as far as the list allows.
 *
 * The same seed always gives the same order, so paging through the library never repeats or skips
 * a testimony. A new seed every half hour keeps the page feeling fresh for returning visitors.
 */

export type MixEntry = {
  id: number | string
  hasVideo?: boolean | null
  category?: string | null
  person?: string | null
  publishedAt?: string | null
}

const DAY_MS = 86_400_000
export const MIX_WINDOW_MS = 30 * 60 * 1000

/** How far ahead the last step looks for a better neighbour. */
const REACH = 12

export const currentMixSeed = (now = Date.now()) => Math.floor(now / MIX_WINDOW_MS)

/** Accepts a seed from a page link only if it's recent, so old links can't pin an old order. */
export function readMixSeed(value: unknown, now = Date.now()) {
  const seed = Number(value)
  const current = currentMixSeed(now)
  return Number.isInteger(seed) && seed <= current && current - seed <= 48 ? seed : current
}

/** Mulberry32: a small repeatable random number generator. */
function generator(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A weighted shuffle (Efraimidis-Spirakis). A testimony counts up to 3 times when new, easing to 1. */
function shuffleWithFreshness<T extends MixEntry>(items: T[], random: () => number, now: number) {
  return items
    .map((item) => {
      const published = item.publishedAt ? Date.parse(item.publishedAt) : Number.NaN
      const ageDays = Number.isNaN(published) ? 60 : Math.max(0, (now - published) / DAY_MS)
      const weight = 1 + 2 * 0.5 ** (ageDays / 14)
      return { item, key: random() ** (1 / weight) }
    })
    .sort((a, b) => b.key - a.key)
    .map(({ item }) => item)
}

/** Places videos at even intervals, nudged a little so the pattern doesn't look mechanical. */
function spreadVideos<T extends MixEntry>(videos: T[], written: T[], random: () => number) {
  if (!videos.length || !written.length) return [...videos, ...written]
  const total = videos.length + written.length
  const gap = total / videos.length
  const first = Math.floor(random() * Math.min(3, Math.ceil(gap)))
  const step = (total - first) / videos.length
  const slots = new Set<number>()
  let previous = -1
  videos.forEach((_, i) => {
    const nudge = gap >= 4 && i > 0 ? Math.round((random() - 0.5) * 2) : 0
    const latest = total - (videos.length - i)
    const slot = Math.min(latest, Math.max(previous + 1, Math.round(first + i * step) + nudge))
    slots.add(slot)
    previous = slot
  })
  const nextVideo = videos[Symbol.iterator]()
  const nextWritten = written[Symbol.iterator]()
  return Array.from({ length: total }, (_, i) => (slots.has(i) ? nextVideo.next().value : nextWritten.next().value) as T)
}

/** How badly two neighbours clash. The same person side by side matters most. */
function clash(a?: MixEntry, b?: MixEntry) {
  if (!a || !b) return 0
  return (a.person && a.person === b.person ? 4 : 0) + (a.category && a.category === b.category ? 1 : 0)
}

/** Swaps clashing neighbours with a later testimony of the same kind, so videos stay evenly spaced. */
function separateNeighbours<T extends MixEntry>(list: T[]) {
  const around = (at: number) => clash(list[at - 1], list[at]) + clash(list[at], list[at + 1])
  const swap = (a: number, b: number) => {
    ;[list[a], list[b]] = [list[b], list[a]]
  }
  for (let i = 1; i < list.length; i++) {
    if (!clash(list[i - 1], list[i])) continue
    let best = -1
    let bestGain = 0
    for (let j = i + 1; j < Math.min(list.length, i + 1 + REACH); j++) {
      if (Boolean(list[j].hasVideo) !== Boolean(list[i].hasVideo)) continue
      const before = around(i) + around(j)
      swap(i, j)
      const gain = before - (around(i) + around(j))
      swap(i, j)
      if (gain > bestGain) {
        bestGain = gain
        best = j
      }
    }
    if (best >= 0) swap(i, best)
  }
  return list
}

export function mixTestimonies<T extends MixEntry>(items: T[], seed: number): T[] {
  const random = generator(seed)
  // Age is measured from the seed, not the clock, so one seed always means one order.
  const shuffled = shuffleWithFreshness(items, random, seed * MIX_WINDOW_MS)
  const videos = shuffled.filter((item) => item.hasVideo)
  const written = shuffled.filter((item) => !item.hasVideo)
  return separateNeighbours(spreadVideos(videos, written, random))
}
