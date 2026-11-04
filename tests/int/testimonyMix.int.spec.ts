import { describe, expect, it } from 'vitest'

import { currentMixSeed, mixTestimonies, MIX_WINDOW_MS, readMixSeed, type MixEntry } from '../../src/lib/testimonyMix'

const CATEGORIES = ['healing', 'family', 'financial', 'destiny', 'deliverance', 'career', 'academic', 'spiritual', 'other']
const SEED = 980_000
const seedTime = SEED * MIX_WINDOW_MS

function library(total: number, videoEvery: number): MixEntry[] {
  return Array.from({ length: total }, (_, i) => ({
    id: i,
    hasVideo: videoEvery > 0 && i % videoEvery === 0,
    category: CATEGORIES[(i * 7) % CATEGORIES.length],
    person: `person-${i}`,
    publishedAt: new Date(seedTime - (i + 1) * 86_400_000).toISOString(),
  }))
}

const ids = (list: MixEntry[]) => list.map((t) => t.id)

describe('mixTestimonies', () => {
  it('keeps every testimony exactly once', () => {
    const input = library(137, 4)
    const mixed = mixTestimonies(input, SEED)
    expect(mixed).toHaveLength(137)
    expect(new Set(ids(mixed)).size).toBe(137)
  })

  it('gives the same order for the same seed, so paging never repeats or skips', () => {
    const input = library(80, 3)
    expect(ids(mixTestimonies(input, SEED))).toEqual(ids(mixTestimonies(input, SEED)))
    const pages = [0, 12, 24, 36, 48, 60, 72].flatMap((start) => ids(mixTestimonies(input, SEED).slice(start, start + 12)))
    expect(new Set(pages).size).toBe(80)
  })

  it('gives a different order for a different seed', () => {
    const input = library(80, 3)
    expect(ids(mixTestimonies(input, SEED + 1))).not.toEqual(ids(mixTestimonies(input, SEED)))
  })

  it('does not change the list it was given', () => {
    const input = library(30, 3)
    const before = ids(input)
    mixTestimonies(input, SEED)
    expect(ids(input)).toEqual(before)
  })

  it('spreads videos evenly, so every page of a mixed library has its share', () => {
    for (let seed = SEED; seed < SEED + 40; seed++) {
      const mixed = mixTestimonies(library(120, 4), seed) // 30 videos, 90 written
      for (let start = 0; start + 12 <= 120; start += 12) {
        const videos = mixed.slice(start, start + 12).filter((t) => t.hasVideo).length
        expect(videos).toBeGreaterThanOrEqual(2)
        expect(videos).toBeLessThanOrEqual(5)
      }
    }
  })

  it('puts a video near the top whenever any exist, even when they are rare', () => {
    for (let seed = SEED; seed < SEED + 200; seed++) {
      const mixed = mixTestimonies(library(100, 50), seed) // 2 videos
      expect(mixed.slice(0, 3).some((t) => t.hasVideo)).toBe(true)
    }
  })

  it('never lets one video run together when written testimonies are there to separate them', () => {
    for (let seed = SEED; seed < SEED + 40; seed++) {
      const mixed = mixTestimonies(library(90, 3), seed)
      for (let i = 1; i < mixed.length; i++) expect(mixed[i].hasVideo && mixed[i - 1].hasVideo).toBe(false)
    }
  })

  it('keeps testimonies from the same person apart', () => {
    const input = library(60, 4).map((t, i) => ({ ...t, person: i < 6 ? 'same-person' : t.person }))
    for (let seed = SEED; seed < SEED + 40; seed++) {
      const mixed = mixTestimonies(input, seed)
      for (let i = 1; i < mixed.length; i++) expect(mixed[i].person === 'same-person' && mixed[i - 1].person === 'same-person').toBe(false)
    }
  })

  it('mostly avoids the same category side by side', () => {
    let clashes = 0
    let pairs = 0
    for (let seed = SEED; seed < SEED + 40; seed++) {
      const mixed = mixTestimonies(library(90, 4), seed)
      for (let i = 1; i < mixed.length; i++) {
        pairs++
        if (mixed[i].category === mixed[i - 1].category) clashes++
      }
    }
    // With 9 even categories, a plain shuffle would clash about 11% of the time.
    expect(clashes / pairs).toBeLessThan(0.02)
  })

  it('lets newer testimonies rise without locking older ones out of the top', () => {
    const input = library(200, 0)
    let newInTop = 0
    let oldInTop = 0
    for (let seed = SEED; seed < SEED + 300; seed++) {
      for (const t of mixTestimonies(input, seed).slice(0, 12)) {
        if (Number(t.id) < 10) newInTop++
        if (Number(t.id) >= 190) oldInTop++
      }
    }
    expect(newInTop).toBeGreaterThan(oldInTop * 1.5)
    expect(oldInTop).toBeGreaterThan(0)
  })

  it('copes with empty, tiny, all-video and undated libraries', () => {
    expect(mixTestimonies([], SEED)).toEqual([])
    expect(ids(mixTestimonies([{ id: 1 }], SEED))).toEqual([1])
    const allVideo = library(10, 1)
    expect(new Set(ids(mixTestimonies(allVideo, SEED))).size).toBe(10)
    const undated = Array.from({ length: 12 }, (_, i) => ({ id: i, publishedAt: null, category: null, person: null, hasVideo: i === 0 }))
    expect(new Set(ids(mixTestimonies(undated, SEED))).size).toBe(12)
  })
})

describe('readMixSeed', () => {
  const now = seedTime + 1000

  it('uses the current half hour by default', () => {
    expect(readMixSeed(undefined, now)).toBe(currentMixSeed(now))
    expect(readMixSeed('nonsense', now)).toBe(currentMixSeed(now))
  })

  it('accepts a recent seed from a page link, and refuses old or future ones', () => {
    expect(readMixSeed(String(SEED - 3), now)).toBe(SEED - 3)
    expect(readMixSeed(String(SEED - 500), now)).toBe(SEED)
    expect(readMixSeed(String(SEED + 5), now)).toBe(SEED)
  })
})
