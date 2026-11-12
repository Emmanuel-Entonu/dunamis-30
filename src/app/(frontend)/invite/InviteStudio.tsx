'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import emblemImg from '@/assets/brand/emblem-official.webp'
import raysImg from '@/assets/coins/rays.webp'
import ministersImg from '@/assets/photos/card-ministers.webp'
import { Close, Share } from '@/components/icons'
import { ShareButtons } from '@/components/ShareButtons'
import { INVITED_KEY } from '@/lib/invite'
import type { InviteArt3D, InviteStage } from '@/lib/invite3d'
import { drawInvite, FLAT, INVITE, paintButton, prepareInvite, prepareInviteSlowly, renderInviteImage, setInviteName, TIMING, type InviteScene } from '@/lib/inviteFrames'
import { makeInviteVideo } from '@/lib/inviteVideo'
import { isLite } from '@/lib/lite'

const SHARE_TEXT =
  'I’d love you to join me at the Dunamis 30th Anniversary Celebration, the Kingdom Power & Glory World Conference, from the 23rd to the 29th of November at the Glory Dome, Abuja. #DunamisAt30'

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

/** Weak signal shouldn't stop anyone, so each picture gets a few tries. */
const loadArtwork = async (src: string, tries = 3): Promise<HTMLImageElement> => {
  try {
    return await loadImage(src)
  } catch (error) {
    if (tries <= 1) throw error
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return loadArtwork(src, tries - 1)
  }
}

/** As sharp as the screen allows. A device that can't keep up steps down a little at a time, rather than stuttering. */
const SHARPEST = 3

/** A phone that would struggle with the full 3D: few cores, little memory, or the site's lighter version already on. */
const lightDevice = () => {
  const n = navigator as Navigator & { deviceMemory?: number }
  return isLite() || (n.hardwareConcurrency ?? 8) <= 4 || (n.deviceMemory ?? 8) <= 4
}

/** How sharply to draw the screen, in real pixels per CSS pixel. */
const screenRatio = (light: boolean) => Math.min(window.devicePixelRatio || 1, light ? 1.5 : SHARPEST)

/**
 * How large to paint the envelope and the letter: their biggest size on this screen, in real pixels, against the
 * flat drawings' own. A phone needs far less than a large screen, which saves it a lot of painting and memory.
 */
const detailFor = (light: boolean) => {
  const ratio = screenRatio(light)
  const w = Math.max(window.innerWidth, 320)
  const h = Math.max(window.innerHeight, 480)
  const envelope = Math.min(w * 0.94, h * 0.62 * (FLAT.envelope.w / FLAT.envelope.h)) * ratio
  const letter = Math.min(h * 0.96, ((w * 0.98) / 1080) * 1920) * 0.8 * ratio
  const fit = (v: number, most: number) => Math.max(1, Math.min(most, v))
  return { detail: fit(envelope / FLAT.envelope.w, light ? 1.25 : 2), letterDetail: fit(letter / (FLAT.letter.panel * 3), light ? 1.1 : 1.6) }
}

type Mode = 'edit' | 'opening' | 'open'
type Video = { file: File; canShare: boolean }
type Rect = { x: number; y: number; w: number; h: number }

