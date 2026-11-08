/**
 * Orders the testimony library for one visit to the testimonies page, so every visitor gets their own
 * mix and every testimony gets its turn at the top.
 *
 *   1. Each visit has a number, counted up by the database (see startVisit in content.ts).
 *   2. Visit n opens with video number n of a rotation, so every video takes the very first place in
 *      turn: once in every round of as many visits as there are videos. The first page's other places
 *      go round the same way, for videos and written testimonies alike, so everyone's testimony keeps
 *      coming back to the first page. Each round is in a fresh random order, so the same testimonies
 *      don't always come up together, and visitors who arrive one after another see different ones.
 *   3. Everything after the first page is shuffled for that visit, with videos spread evenly and
 *      neighbours from the same person or category pulled apart.
 *
 * The same visit number always gives the same order, so paging through never repeats or skips a testimony.
 */

export type MixEntry = {
  id: number | string
  hasVideo?: boolean | null
  category?: string | null
  person?: string | null
}

/** The first page shows at least this many videos, when there are that many. */
const FIRST_PAGE_VIDEOS = 3

/** How far ahead the neighbour step looks for a better swap. */
const REACH = 12

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

/** Stirs numbers into one seed (MurmurHash3's finaliser, once per number). */
function seedOf(...parts: number[]) {
  let h = 0x2f6b9e37
  for (const part of parts) {
    h ^= part >>> 0
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b)
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
    h ^= h >>> 16
  }
  return h >>> 0
}

const SALT = { video: 1, written: 2, visit: 3 }

