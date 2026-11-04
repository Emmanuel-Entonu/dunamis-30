import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Device = {
  userAgent?: string
  deviceMemory?: number
  hardwareConcurrency?: number
  connection?: { saveData?: boolean; effectiveType?: string }
  coarse?: boolean
  search?: string
  stored?: string
  thisVisit?: string
}

const ANDROID = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) Chrome/120 Mobile'
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17.0 Mobile Safari/604.1'

const reset = () => {
  delete document.documentElement.dataset.lite
  localStorage.clear()
  sessionStorage.clear()
}

/** Runs the head script as a browser would, against a made-up device. */
async function decide(device: Device) {
  const { liteScript } = await import('@/lib/lite')
  reset()
  if (device.stored) localStorage.setItem('dunamis-lite', device.stored)
  if (device.thisVisit) sessionStorage.setItem('dunamis-lite-visit', device.thisVisit)
  const navigatorStub = {
    userAgent: device.userAgent ?? ANDROID,
    deviceMemory: device.deviceMemory,
    hardwareConcurrency: device.hardwareConcurrency ?? 8,
    connection: device.connection,
  }
  new Function('navigator', 'location', 'matchMedia', liteScript)(navigatorStub, { search: device.search ?? '' }, () => ({ matches: device.coarse ?? true }))
  return document.documentElement.dataset.lite === '1'
}

describe('choosing the lighter version before the first paint', () => {
  beforeEach(reset)

  it('leaves a capable phone alone', async () => {
    expect(await decide({ deviceMemory: 8, hardwareConcurrency: 8, connection: { effectiveType: '4g' } })).toBe(false)
  })

  it('leaves a phone alone when it says nothing about itself', async () => {
    expect(await decide({})).toBe(false)
  })

  it('lightens a phone with little memory', async () => {
    expect(await decide({ deviceMemory: 2 })).toBe(true)
  })

  it('lightens a phone with few cores', async () => {
    expect(await decide({ hardwareConcurrency: 4 })).toBe(true)
  })

  it('does not judge an iPhone by its cores, which Safari does not report truly', async () => {
    expect(await decide({ userAgent: IPHONE, hardwareConcurrency: 4 })).toBe(false)
  })

  it('allows a desktop more slack than a phone', async () => {
    expect(await decide({ coarse: false, hardwareConcurrency: 4 })).toBe(false)
    expect(await decide({ coarse: false, hardwareConcurrency: 2 })).toBe(true)
  })

  it('lightens the site for anyone saving data or on a slow network', async () => {
    expect(await decide({ connection: { saveData: true } })).toBe(true)
    expect(await decide({ connection: { effectiveType: '3g' } })).toBe(true)
    expect(await decide({ connection: { effectiveType: 'slow-2g' } })).toBe(true)
  })

  it('remembers that this visit already turned lighter', async () => {
    expect(await decide({ thisVisit: '1' })).toBe(true)
  })

  it('obeys a choice, whatever the device', async () => {
    expect(await decide({ search: '?lite=1' })).toBe(true)
    expect(await decide({ deviceMemory: 1, search: '?lite=0' })).toBe(false)
    expect(await decide({ deviceMemory: 1, stored: '0' })).toBe(false)
    expect(await decide({ stored: '1' })).toBe(true)
  })

  it('keeps a choice made in the address for later visits', async () => {
    await decide({ search: '?a=b&lite=0' })
    expect(localStorage.getItem('dunamis-lite')).toBe('0')
  })
})

describe('noticing a phone that struggles', () => {
  let next: FrameRequestCallback | null = null
  let clock = 1000

  /** Plays frames that are `gap` milliseconds apart, as if the page were scrolling the whole time. */
  const play = async (frames: number, gap: number) => {
    const { keepWatching } = await import('@/lib/lite')
    for (let i = 0; i < frames; i++) {
      clock += gap
      keepWatching()
      const run = next
      next = null
      run?.(clock)
    }
  }

  beforeEach(() => {
    vi.resetModules()
    reset()
    next = null
    clock = 1000
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      next = callback
      return 1
    })
    vi.spyOn(performance, 'now').mockImplementation(() => clock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const lite = () => document.documentElement.dataset.lite === '1'

  it('leaves a smooth phone alone', async () => {
    await play(400, 16)
    expect(lite()).toBe(false)
  })

  it('leaves a steady 30 frames a second alone, as phones do in low-power mode', async () => {
    await play(400, 33.4)
    expect(lite()).toBe(false)
  })

  it('lightens the page after a few seconds of real struggling, and remembers for this visit', async () => {
    const heard = vi.fn()
    window.addEventListener('dunamis-lite-change', heard)
    await play(100, 50)
    window.removeEventListener('dunamis-lite-change', heard)
    expect(lite()).toBe(true)
    expect(heard).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('dunamis-lite-visit')).toBe('1')
  })

  it('forgives a short rough patch', async () => {
    await play(46, 50)
    await play(45, 16)
    await play(45, 50)
    await play(45, 16)
    expect(lite()).toBe(false)
  })

  it('ignores long gaps, such as coming back from another app', async () => {
    await play(200, 900)
    expect(lite()).toBe(false)
  })

  it('never overrides someone who opted out', async () => {
    localStorage.setItem('dunamis-lite', '0')
    await play(200, 60)
    expect(lite()).toBe(false)
  })

  it('stops timing frames once nothing is moving', async () => {
    const { keepWatching } = await import('@/lib/lite')
    keepWatching()
    clock += 1000
    const run = next as FrameRequestCallback | null
    next = null
    run?.(clock)
    expect(next).toBeNull()
  })
})