export function InviteStudio() {
  const stageBox = useRef<HTMLDivElement>(null)
  const stageCanvasBox = useRef<HTMLDivElement>(null)
  const quality = useRef(1)
  const resizeStage = useRef<() => void>(() => undefined)
  const presentBox = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLInputElement>(null)
  const hint = useRef<HTMLDivElement>(null)
  const three = useRef<InviteStage | null>(null)
  const art3d = useRef<InviteArt3D | null>(null)
  const openLength = useRef(7.6)
  // The flat drawings: the picture people share, and the whole thing where 3D isn't available.
  const flat = useRef<InviteScene | null>(null)
  const flatCanvas = useRef<HTMLCanvasElement | null>(null)
  const font = useRef('sans-serif')
  const light = useRef(false)
  const art = useRef<{ emblem: HTMLImageElement; ministers: HTMLImageElement } | null>(null)
  const letterTimer = useRef(0)
  const image = useRef<Blob | null>(null)
  const modeRef = useRef<Mode>('edit')
  const openedAt = useRef(0)
  const caret = useRef({ visible: false, at: 0 })
  const nameRef = useRef('')
  /** Who the invitation is for: the letter inside is addressed to them. */
  const toRef = useRef('')

  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [has3d, setHas3d] = useState(true)
  const [name, setName] = useState('')
  const [recipient, setRecipient] = useState('')
  const [focused, setFocused] = useState(false)
  const [mode, setModeState] = useState<Mode>('edit')
  const [missing, setMissing] = useState(false)
  const [busy, setBusy] = useState<'' | 'video' | 'share'>('')
  const [progress, setProgress] = useState(0)
  const [video, setVideo] = useState<Video | null>(null)
  const [note, setNote] = useState('')
  const [sharePanel, setSharePanel] = useState(false)

  const setMode = (next: Mode) => {
    modeRef.current = next
    setModeState(next)
  }

  /** The flat drawings, painted the first time they're needed, with the current name on the letter. */
  const flatScene = () => {
    if (!flat.current && art.current) flat.current = prepareInvite({ ...art.current, button: paintButton(art.current.emblem) }, font.current)
    if (flat.current && nameRef.current.trim()) setInviteName(flat.current, nameRef.current, toRef.current)
    return flat.current
  }

  /** Without 3D, or if the phone takes the 3D drawing back to free memory: the flat envelope, which does the same job. */
  const goFlat = () => {
    three.current = null
    flatScene()
    if (!flatCanvas.current) {
      const c = document.createElement('canvas')
      c.width = INVITE.w
      c.height = INVITE.h
      flatCanvas.current = c
    }
    setHas3d(false)
  }

  // The artwork, the site's font, and the 3D envelope, once.
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [emblem, ministers, rays] = await Promise.all([emblemImg, ministersImg, raysImg].map((img) => loadArtwork(img.src)))
        const family = getComputedStyle(document.body).fontFamily
        await Promise.all([700, 600, 500].map((w) => document.fonts.load(`${w} 40px ${family}`).catch(() => undefined)))
        if (!alive) return
        font.current = family
        art.current = { emblem, ministers }
        light.current = lightDevice()
        let stage: InviteStage | null = null
        try {
          const mod = await import('@/lib/invite3d')
          art3d.current = { emblem, ministers, rays }
          openLength.current = mod.OPEN.duration
          // A phone drawing 3D without a graphics chip gets the lighter envelope from the start.
          if (!light.current && mod.drawsInSoftware()) light.current = true
          stage = await mod.createInviteStage(art3d.current, family, { sparkles: 36, light: light.current, ...detailFor(light.current), onLost: () => goFlat() })
        } catch {
          // No 3D here: the flat envelope does the same job.
          stage = null
        }
        if (!alive) {
          stage?.dispose()
          return
        }
        three.current = stage
        if (!stage) goFlat()
        setReady(true)
      } catch {
        if (alive) setFailed(true)
      }
    })()
    return () => {
      alive = false
      three.current?.dispose()
      three.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once; goFlat only reads refs
  }, [])

  // The envelope lives on the page while it asks for a name, and moves to the full screen to open.
  useLayoutEffect(() => {
    if (!ready) return
    const stage = three.current
    const canvas = stage ? stage.canvas : flatCanvas.current
    const host = mode === 'edit' ? stageCanvasBox.current : presentBox.current
    if (!canvas || !host) return
    let from: Rect | null = null
    if (stage && mode === 'opening' && canvas.isConnected) {
      const c = canvas.getBoundingClientRect()
      const e = stage.envelopeRect()
      from = { x: c.left + e.x, y: c.top + e.y, w: e.w, h: e.h }
    }
    canvas.className = stage ? 'pointer-events-none absolute inset-0 h-full w-full' : 'pointer-events-none absolute inset-0 h-full w-full object-contain'
    host.prepend(canvas)
    const size = () => {
      const box = host.getBoundingClientRect()
      stage?.resize(box.width, box.height, screenRatio(light.current) * quality.current)
    }
    size()
    resizeStage.current = size
    if (stage && mode === 'edit') stage.setLayout('stage')
    if (mode === 'opening') {
      if (stage) {
        const box = host.getBoundingClientRect()
        stage.setLayout('present')
        stage.startFrom(from && { x: from.x - box.left, y: from.y - box.top, w: from.w, h: from.h })
      }
      openedAt.current = performance.now()
    }
    const watch = new ResizeObserver(size)
    watch.observe(host)
    return () => watch.disconnect()
  }, [ready, mode, has3d])

  // One loop draws the envelope: floating on the page, opening, then sparkling once it's open.
  useEffect(() => {
    if (!ready) return
    let frame = 0
    let onScreen = true
    const seen = new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting))
    if (stageBox.current) seen.observe(stageBox.current)
    const start = performance.now()
    let placed = ''
    let last = 0
    let slow = 0
    let frames = 0
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const m = modeRef.current
      if (m === 'edit' && (!onScreen || document.hidden)) {
        last = 0
        return
      }
      // If frames keep arriving late, draw a little less sharply rather than stutter.
      if (last && three.current) {
        frames++
        if (now - last > 26) slow++
        if (frames === 20) {
          if (slow > 10 && quality.current > 0.45) {
            quality.current = Math.max(0.45, quality.current * 0.75)
            resizeStage.current()
          } else if (slow > 10 && !light.current) {
            // Already as soft as it should go and still late: the lighter envelope, which looks the same.
            light.current = true
            three.current.lighten()
          }
          frames = 0
          slow = 0
        }
      }
      last = now
      const idle = (now - start) / 1000
      const s = m === 'edit' ? 0 : (now - openedAt.current) / 1000
      const stage = three.current
      if (stage) {
        stage.draw(s, idle)
        if (m === 'edit' && field.current) {
          // The name field sits over the engraving, wherever the floating envelope has carried it.
          const r = stage.nameRect()
          const key = `${r.x.toFixed(1)},${r.y.toFixed(1)},${r.w.toFixed(1)},${r.h.toFixed(1)}`
          if (key !== placed) {
            placed = key
            Object.assign(field.current.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px`, fontSize: `${r.h * 0.29}px` })
            if (hint.current) Object.assign(hint.current.style, { left: `${r.x}px`, top: `${r.y + r.h + 6}px`, width: `${r.w}px` })
          }
        }
        if (m === 'opening' && s >= openLength.current) setMode('open')
      } else if (flatCanvas.current && flat.current) {
        const ctx = flatCanvas.current.getContext('2d')!
        if (m === 'edit') drawInvite(ctx, flat.current, TIMING.rest, { idle, showName: true })
        else {
          const t = TIMING.rest + s
          drawInvite(ctx, flat.current, t)
          if (m === 'opening' && t >= TIMING.duration) setMode('open')
        }
      }
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      seen.disconnect()
    }
  }, [ready])

  // The engraving shows what's typed, with a blinking caret while the field has focus.
  const engrave = () => {
    const stage = three.current
    const input = field.current
    if (!stage || !input) return
    const focused = document.activeElement === input
    stage.engrave(nameRef.current, focused && caret.current.visible ? (input.selectionStart ?? nameRef.current.length) : null)
  }
  useEffect(() => {
    if (!ready || !has3d || mode !== 'edit') return
    const blink = window.setInterval(() => {
      caret.current.visible = !caret.current.visible
      engrave()
    }, 530)
    return () => window.clearInterval(blink)
  }, [ready, has3d, mode])

  // Once it's open, the picture to share is made, and the device remembers an invitation was sent.
  useEffect(() => {
    if (mode !== 'open') return
    let cancelled = false
    // Painted in the background, a piece at a time, once the buttons have settled, so the last moments stay smooth.
    const timer = window.setTimeout(async () => {
      if (!flat.current && art.current) flat.current = await prepareInviteSlowly({ ...art.current, button: paintButton(art.current.emblem) }, font.current, nameRef.current, toRef.current)
      const scene = flatScene()
      if (scene && !cancelled) renderInviteImage(scene).toBlob((blob) => (image.current = blob), 'image/jpeg', 0.92)
    }, 800)
    try {
      localStorage.setItem(INVITED_KEY, String(Date.now()))
    } catch {
      // Private browsing: nothing to remember.
    }
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [mode])

  const changeName = (value: string) => {
    const next = value.slice(0, 36)
    setName(next)
    nameRef.current = next
    if (missing) setMissing(false)
    caret.current.visible = true
    if (three.current) {
      requestAnimationFrame(engrave)
      window.clearTimeout(letterTimer.current)
      letterTimer.current = window.setTimeout(() => void three.current?.prepareLetter(next, toRef.current), 650)
    } else if (flat.current) setInviteName(flat.current, next || ' ', toRef.current)
  }

  const changeRecipient = (value: string) => {
    const next = value.slice(0, 36)
    setRecipient(next)
    toRef.current = next
    if (three.current) {
      window.clearTimeout(letterTimer.current)
      letterTimer.current = window.setTimeout(() => void three.current?.prepareLetter(nameRef.current, next), 650)
    } else if (flat.current && nameRef.current.trim()) setInviteName(flat.current, nameRef.current, next)
  }

  const open = () => {
    const clean = name.trim()
    if (!(three.current || flat.current) || modeRef.current !== 'edit') return
    if (!clean) {
      setMissing(true)
      field.current?.focus()
      return
    }
    window.clearTimeout(letterTimer.current)
    if (three.current) three.current.setName(clean, recipient.trim())
    else if (flat.current) setInviteName(flat.current, clean, recipient.trim())
    image.current = null
    setVideo(null)
    setNote('')
    setSharePanel(false)
    field.current?.blur()
    setMode('opening')
  }

  const edit = () => {
    setMode('edit')
    setVideo(null)
    setSharePanel(false)
    setNote('')
    requestAnimationFrame(() => {
      stageBox.current?.scrollIntoView({ block: 'center' })
      if (!window.matchMedia('(max-width: 1023px)').matches) field.current?.focus({ preventScroll: true })
    })
  }

  // While it opens and while it's open, the page behind stays still. Escape closes it.
  useEffect(() => {
    if (mode === 'edit') return
    const html = document.documentElement
    html.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && edit()
    window.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- edit only changes state
  }, [mode])

  const fileName = (ext: string) => `dunamis-at-30-invitation-${(recipient.trim() ? `for ${recipient.trim()}` : name.trim() || 'from-me').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${ext}`

  const save = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName(ext)
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  const picture = async () => {
    if (image.current) return image.current
    const scene = flatScene()
    if (!scene) throw new Error('The picture could not be made.')
    const blob = await new Promise<Blob | null>((resolve) => renderInviteImage(scene).toBlob(resolve, 'image/jpeg', 0.92))
    if (!blob) throw new Error('The picture could not be made.')
    image.current = blob
    return blob
  }

  const link = () => new URL('/', window.location.origin).toString()

  const sharePicture = async () => {
    setBusy('share')
    try {
      const file = new File([await picture()], fileName('jpg'), { type: 'image/jpeg' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Dunamis at 30', text: `${SHARE_TEXT} ${link()}` })
      } else {
        save(file, 'jpg')
        setSharePanel(true)
      }
    } catch (error) {
      // Closing the share sheet isn't a failure. Anything else is, and they still need a way to send it.
      if ((error as Error).name !== 'AbortError' && image.current) {
        save(image.current, 'jpg')
        setSharePanel(true)
      }
    } finally {
      setBusy('')
    }
  }

  const download = async () => {
    try {
      save(await picture(), 'jpg')
    } catch {
      setNote('Your invitation couldn’t be saved. Please try again.')
    }
  }

  const makeVideo = async () => {
    setBusy('video')
    setProgress(0)
    try {
      let made: { blob: Blob; ext: string }
      if (art3d.current) {
        // The video has its own 3D stage, made for 1080×1920 and with the dark backdrop.
        const { createInviteStage, recordInvite } = await import('@/lib/invite3d')
        const recorder = await createInviteStage(art3d.current, font.current, { preserve: true, backdrop: true, light: light.current, detail: 1.1, letterDetail: 1 })
        try {
          recorder.setName(name.trim(), recipient.trim())
          made = await recordInvite(recorder, setProgress)
        } finally {
          recorder.dispose()
        }
      } else {
        const scene = flatScene()
        if (!scene) throw new Error('Nothing to record')
        made = await makeInviteVideo(scene, setProgress)
      }
      const file = new File([made.blob], fileName(made.ext), { type: made.blob.type })
      const canShare = Boolean(navigator.canShare?.({ files: [file] }))
      setVideo({ file, canShare })
      // Where it can't be handed to other apps, it goes straight to the device.
      if (!canShare) save(file, made.ext)
    } catch {
      setNote('Your browser can’t make the video, so please send the picture instead.')
    } finally {
      setBusy('')
    }
  }

  const shareVideo = async () => {
    if (!video) return
    try {
      await navigator.share({ files: [video.file], title: 'Dunamis at 30', text: `${SHARE_TEXT} ${link()}` })
    } catch (error) {
      if ((error as Error).name !== 'AbortError') save(video.file, video.file.name.split('.').pop() ?? 'mp4')
    }
  }

  const firstName = name.trim().split(/\s+/)[0] ?? ''
  const guestName = recipient.trim().split(/\s+/)[0] ?? ''

  return (
    <>
      <div className="mx-auto grid max-w-[1120px] gap-4 lg:grid-cols-2 lg:items-center lg:gap-12">
        {/* The envelope, floating on the page */}
        <div className="relative isolate lg:order-2">
          <div aria-hidden className="glow absolute inset-[-10%] -z-10 [--glow-strength:0.2]" />
          <div
            ref={stageBox}
            onClick={() => has3d && field.current?.focus()}
            className={`relative mx-auto max-lg:-mx-5 max-lg:w-[calc(100%+40px)] lg:max-w-[600px] ${has3d ? 'aspect-[10/9] cursor-text lg:aspect-square max-lg:landscape:mx-auto max-lg:landscape:h-[calc(100svh-170px)] max-lg:landscape:w-auto' : 'aspect-[9/16] max-h-[70svh]'}`}
          >
            {/* The drawing reaches past the stage, so the envelope's soft shadow is never cut off at an edge. */}
            <div ref={stageCanvasBox} className={`pointer-events-none absolute ${has3d ? 'inset-x-0 -inset-y-[12%] lg:-inset-[9%]' : 'inset-0'}`}>
            {ready && has3d && mode === 'edit' && (
              <input
                ref={field}
                value={name}
                onChange={(e) => changeName(e.target.value)}
                onSelect={engrave}
                onKeyUp={engrave}
                onFocus={() => {
                  setFocused(true)
                  caret.current.visible = true
                  engrave()
                }}
                onBlur={() => {
                  setFocused(false)
                  engrave()
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  open()
                }}
                autoComplete="name"
                enterKeyHint="go"
                spellCheck={false}
                aria-label="Your name, to write on the envelope"
                aria-invalid={missing || undefined}
                className={`pointer-events-auto absolute z-10 border-0 bg-transparent p-0 text-center font-semibold text-transparent caret-transparent outline-none selection:bg-transparent ${!name && !focused ? 'invite-write-here' : ''}`}
              />
            )}
            {/* Until they start, the envelope shows where the name goes. */}
            {ready && has3d && mode === 'edit' && !name && (
              <div ref={hint} aria-hidden className={`pointer-events-none absolute z-10 flex flex-col items-center gap-1 text-center transition-opacity duration-300 ${focused ? 'opacity-0' : 'opacity-100'}`}>
                <svg width="18" height="22" viewBox="0 0 18 22" fill="none" className="invite-hint-arrow text-gold">
                  <path d="M9 20V3M3 9l6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[13px] font-medium whitespace-nowrap text-gold-light [text-shadow:0_1px_10px_rgb(0_0_0/0.95)] sm:text-sm">Tap here and write your name</span>
              </div>
            )}
            </div>
            {!ready && <p className="absolute inset-0 grid place-items-center p-6 text-center">{failed ? 'We couldn’t load the envelope. Please check your connection and reload this page.' : 'Loading…'}</p>}
          </div>
        </div>

        {/* What to do */}
        <div className="lg:order-1 lg:rounded-3xl lg:border lg:border-hair lg:bg-surface lg:p-10">
          <h2 className="h-card hidden lg:block">Write your name on the envelope</h2>
          <p className="hidden lg:mt-3 lg:mb-8 lg:block">The envelope carries your name. Add who it’s for, and the letter inside is written to them, with the dates, the venue and this year’s guest ministers, to send as a picture or a short video.</p>
          {!has3d && (
            <input
              value={name}
              onChange={(e) => changeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                open()
              }}
              autoComplete="name"
              placeholder="Your name"
              aria-label="Your name, for the envelope"
              className="mb-3 min-h-[50px] w-full rounded-lg border border-line bg-hair px-4 text-base text-fg placeholder:text-[#999] focus:border-white focus:outline-none"
            />
          )}
          <label className="mb-3 block">
            <span className="mb-1.5 block text-sm font-medium text-fg">Who is this invitation for?</span>
            <input
              value={recipient}
              onChange={(e) => changeRecipient(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                open()
              }}
              autoComplete="off"
              enterKeyHint="go"
              placeholder="Their name"
              disabled={mode !== 'edit'}
              className="min-h-[50px] w-full rounded-lg border border-line bg-hair px-4 text-base text-fg placeholder:text-[#999] focus:border-gold focus:outline-none"
            />
          </label>
          {missing && (
            <p role="alert" className="mb-3 text-center text-sm text-[#ffb3a8] lg:text-left">
              Please write your name on the envelope first.
            </p>
          )}
          <button type="button" onClick={open} disabled={!ready || mode !== 'edit'} className="btn btn-primary w-full disabled:opacity-60">
            Open my invitation
          </button>
          <p className="mt-3 text-center text-sm lg:text-left">{has3d ? 'Tap the envelope to write your name. Both names stay on your device and are never uploaded.' : 'Both names stay on your device. They’re never uploaded.'}</p>
        </div>
      </div>

      {/* The opening: the page goes, the envelope comes forward and opens, and then it can be sent */}
      {mode !== 'edit' && (
        <div role="dialog" aria-modal="true" aria-label="Your invitation" className="fixed inset-0 z-[80] flex flex-col">
          <div aria-hidden className="invite-backdrop absolute inset-0 bg-canvas">
            <div className="bg-ticks absolute inset-0 opacity-50" />
            <div className="flare absolute inset-x-0 bottom-0 h-[45%] opacity-40" />
          </div>
          <button
            type="button"
            onClick={edit}
            aria-label="Close and change the names"
            className="absolute top-4 right-4 z-10 grid size-11 place-items-center rounded-full border border-white/15 bg-surface/80 text-fg backdrop-blur transition-colors hover:border-gold"
          >
            <Close width={20} height={20} />
          </button>
          <div ref={presentBox} className="relative min-h-0 flex-1" />
          <div
            aria-live="polite"
            className={`relative z-10 px-4 pt-2 pb-[max(14px,env(safe-area-inset-bottom))] transition-[opacity,transform] duration-700 ${mode === 'open' ? '' : 'pointer-events-none translate-y-3 opacity-0'}`}
          >
            <p className="mx-auto mb-3 max-w-[560px] text-center text-[15px] text-fg sm:text-base [@media(max-height:500px)]:hidden">
              {mode === 'open' ? (guestName ? `Your invitation for ${guestName} is ready, ${firstName}. Send it to them and we’ll see them at the Glory Dome.` : `Your invitation is ready${firstName ? `, ${firstName}` : ''}. Send it to someone you’d love to see at the Glory Dome.`) : ' '}
            </p>
            <div className="mx-auto grid max-w-[680px] grid-cols-2 gap-2.5 sm:grid-cols-4">
              <button type="button" onClick={sharePicture} disabled={busy === 'share'} className="btn btn-primary disabled:opacity-60">
                <Share width={18} height={18} /> Share
              </button>
              <button type="button" onClick={download} className="btn btn-outline">
                Download
              </button>
              {video?.canShare ? (
                <button type="button" onClick={shareVideo} className="btn btn-outline">
                  Share video
                </button>
              ) : (
                <button type="button" onClick={makeVideo} disabled={busy === 'video'} className="btn btn-outline disabled:opacity-60">
                  {busy === 'video' ? `Making video ${Math.round(progress * 100)}%` : video ? 'Video saved' : 'Video'}
                </button>
              )}
              <button type="button" onClick={edit} className="btn btn-outline">
                Change names
              </button>
            </div>
            {video?.canShare && (
              <button type="button" onClick={() => save(video.file, video.file.name.split('.').pop() ?? 'mp4')} className="mx-auto mt-3 block text-sm text-gold-light underline underline-offset-4">
                Save the video instead
              </button>
            )}
            {note && <p className="mx-auto mt-3 max-w-[560px] rounded-lg border border-line bg-hair p-3 text-center text-sm">{note}</p>}
          </div>

          {/* For browsers that can't hand a picture to other apps: it's saved, and these open the apps. */}
          {sharePanel && (
            <div role="status" className="card fixed inset-x-3 bottom-3 z-20 mx-auto max-w-[480px] p-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.95)] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[15px] text-fg">We saved your invitation to your device. Open an app below and add it to your message, or post it from your gallery.</p>
                <button type="button" onClick={() => setSharePanel(false)} aria-label="Close" className="shrink-0 text-fg">
                  <Close width={18} height={18} />
                </button>
              </div>
              <ShareButtons url="/" text={SHARE_TEXT} className="mt-3" />
            </div>
          )}
        </div>
      )}
    </>
  )
}