function shuffle<T>(items: T[], random: () => number) {
  const list = [...items]
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

/** Database order, whatever order the rows arrived in, so a round's shuffle depends only on its number. */
const byId = <T extends MixEntry>(items: T[]) =>
  [...items].sort((a, b) => (typeof a.id === 'number' && typeof b.id === 'number' ? a.id - b.id : String(a.id).localeCompare(String(b.id))))

/**
 * The testimonies visit n puts on the first page, from one rotation. Every round of `items.length` visits
 * gives each testimony each of the `count` places exactly once, so the first place (the top of the page)
 * goes to every one of them in turn. The places are spread round the rotation, so visitors who arrive
 * one after another get different testimonies.
 */
function takeTurns<T extends MixEntry>(items: T[], count: number, visit: number, salt: number) {
  if (!count || !items.length) return []
  const size = items.length
  const sorted = byId(items)
  // Two can only alternate, so they keep one order. More get a fresh order each round.
  const which = size > 2 ? Math.floor(visit / size) : 0
  const round = shuffle(sorted, generator(seedOf(salt, which)))
  if (which > 0) {
    // A round never opens with the one the round before ended on, so no two visits in a row share their first.
    const before = shuffle(sorted, generator(seedOf(salt, which - 1)))
    if (round[0] === before[size - 1]) [round[0], round[1]] = [round[1], round[0]]
  }
  const at = visit % size
  const step = Math.max(1, Math.floor(size / count))
  return Array.from({ length: count }, (_, place) => round[(at + place * step) % size])
}

/** How many videos and written testimonies the first page holds: videos get at least a few places. */
function firstPageShape(videos: number, written: number, pageSize: number) {
  if (videos + written <= pageSize) return { videos, written }
  const share = Math.round((pageSize * videos) / (videos + written))
  const wanted = Math.min(videos, Math.max(share, FIRST_PAGE_VIDEOS))
  const writtenPlaces = Math.min(written, pageSize - wanted)
  return { videos: Math.min(videos, pageSize - writtenPlaces), written: writtenPlaces }
}

/**
 * Places videos at even intervals, nudged a little so the pattern doesn't look mechanical. With `lead`
 * the first video goes first. Otherwise it lands in one of the first few places, and not the very first
 * when `afterVideo` (the page before ended with one).
 */
function spreadVideos<T extends MixEntry>(videos: T[], written: T[], random: () => number, { lead = false, afterVideo = false } = {}) {
  if (!videos.length || !written.length) return [...videos, ...written]
  const total = videos.length + written.length
  const gap = total / videos.length
  // With enough written testimonies, there's always one between two videos.
  const apart = written.length >= videos.length ? 2 : 1
  const earliest = afterVideo ? 1 : 0
  const first = lead ? 0 : earliest + Math.floor(random() * Math.max(1, Math.min(3, Math.ceil(gap)) - earliest))
  const step = (total - first) / videos.length
  const slots = new Set<number>()
  let previous = -1
  videos.forEach((_, i) => {
    const nudge = gap >= 4 && i > 0 ? Math.round((random() - 0.5) * 2) : 0
    const latest = total - 1 - apart * (videos.length - 1 - i)
    const slot = i === 0 ? Math.min(latest, first) : Math.min(latest, Math.max(previous + apart, Math.round(first + i * step) + nudge))
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

/**
 * Swaps clashing neighbours with a nearby testimony of the same kind, so videos keep their places. Swaps
 * stay on their own side of `pageEnd`, so the first page keeps the testimonies whose turn it is, and the
 * very first one never moves. Every swap lowers the clashes overall, so a few passes settle it.
 */
function separateNeighbours<T extends MixEntry>(list: T[], pageEnd: number) {
  const around = (at: number) => clash(list[at - 1], list[at]) + clash(list[at], list[at + 1])
  const swap = (a: number, b: number) => {
    ;[list[a], list[b]] = [list[b], list[a]]
  }
  /** The place nearby that would best take the testimony at `at`, or -1 if none would help. */
  const betterPlace = (at: number) => {
    let best = -1
    let bestGain = 0
    for (let j = Math.max(1, at - REACH); j < Math.min(list.length, at + REACH + 1); j++) {
      if (j === at || (at < pageEnd) !== (j < pageEnd) || Boolean(list[j].hasVideo) !== Boolean(list[at].hasVideo)) continue
      const before = around(at) + around(j)
      swap(at, j)
      const gain = before - (around(at) + around(j))
      swap(at, j)
      if (gain > bestGain) {
        bestGain = gain
        best = j
      }
    }
    return best
  }
  for (let pass = 0; pass < 4; pass++) {
    let moved = false
    for (let i = 1; i < list.length; i++) {
      if (!clash(list[i - 1], list[i])) continue
      // Move the second of the pair if a better place turns up, otherwise the first (never the very first).
      for (const at of i > 1 ? [i, i - 1] : [i]) {
        const place = betterPlace(at)
        if (place >= 0) {
          swap(at, place)
          moved = true
          break
        }
      }
    }
    if (!moved) break
  }
  return list
}

export function mixTestimonies<T extends MixEntry>(items: T[], visit: number, pageSize = 12): T[] {
  const turn = Math.max(0, Math.floor(visit))
  const random = generator(seedOf(SALT.visit, turn))
  const all = byId(items)
  const videos = all.filter((item) => item.hasVideo)
  const written = all.filter((item) => !item.hasVideo)
  const shape = firstPageShape(videos.length, written.length, pageSize)

  // The first page: this visit's turn in each rotation. Its first video opens the page.
  const [lead, ...otherVideos] = takeTurns(videos, shape.videos, turn, SALT.video)
  const firstWritten = takeTurns(written, shape.written, turn, SALT.written)
  const firstPage = spreadVideos(lead ? [lead, ...shuffle(otherVideos, random)] : [], shuffle(firstWritten, random), random, { lead: true })

  // The rest, shuffled for this visit.
  const shown = new Set(firstPage.map((item) => item.id))
  const after = spreadVideos(
    shuffle(videos.filter((item) => !shown.has(item.id)), random),
    shuffle(written.filter((item) => !shown.has(item.id)), random),
    random,
    { afterVideo: Boolean(firstPage.at(-1)?.hasVideo) },
  )
  return separateNeighbours([...firstPage, ...after], firstPage.length)
}

/**
 * Visit numbers travel in page links scrambled (multiplied by an odd number, which can be undone), so the
 * links don't show how many visits there have been.
 */
const SCRAMBLE = 0x9e3779b1
const UNSCRAMBLE = (() => {
  let x = SCRAMBLE
  for (let i = 0; i < 5; i++) x = Math.imul(x, 2 - Math.imul(SCRAMBLE, x))
  return x >>> 0
})()

export const visitToken = (visit: number) => Math.imul(visit >>> 0, SCRAMBLE) >>> 0

/** The visit a page link belongs to, or null when there isn't a proper one. */
export function readVisit(token: unknown) {
  if (typeof token !== 'string' || !/^\d{1,10}$/.test(token)) return null
  const value = Number(token)
  return value <= 0xffffffff ? Math.imul(value >>> 0, UNSCRAMBLE) >>> 0 : null
}
