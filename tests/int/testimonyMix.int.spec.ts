import { describe, expect, it } from 'vitest'

import { mixTestimonies, readVisit, visitToken, type MixEntry } from '../../src/lib/testimonyMix'

const CATEGORIES = ['healing', 'family', 'financial', 'destiny', 'deliverance', 'career', 'academic', 'spiritual', 'other']
const VISIT = 48_211
const PAGE = 12

function library(total: number, videoEvery: number): MixEntry[] {
  return Array.from({ length: total }, (_, i) => ({
    id: i,
    hasVideo: videoEvery > 0 && i % videoEvery === 0,
    category: CATEGORIES[(i * 7) % CATEGORIES.length],
    person: `person-${i}`,
  }))
}

const ids = (list: MixEntry[]) => list.map((t) => t.id)
const firstPage = (input: MixEntry[], visit: number) => mixTestimonies(input, visit, PAGE).slice(0, PAGE)
/** Visits that make up one whole round of a rotation of this size. */
const round = (size: number, which = 7) => Array.from({ length: size }, (_, i) => which * size + i)

describe('mixTestimonies', () => {
  it('keeps every testimony exactly once', () => {
    for (const [total, every] of [[137, 4], [12, 3], [5, 2], [300, 40], [40, 0], [25, 1]]) {
      for (let visit = VISIT; visit < VISIT + 30; visit++) {
        const mixed = mixTestimonies(library(total, every), visit, PAGE)
        expect(mixed).toHaveLength(total)
        expect(new Set(ids(mixed)).size).toBe(total)
      }
    }
  })

  it('gives the same order for the same visit, so paging never repeats or skips', () => {
    const input = library(80, 3)
    expect(ids(mixTestimonies(input, VISIT, PAGE))).toEqual(ids(mixTestimonies(input, VISIT, PAGE)))
    const pages = [0, 12, 24, 36, 48, 60, 72].flatMap((start) => ids(mixTestimonies(input, VISIT, PAGE).slice(start, start + 12)))
    expect(new Set(pages).size).toBe(80)
  })

  it('does not depend on the order the database returns them in', () => {
    const input = library(80, 3)
    expect(ids(mixTestimonies([...input].reverse(), VISIT, PAGE))).toEqual(ids(mixTestimonies(input, VISIT, PAGE)))
  })

  it('does not change the list it was given', () => {
    const input = library(30, 3)
    const before = ids(input)
    mixTestimonies(input, VISIT, PAGE)
    expect(ids(input)).toEqual(before)
  })

  it('gives visitors who arrive one after another different testimonies on the first page', () => {
    const input = library(120, 4) // 30 videos, 90 written
    let shared = 0
    for (let visit = VISIT; visit < VISIT + 200; visit++) {
      const now = new Set(ids(firstPage(input, visit)))
      shared += ids(firstPage(input, visit + 1)).filter((id) => now.has(id)).length
      expect(ids(mixTestimonies(input, visit + 1, PAGE))).not.toEqual(ids(mixTestimonies(input, visit, PAGE)))
    }
    // Only where a rotation starts a new round can two neighbouring visits share any.
    expect(shared / 200).toBeLessThan(0.5)
  })

  it('opens the page with every video in turn: each one first exactly once a round', () => {
    for (const [total, every] of [[120, 4], [100, 50], [60, 1], [9, 3]]) {
      const input = library(total, every)
      const videos = input.filter((t) => t.hasVideo)
      const leads = round(videos.length).map((visit) => mixTestimonies(input, visit, PAGE)[0])
      expect(leads.every((t) => t.hasVideo)).toBe(true)
      expect(new Set(ids(leads)).size).toBe(videos.length)
    }
  })

  it('never opens two visits in a row with the same video, even where one round of turns ends and the next begins', () => {
    for (const [total, every] of [[120, 4], [100, 50], [9, 3], [12, 4], [60, 1]]) {
      const input = library(total, every)
      let previous: MixEntry['id'] | undefined
      for (let visit = 0; visit < 400; visit++) {
        const lead = mixTestimonies(input, visit, PAGE)[0].id
        expect(lead).not.toBe(previous)
        previous = lead
      }
    }
  })

  it('brings every video back to the first page on many visits', () => {
    const input = library(300, 10) // 30 videos, 270 written
    const seen = new Map<MixEntry['id'], number>()
    for (const visit of round(30)) for (const t of firstPage(input, visit)) if (t.hasVideo) seen.set(t.id, (seen.get(t.id) ?? 0) + 1)
    // The first page has three places for videos, so in a round of 30 visits each video gets all three.
    expect(seen.size).toBe(30)
    expect([...seen.values()].every((times) => times === 3)).toBe(true)
  })

  it('brings every written testimony to the first page in turn too', () => {
    const input = library(300, 10) // 30 videos, 270 written: the first page has 9 places for written ones
    const seen = new Map<MixEntry['id'], number>()
    for (const visit of round(270)) for (const t of firstPage(input, visit)) if (!t.hasVideo) seen.set(t.id, (seen.get(t.id) ?? 0) + 1)
    expect(seen.size).toBe(270)
    expect([...seen.values()].every((times) => times === 9)).toBe(true)
  })

  it('reshuffles each round, so the same testimonies don’t always come up together', () => {
    const input = library(120, 4)
    const leads = (which: number) => ids(round(30, which).map((visit) => mixTestimonies(input, visit, PAGE)[0]))
    expect(leads(3)).not.toEqual(leads(4))
  })

  it('gives videos at least three places on the first page, even when they are rare', () => {
    for (let visit = VISIT; visit < VISIT + 100; visit++) {
      expect(firstPage(library(300, 60), visit).filter((t) => t.hasVideo)).toHaveLength(3) // 5 videos in 300
      expect(firstPage(library(100, 50), visit).filter((t) => t.hasVideo)).toHaveLength(2) // only 2 videos
      expect(firstPage(library(120, 4), visit).filter((t) => t.hasVideo)).toHaveLength(3) // their fair share
      expect(firstPage(library(60, 2), visit).filter((t) => t.hasVideo)).toHaveLength(6) // half are videos
    }
  })

  it('spreads videos evenly, so every later page has its share', () => {
    for (let visit = VISIT; visit < VISIT + 40; visit++) {
      const mixed = mixTestimonies(library(120, 4), visit, PAGE) // 30 videos, 90 written
      for (let start = 12; start + 12 <= 120; start += 12) {
        const videos = mixed.slice(start, start + 12).filter((t) => t.hasVideo).length
        expect(videos).toBeGreaterThanOrEqual(2)
        expect(videos).toBeLessThanOrEqual(5)
      }
    }
  })

  it('never puts two videos side by side when written testimonies are there to separate them', () => {
    for (let visit = VISIT; visit < VISIT + 60; visit++) {
      for (const input of [library(90, 3), library(120, 4), library(36, 2)]) {
        const mixed = mixTestimonies(input, visit, PAGE)
        for (let i = 1; i < mixed.length; i++) expect(mixed[i].hasVideo && mixed[i - 1].hasVideo).toBe(false)
      }
    }
  })

  it('keeps testimonies from the same person apart', () => {
    const input = library(60, 4).map((t, i) => ({ ...t, person: i < 6 ? 'same-person' : t.person }))
    for (let visit = VISIT; visit < VISIT + 40; visit++) {
      const mixed = mixTestimonies(input, visit, PAGE)
      for (let i = 1; i < mixed.length; i++) expect(mixed[i].person === 'same-person' && mixed[i - 1].person === 'same-person').toBe(false)
    }
  })

  it('mostly avoids the same category side by side', () => {
    let clashes = 0
    let pairs = 0
    for (let visit = VISIT; visit < VISIT + 40; visit++) {
      const mixed = mixTestimonies(library(90, 4), visit, PAGE)
      for (let i = 1; i < mixed.length; i++) {
        pairs++
        if (mixed[i].category === mixed[i - 1].category) clashes++
      }
    }
    // With 9 even categories, a plain shuffle would clash about 11% of the time.
    expect(clashes / pairs).toBeLessThan(0.03)
  })

  it('copes with empty, tiny, all-video and all-written libraries', () => {
    expect(mixTestimonies([], VISIT, PAGE)).toEqual([])
    expect(ids(mixTestimonies([{ id: 1 }], VISIT, PAGE))).toEqual([1])
    const allVideo = library(30, 1)
    expect(new Set(ids(mixTestimonies(allVideo, VISIT, PAGE))).size).toBe(30)
    const leads = round(30).map((visit) => mixTestimonies(allVideo, visit, PAGE)[0].id)
    expect(new Set(leads).size).toBe(30)
    const written = library(30, 0)
    expect(new Set(ids(mixTestimonies(written, VISIT, PAGE))).size).toBe(30)
    const bare = Array.from({ length: 12 }, (_, i) => ({ id: i, category: null, person: null, hasVideo: i === 0 }))
    expect(mixTestimonies(bare, VISIT, PAGE)[0].id).toBe(0)
  })
})

describe('visit links', () => {
  it('scrambles the visit number in page links, and reads it back', () => {
    for (const visit of [0, 1, 2, 17, 48_211, 2 ** 31, 2 ** 32 - 1]) {
      const token = visitToken(visit)
      expect(readVisit(String(token))).toBe(visit)
    }
    expect(String(visitToken(2))).not.toBe('2')
  })

  it('ignores a missing or broken one, so the visit starts afresh', () => {
    for (const junk of [undefined, '', 'nonsense', '-4', '1.5', '99999999999', ['1', '2']]) expect(readVisit(junk)).toBeNull()
  })
})
