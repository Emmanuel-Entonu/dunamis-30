/*
 * Canvas renderer for "Invite someone". A black metal envelope, finished like the card's slip, is closed with
 * a struck-gold button carrying the Dunamis logo. The button unclips, the flap opens, and a white and gold
 * letter comes out and unfolds into a personal invitation. One tall size (1080×1920), like the card.
 *
 * prepareInvite() draws everything that doesn't move, once. drawInvite(ctx, scene, s) paints the scene at
 * s seconds. The page shows the sealed envelope at TIMING.rest while it asks for a name, then plays on to
 * TIMING.duration; the video runs from 0 and holds the end. The last frame is the picture people share.
 * Everything runs in the browser.
 */

import { DEEP_GOLD, EVENT, foil, GOLD, roundRect, spaced } from './cardFrames'

export const INVITE = { w: 1080, h: 1920 }
/** Seconds. */
export const TIMING = { rest: 1.2, duration: 8, hold: 2.4 }

export type InviteArt = { emblem: HTMLImageElement; button: HTMLImageElement | HTMLCanvasElement; ministers: HTMLImageElement }

// ---------- helpers ----------
const clamp = (v: number) => Math.max(0, Math.min(1, v))
const seg = (s: number, [a, b]: readonly [number, number]) => clamp((s - a) / (b - a))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const easeOut = (v: number) => 1 - (1 - v) ** 3
const easeInOut = (v: number) => (v < 0.5 ? 4 * v ** 3 : 1 - (-2 * v + 2) ** 3 / 2)
const easeOutBack = (v: number) => 1 + 2.4 * (v - 1) ** 3 + 1.4 * (v - 1) ** 2

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = Math.ceil(w)
  c.height = Math.ceil(h)
  return c
}
const context = (c: HTMLCanvasElement) => c.getContext('2d')!

/** The same sparkles in every frame and every video. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function noise(size: number, seed: number) {
  const c = makeCanvas(size, size)
  const g = context(c)
  const img = g.createImageData(size, size)
  const random = seeded(seed)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = random() * 255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  g.putImageData(img, 0, 0)
  return c
}

function grainOver(ctx: CanvasRenderingContext2D, grain: HTMLCanvasElement, w: number, h: number, alpha: number) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.globalCompositeOperation = 'overlay'
  ctx.fillStyle = ctx.createPattern(grain, 'repeat')!
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

/** Text centred on x. Canvas letter-spacing also follows the last letter, so that half is given back. */
function centred(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing = 0) {
  spaced(ctx, spacing)
  ctx.textAlign = 'center'
  ctx.fillText(text, x + spacing / 2, y)
  spaced(ctx, 0)
}

/** The largest size, from max down to min, at which the text fits the width. */
function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, font: string, max: number, min: number, width: number) {
  let size = max
  ctx.font = `${weight} ${size}px ${font}`
  while (size > min && ctx.measureText(text).width > width) {
    size -= 2
    ctx.font = `${weight} ${size}px ${font}`
  }
  return size
}

/** One line if it fits, else the two most even lines. */
function lines(ctx: CanvasRenderingContext2D, text: string, width: number) {
  if (ctx.measureText(text).width <= width) return [text]
  const words = text.split(/\s+/)
  let best = [text]
  let spread = Infinity
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ')
    const b = words.slice(i).join(' ')
    const wa = ctx.measureText(a).width
    const wb = ctx.measureText(b).width
    if (Math.max(wa, wb) > width) continue
    if (Math.abs(wa - wb) < spread) {
      spread = Math.abs(wa - wb)
      best = [a, b]
    }
  }
  return best
}

const BRIGHT = ['#a8781f', '#f6dc95', '#c48f2a', '#fff0c4', '#b07a1c']
const INK = { text: '#3a3122', strong: '#17130c', soft: 'rgba(58,49,34,0.82)' }

// ---------- the envelope: geometry, in its own units ----------
const EW = 940
const EH = 600
/** The button sits in a round tab at the point of the flap. */
const BUTTON = { x: EW / 2, y: 300, r: 80 }
const TAB_R = 92
const FLAP_DEPTH = BUTTON.y + TAB_R
const SOCKET_R = 27
const LABEL_Y = 474
const NAME_Y = 534
const NAME_SIZE = 44
/** Textures are drawn a little larger than used, so they stay sharp when the envelope grows. */
const TEX = 1.15
const PAD = 160 // room around the envelope for its shadow

/** The flap: straight sides running into the round tab that holds the button. */
function flapPath() {
  const p = new Path2D()
  const d = Math.hypot(BUTTON.x, BUTTON.y)
  const toCentre = Math.atan2(BUTTON.y, BUTTON.x)
  const reach = Math.sqrt(d * d - TAB_R * TAB_R)
  const along = toCentre + Math.asin(TAB_R / d)
  const tx = Math.cos(along) * reach
  const ty = Math.sin(along) * reach
  const start = Math.atan2(ty - BUTTON.y, tx - BUTTON.x)
  p.moveTo(0, 0)
  p.lineTo(EW, 0)
  p.lineTo(EW - tx, ty)
  p.arc(BUTTON.x, BUTTON.y, TAB_R, Math.PI - start, start, false)
  p.closePath()
  return p
}

function bodyPath() {
  const p = new Path2D()
  const r = 18
  p.moveTo(r, 0)
  p.arcTo(EW, 0, EW, EH, r)
  p.arcTo(EW, EH, 0, EH, r)
  p.arcTo(0, EH, 0, 0, r)
  p.arcTo(0, 0, EW, 0, r)
  p.closePath()
  return p
}

const SIDE_APEX = { x: EW * 0.475, y: EH * 0.535 }
const BOTTOM_APEX_Y = EH * 0.39

function leftFlap() {
  const p = new Path2D()
  p.moveTo(-4, -4)
  p.arcTo(SIDE_APEX.x, SIDE_APEX.y, -4, EH + 4, 34)
  p.lineTo(-4, EH + 4)
  p.closePath()
  return p
}
function rightFlap() {
  const p = new Path2D()
  p.moveTo(EW + 4, -4)
  p.arcTo(EW - SIDE_APEX.x, SIDE_APEX.y, EW + 4, EH + 4, 34)
  p.lineTo(EW + 4, EH + 4)
  p.closePath()
  return p
}
function bottomFlap() {
  const p = new Path2D()
  p.moveTo(-4, EH + 4)
  p.arcTo(EW / 2, BOTTOM_APEX_Y, EW + 4, EH + 4, 80)
  p.lineTo(EW + 4, EH + 4)
  p.closePath()
  return p
}

/** Graphite, like the slip: light at the top, falling away to black. */
function graphite(ctx: CanvasRenderingContext2D, y0: number, y1: number, lift = 0) {
  const g = ctx.createLinearGradient(0, y0, 0, y1)
  g.addColorStop(0, `rgb(${40 + lift},${40 + lift},${40 + lift})`)
  g.addColorStop(0.46, `rgb(${23 + lift},${23 + lift},${23 + lift})`)
  g.addColorStop(1, `rgb(${12 + lift / 2},${12 + lift / 2},${12 + lift / 2})`)
  return g
}

/** Fine lines fanning out from the button, as they fan from the notch on the slip. */
function sunburst(scale = TEX, centre = { x: BUTTON.x, y: BUTTON.y }) {
  const c = makeCanvas(EW * scale, EH * scale)
  const ctx = context(c)
  ctx.scale(scale, scale)
  ctx.translate(centre.x, centre.y)
  ctx.fillStyle = 'rgba(255,255,255,0.085)'
  const reach = 1100
  for (let a = 0; a < Math.PI * 2; a += (5.5 * Math.PI) / 180) {
    const half = (0.25 * Math.PI) / 180
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(a - half) * reach, Math.sin(a - half) * reach)
    ctx.lineTo(Math.cos(a + half) * reach, Math.sin(a + half) * reach)
    ctx.closePath()
    ctx.fill()
  }
  // Strongest near the button, gone before the edges.
  ctx.globalCompositeOperation = 'destination-in'
  ctx.scale(1.25, 1)
  const fade = ctx.createRadialGradient(0, 0, 0, 0, 0, 560)
  fade.addColorStop(0, 'rgba(0,0,0,0)')
  fade.addColorStop(0.12, 'rgba(0,0,0,1)')
  fade.addColorStop(0.75, 'rgba(0,0,0,0.12)')
  fade.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = fade
  ctx.fillRect(-EW, -EH, EW * 2, EH * 2)
  return c
}

/** The sheen and the diagonal reflection of the slip, over a whole face. */
function sheen(ctx: CanvasRenderingContext2D, w: number, h: number, strength = 1) {
  ctx.save()
  ctx.scale(1.1, 0.55)
  const r = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(w, h) * 0.62)
  r.addColorStop(0, `rgba(255,255,255,${0.13 * strength})`)
  r.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = r
  ctx.fillRect(0, 0, w * 2, h * 2)
  ctx.restore()
  const angle = (118 * Math.PI) / 180
  const dx = Math.sin(angle)
  const dy = -Math.cos(angle)
  const len = Math.abs(w * dx) + Math.abs(h * dy)
  const cx = w / 2
  const cy = h / 2
  const band = ctx.createLinearGradient(cx - (dx * len) / 2, cy - (dy * len) / 2, cx + (dx * len) / 2, cy + (dy * len) / 2)
  band.addColorStop(0.36, 'rgba(255,255,255,0)')
  band.addColorStop(0.46, `rgba(255,255,255,${0.075 * strength})`)
  band.addColorStop(0.57, 'rgba(255,255,255,0)')
  ctx.fillStyle = band
  ctx.fillRect(0, 0, w, h)
}

/** A lit rim along an edge, like the light caught by the slip's notch. */
function rim(ctx: CanvasRenderingContext2D, path: Path2D, alpha: number, width = 3) {
  ctx.save()
  ctx.clip(path)
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`
  ctx.lineWidth = width
  ctx.stroke(path)
  ctx.restore()
}

/** Gold lining with a fine lattice, inside the envelope and its flap. */
function liningPattern(ctx: CanvasRenderingContext2D) {
  const tile = makeCanvas(56, 56)
  const t = context(tile)
  t.strokeStyle = 'rgba(96,62,12,0.32)'
  t.lineWidth = 1.2
  t.beginPath()
  t.moveTo(0, 0)
  t.lineTo(56, 56)
  t.moveTo(56, 0)
  t.lineTo(0, 56)
  t.stroke()
  t.fillStyle = 'rgba(255,246,214,0.55)'
  t.beginPath()
  t.moveTo(28, 23)
  t.lineTo(33, 28)
  t.lineTo(28, 33)
  t.lineTo(23, 28)
  t.closePath()
  t.fill()
  return ctx.createPattern(tile, 'repeat')!
}

function lining(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, '#f0d79c')
  g.addColorStop(0.35, '#c99d4f')
  g.addColorStop(0.6, '#e7c784')
  g.addColorStop(1, '#a87c2f')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = liningPattern(ctx)
  ctx.fillRect(0, 0, w, h)
}

// ---------- the letter ----------
const LW = 860
const PH = 540
const LH = PH * 3
const LETTER_SCALE = 0.94
const LETTER_TOP = 52
const LETTER_MID = LETTER_TOP + PH * LETTER_SCALE * 1.5

function paper(ctx: CanvasRenderingContext2D, w: number, h: number, grain: HTMLCanvasElement) {
  const g = ctx.createLinearGradient(0, 0, w * 0.35, h)
  g.addColorStop(0, '#fffefb')
  g.addColorStop(0.6, '#fdf9f0')
  g.addColorStop(1, '#f6ecd6')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  const r = ctx.createRadialGradient(w * 0.2, 0, 0, w * 0.2, 0, h * 0.8)
  r.addColorStop(0, 'rgba(255,226,160,0.18)')
  r.addColorStop(1, 'rgba(255,226,160,0)')
  ctx.fillStyle = r
  ctx.fillRect(0, 0, w, h)
  grainOver(ctx, grain, w, h, 0.05)
}

function frame(ctx: CanvasRenderingContext2D, w: number, h: number) {
  roundRect(ctx, 18, 18, w - 36, h - 36, 16)
  ctx.strokeStyle = foil(ctx, 0, 0, w, h)
  ctx.lineWidth = 3
  ctx.stroke()
  roundRect(ctx, 28, 28, w - 56, h - 56, 10)
  ctx.strokeStyle = 'rgba(154,106,12,0.35)'
  ctx.lineWidth = 1.2
  ctx.stroke()
}

/** A gold rule with a small diamond in the middle. */
function ornament(ctx: CanvasRenderingContext2D, cx: number, y: number, half: number) {
  ctx.fillStyle = foil(ctx, cx - half, 0, cx + half, 0)
  ctx.fillRect(cx - half, y - 1, half - 16, 2)
  ctx.fillRect(cx + 16, y - 1, half - 16, 2)
  ctx.beginPath()
  ctx.moveTo(cx, y - 7)
  ctx.lineTo(cx + 7, y)
  ctx.lineTo(cx, y + 7)
  ctx.lineTo(cx - 7, y)
  ctx.closePath()
  ctx.fill()
}

type Box = { x: number; y: number; w: number; h: number }

/** The invitation itself. The ministers are drawn over it later, when they rise in. */
function paintLetter(name: string, font: string, art: Pick<InviteArt, 'emblem' | 'ministers'>, grain: HTMLCanvasElement, scale = 1): { canvas: HTMLCanvasElement; ministers: Box } {
  const c = makeCanvas(LW * scale, LH * scale)
  const ctx = context(c)
  ctx.scale(scale, scale)
  paper(ctx, LW, LH, grain)
  frame(ctx, LW, LH)
  const cx = LW / 2
  const wide = LW - 110
  ctx.textBaseline = 'alphabetic'

  const logoH = 86
  const logoW = logoH * (art.emblem.naturalWidth / art.emblem.naturalHeight)
  ctx.drawImage(art.emblem, cx - logoW / 2, 62, logoW, logoH)
  ctx.fillStyle = INK.strong
  ctx.font = `600 22px ${font}`
  centred(ctx, 'DUNAMIS INTERNATIONAL GOSPEL CENTRE', cx, 190, 3.2)
  ornament(ctx, cx, 222, 74)

  ctx.font = `700 24px ${font}`
  ctx.fillStyle = foil(ctx, cx - 170, 0, cx + 170, 0, GOLD)
  centred(ctx, 'YOU ARE INVITED', cx, 292, 7)

  // The name, as large as it will go, on up to two lines.
  let size = fit(ctx, name, 700, font, 84, 56, wide)
  let nameLines = [name]
  if (ctx.measureText(name).width > wide) {
    size = 64
    ctx.font = `700 ${size}px ${font}`
    nameLines = lines(ctx, name, wide)
    while (size > 36 && nameLines.some((l) => ctx.measureText(l).width > wide)) {
      size -= 2
      ctx.font = `700 ${size}px ${font}`
      nameLines = lines(ctx, name, wide)
    }
  }
  let y = 292 + 30 + size * 0.76
  ctx.save()
  ctx.shadowColor = 'rgba(120,80,10,0.25)'
  ctx.shadowBlur = 2
  ctx.shadowOffsetY = 1
  ctx.fillStyle = foil(ctx, cx - 300, 0, cx + 300, 0, ['#6f4a07', '#b07c1c', '#7c540b', '#c08a26', '#73500a'])
  nameLines.forEach((line, i) => {
    if (i) y += size * 1.08
    centred(ctx, line, cx, y)
  })
  ctx.restore()

  y += 62
  ctx.fillStyle = INK.text
  ctx.font = `500 36px ${font}`
  centred(ctx, 'is inviting you to the', cx, y)

  ctx.font = `700 50px ${font}`
  ctx.fillStyle = INK.strong
  lines(ctx, 'Dunamis 30th Anniversary Celebration', wide).forEach((line, i) => {
    y += i ? 60 : 70
    centred(ctx, line, cx, y)
  })

  y += 46
  ctx.fillStyle = foil(ctx, cx - 270, 0, cx + 270, 0)
  ctx.fillRect(cx - 270, y - 1, 540, 2)

  y += 62
  ctx.fillStyle = INK.strong
  fit(ctx, EVENT.title, 600, font, 33, 24, wide)
  centred(ctx, EVENT.title, cx, y)
  y += 44
  ctx.fillStyle = INK.soft
  ctx.font = `500 28px ${font}`
  centred(ctx, 'Theme: Open Heavens', cx, y)
  y += 74
  fit(ctx, EVENT.date, 700, font, 54, 40, wide)
  ctx.fillStyle = foil(ctx, cx - 300, 0, cx + 300, 0, DEEP_GOLD)
  centred(ctx, EVENT.date, cx, y)
  y += 52
  ctx.fillStyle = INK.strong
  ctx.font = `600 36px ${font}`
  centred(ctx, EVENT.venue, cx, y)

  ctx.fillStyle = INK.soft
  ctx.font = `600 22px ${font}`
  centred(ctx, '#Dunamis@30   ·   dunamis30thanniversary.com', cx, LH - 52, 1)

  // The guest ministers and our pastors stand across the foot, above the web address.
  const bottom = LH - 90
  const ratio = art.ministers.naturalWidth / art.ministers.naturalHeight
  let h = bottom - (y + 34)
  let w = h * ratio
  if (w > LW - 120) {
    w = LW - 120
    h = w / ratio
  }
  return { canvas: c, ministers: { x: cx - w / 2, y: bottom - h, w, h } }
}

/** The outside of the folded letter. */
function paintCover(font: string, grain: HTMLCanvasElement, scale = 1) {
  const c = makeCanvas(LW * scale, PH * scale)
  const ctx = context(c)
  ctx.scale(scale, scale)
  paper(ctx, LW, PH, grain)
  frame(ctx, LW, PH)
  const cx = LW / 2
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = INK.soft
  ctx.font = `600 17px ${font}`
  centred(ctx, 'DUNAMIS INTERNATIONAL GOSPEL CENTRE', cx, 196, 3.4)
  ctx.font = `700 46px ${font}`
  ctx.fillStyle = foil(ctx, cx - 260, 0, cx + 260, 0, GOLD)
  centred(ctx, 'YOU ARE INVITED', cx, 278, 10)
  ornament(ctx, cx, 318, 110)
  ctx.fillStyle = INK.soft
  ctx.font = `600 22px ${font}`
  centred(ctx, 'DUNAMIS@30', cx, 372, 6)
  return c
}

/** The back of the bottom third: plain paper with a hairline. */
function paintPlain(grain: HTMLCanvasElement, scale = 1) {
  const c = makeCanvas(LW * scale, PH * scale)
  const ctx = context(c)
  ctx.scale(scale, scale)
  paper(ctx, LW, PH, grain)
  roundRect(ctx, 28, 28, LW - 56, PH - 56, 10)
  ctx.strokeStyle = 'rgba(154,106,12,0.22)'
  ctx.lineWidth = 1.2
  ctx.stroke()
  return c
}

// ---------- the scene ----------
export type InviteScene = {
  font: string
  name: string
  art: InviteArt
  grain: HTMLCanvasElement
  /** Painted the first time it's needed: the home page never shows it. */
  backdrop: HTMLCanvasElement | null
  shadow: HTMLCanvasElement
  pocket: HTMLCanvasElement
  liner: HTMLCanvasElement
  flapOut: HTMLCanvasElement
  flapIn: HTMLCanvasElement
  glint: HTMLCanvasElement
  letter: HTMLCanvasElement | null
  ministers: Box
  cover: HTMLCanvasElement
  plain: HTMLCanvasElement
}

function paintBackdrop(grain: HTMLCanvasElement) {
  const { w, h } = INVITE
  const c = makeCanvas(w, h)
  const ctx = context(c)
  const g = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, h * 0.7)
  g.addColorStop(0, '#1d160d')
  g.addColorStop(0.5, '#0d0a07')
  g.addColorStop(1, '#050404')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  // The site's gold halftone flare, rising from the bottom edge.
  const random = seeded(11)
  for (let y = h * 0.5; y < h; y += 9) {
    for (let x = 4; x < w; x += 9) {
      const d = Math.hypot((x - w / 2) / (w * 0.75), (y - h) / (h * 0.5))
      const a = Math.max(0, 1 - d) ** 1.6 * 0.5
      if (a < 0.01) continue
      ctx.fillStyle = `rgba(255,190,90,${a * (0.75 + random() * 0.25)})`
      ctx.beginPath()
      ctx.arc(x, y, 1.15, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  const flare = ctx.createRadialGradient(w / 2, h, 0, w / 2, h, h * 0.55)
  flare.addColorStop(0, 'rgba(227,154,23,0.38)')
  flare.addColorStop(0.45, 'rgba(184,115,11,0.1)')
  flare.addColorStop(1, 'rgba(184,115,11,0)')
  ctx.fillStyle = flare
  ctx.fillRect(0, 0, w, h)
  grainOver(ctx, grain, w, h, 0.08)
  return c
}

function paintShadow() {
  const c = makeCanvas((EW + PAD * 2) / 2, (EH + PAD * 2) / 2)
  const ctx = context(c)
  ctx.scale(0.5, 0.5)
  ctx.translate(PAD - 10000, PAD)
  ctx.shadowOffsetX = 10000 * 0.5
  ctx.shadowOffsetY = 30 * 0.5
  ctx.shadowBlur = 34
  ctx.shadowColor = 'rgba(0,0,0,0.8)'
  ctx.fill(bodyPath())
  ctx.shadowOffsetY = 6 * 0.5
  ctx.shadowBlur = 10
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.fill(bodyPath())
  return c
}

function paintPocket(burst: HTMLCanvasElement, scale = TEX) {
  const c = makeCanvas(EW * scale, EH * scale)
  const ctx = context(c)
  const k = scale / TEX
  ctx.scale(scale, scale)
  ctx.save()
  ctx.clip(bodyPath())
  const faces: [Path2D, number, boolean][] = [
    [leftFlap(), 2, false],
    [rightFlap(), -4, false],
    [bottomFlap(), 4, true],
  ]
  for (const [path, lift, overlaps] of faces) {
    ctx.save()
    // Each flap lies on the ones before it, and on the lining, and casts a little shadow.
    ctx.shadowColor = 'rgba(0,0,0,0.55)'
    ctx.shadowBlur = (overlaps ? 26 : 30) * k
    ctx.shadowOffsetY = (overlaps ? -4 : 0) * k
    ctx.fillStyle = graphite(ctx, overlaps ? BOTTOM_APEX_Y : 0, EH, lift)
    ctx.fill(path)
    ctx.restore()
    ctx.save()
    ctx.clip(path)
    ctx.drawImage(burst, 0, 0, EW, EH)
    sheen(ctx, EW, EH, 0.9)
    ctx.restore()
    rim(ctx, path, 0.2)
  }
  ctx.restore()
  // The edges of the whole envelope catch the light too.
  const body = bodyPath()
  rim(ctx, body, 0.08, 2)
  ctx.save()
  ctx.clip(body)
  ctx.fillStyle = 'rgba(255,255,255,0.16)'
  ctx.fillRect(0, 0, EW, 1.2)
  ctx.restore()
  return c
}

function paintLiner(scale = TEX) {
  const c = makeCanvas(EW * scale, EH * scale)
  const ctx = context(c)
  ctx.scale(scale, scale)
  const body = bodyPath()
  ctx.fillStyle = graphite(ctx, 0, EH, -6)
  ctx.fill(body)
  ctx.save()
  roundRect(ctx, 16, 16, EW - 32, EH - 32, 10)
  ctx.clip()
  lining(ctx, EW, EH)
  // Deep inside, the lining is in shadow.
  const depth = ctx.createLinearGradient(0, 0, 0, EH * 0.6)
  depth.addColorStop(0, 'rgba(20,12,2,0.15)')
  depth.addColorStop(1, 'rgba(20,12,2,0.6)')
  ctx.fillStyle = depth
  ctx.fillRect(0, 0, EW, EH)
  ctx.restore()
  return c
}

function paintFlapOutside(burst: HTMLCanvasElement, scale = TEX) {
  const c = makeCanvas(EW * scale, (FLAP_DEPTH + 40) * scale)
  const ctx = context(c)
  const k = scale / TEX
  ctx.scale(scale, scale)
  const flap = flapPath()
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.7)'
  ctx.shadowBlur = 22 * k
  ctx.shadowOffsetY = 10 * k
  ctx.fillStyle = graphite(ctx, 0, FLAP_DEPTH, 6)
  ctx.fill(flap)
  ctx.restore()
  ctx.save()
  ctx.clip(flap)
  ctx.drawImage(burst, 0, 0, EW, EH)
  sheen(ctx, EW, FLAP_DEPTH, 1)
  ctx.restore()
  rim(ctx, flap, 0.24)
  return c
}

function paintFlapInside(scale = TEX) {
  const c = makeCanvas(EW * scale, FLAP_DEPTH * scale)
  const ctx = context(c)
  ctx.scale(scale, scale)
  const flap = flapPath()
  ctx.save()
  ctx.clip(flap)
  lining(ctx, EW, FLAP_DEPTH)
  ctx.restore()
  // The black metal shows round the lining's edge.
  ctx.save()
  ctx.clip(flap)
  ctx.strokeStyle = graphite(ctx, 0, FLAP_DEPTH, 0)
  ctx.lineWidth = 26
  ctx.stroke(flap)
  ctx.restore()
  rim(ctx, flap, 0.18)
  return c
}

/** A four-pointed glint with a soft glow, for the sparkles. */
function paintGlint() {
  const c = makeCanvas(96, 96)
  const ctx = context(c)
  const g = ctx.createRadialGradient(48, 48, 0, 48, 48, 30)
  g.addColorStop(0, 'rgba(255,246,214,0.9)')
  g.addColorStop(0.25, 'rgba(255,214,140,0.35)')
  g.addColorStop(1, 'rgba(255,200,110,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 96, 96)
  ctx.fillStyle = 'rgba(255,250,232,0.95)'
  for (const [w, h] of [
    [3, 44],
    [44, 3],
  ]) {
    ctx.beginPath()
    ctx.ellipse(48, 48, w, h, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  return c
}

/**
 * Everything that doesn't move, drawn once. Pass the visitor's name to draw the letter too; without it the
 * envelope can be shown while the page asks for the name.
 */
export function prepareInvite(art: InviteArt, font: string, name = ''): InviteScene {
  const grain = noise(256, 3)
  const burst = sunburst()
  const scene: InviteScene = {
    font,
    name: '',
    art,
    grain,
    backdrop: null,
    shadow: paintShadow(),
    pocket: paintPocket(burst),
    liner: paintLiner(),
    flapOut: paintFlapOutside(burst),
    flapIn: paintFlapInside(),
    glint: paintGlint(),
    letter: null,
    ministers: { x: 0, y: 0, w: 0, h: 0 },
    cover: paintCover(font, grain),
    plain: paintPlain(grain),
  }
  if (name) setInviteName(scene, name)
  return scene
}

/**
 * The same as prepareInvite, painted a piece at a time with a breath between, so a slow phone never stalls:
 * used to make the picture to share in the background, once the opening is over.
 */
export async function prepareInviteSlowly(art: InviteArt, font: string, name: string): Promise<InviteScene> {
  const breathe = () => new Promise<void>((resolve) => setTimeout(resolve, 16))
  const grain = noise(256, 3)
  const burst = sunburst()
  const scene = { font, name: '', art, grain, backdrop: null, letter: null, ministers: { x: 0, y: 0, w: 0, h: 0 } } as unknown as InviteScene
  const steps: [keyof InviteScene, () => HTMLCanvasElement][] = [
    ['shadow', paintShadow],
    ['pocket', () => paintPocket(burst)],
    ['liner', () => paintLiner()],
    ['flapOut', () => paintFlapOutside(burst)],
    ['flapIn', () => paintFlapInside()],
    ['glint', paintGlint],
    ['cover', () => paintCover(font, grain)],
    ['plain', () => paintPlain(grain)],
    ['backdrop', () => paintBackdrop(grain)],
  ]
  for (const [key, paint] of steps) {
    ;(scene as unknown as Record<string, unknown>)[key] = paint()
    await breathe()
  }
  if (name) setInviteName(scene, name)
  return scene
}

/** Writes the letter for this name. */
export function setInviteName(scene: InviteScene, name: string) {
  const clean = name.trim().replace(/\s+/g, ' ')
  if (scene.letter && scene.name === clean) return
  const { canvas, ministers } = paintLetter(clean, scene.font, scene.art, noise(256, 5))
  scene.letter = canvas
  scene.ministers = ministers
  scene.name = clean
}

// ---------- the timeline, in seconds ----------
const K = {
  intro: [0, 0.9],
  glint: [1.25, 1.95],
  press: [1.95, 2.08],
  pop: [2.08, 2.32],
  flap: [2.28, 3.35],
  out: [3.15, 4.7],
  top: [4.6, 5.5],
  bottom: [5.3, 6.2],
  ministers: [6.0, 7.0],
  shine: [6.5, 7.6],
} as const

type Pose = { cx: number; top: number; scale: number }
const SEALED: Pose = { cx: INVITE.w / 2, top: 640, scale: 1 }
const OPENED: Pose = { cx: INVITE.w / 2, top: 1300, scale: 1.1 }

/** Where the name is engraved on the sealed envelope, in card pixels, so the page can put its field there. */
export const NAME_FIELD = (() => {
  const w = 600
  const h = NAME_SIZE * 1.5
  return { x: INVITE.w / 2 - w / 2, y: SEALED.top + NAME_Y - NAME_SIZE * 0.36 - h / 2, w, h, size: NAME_SIZE }
})()

function envelopeAt(s: number): Pose & { alpha: number } {
  const intro = easeOut(seg(s, K.intro))
  const out = easeInOut(seg(s, K.out))
  return {
    cx: SEALED.cx,
    top: lerp(SEALED.top, OPENED.top, out) + (1 - intro) * 110,
    scale: lerp(SEALED.scale, OPENED.scale, out) * (0.94 + 0.06 * intro),
    alpha: clamp(s / 0.55),
  }
}

function letterAt(s: number, env: Pose) {
  const rise = easeInOut(Math.min(1, seg(s, K.out) * 1.12))
  const inside = env.top + (EH / 2 + 8) * env.scale
  return { cx: INVITE.w / 2, mid: lerp(inside, LETTER_MID, rise), scale: lerp(env.scale, LETTER_SCALE, rise), rise }
}

type Sparkle = { x: number; y: number; size: number; phase: number; speed: number; drift: number }
const SPARKLES: Sparkle[] = (() => {
  const random = seeded(29)
  return Array.from({ length: 64 }, () => {
    const a = random() * Math.PI * 2
    const r = Math.sqrt(random())
    return { x: INVITE.w / 2 + Math.cos(a) * r * 560, y: 900 + Math.sin(a) * r * 900, size: 10 + random() * 26, phase: random() * Math.PI * 2, speed: 1.4 + random() * 2.4, drift: 6 + random() * 18 }
  })
})()
const SPARKS = (() => {
  const random = seeded(41)
  return Array.from({ length: 16 }, (_, i) => ({ angle: (i / 16) * Math.PI * 2 + random() * 0.3, speed: 380 + random() * 520, size: 14 + random() * 16 }))
})()

function drawGlint(ctx: CanvasRenderingContext2D, glint: HTMLCanvasElement, x: number, y: number, size: number, alpha: number) {
  if (alpha <= 0.01) return
  ctx.globalAlpha = alpha
  ctx.drawImage(glint, x - size, y - size, size * 2, size * 2)
}

function drawRays(ctx: CanvasRenderingContext2D, x: number, y: number, strength: number, s: number) {
  if (strength <= 0.01) return
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(s * 0.05)
  ctx.globalCompositeOperation = 'lighter'
  const g = ctx.createRadialGradient(0, 0, 40, 0, 0, 1400)
  g.addColorStop(0, `rgba(255,214,140,${0.2 * strength})`)
  g.addColorStop(0.45, `rgba(255,196,100,${0.06 * strength})`)
  g.addColorStop(1, 'rgba(255,196,100,0)')
  ctx.fillStyle = g
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2
    const half = i % 3 === 0 ? 0.075 : 0.035
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, 1400, a - half, a + half)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

/** The button, with its shadow on the envelope. squash is how far the flap has turned. */
function drawButton(ctx: CanvasRenderingContext2D, scene: InviteScene, size: number, lift: number, glint: number, unit: number) {
  const r = BUTTON.r * size
  ctx.save()
  ctx.translate(BUTTON.x, BUTTON.y - lift)
  // Its shadow grows and softens as it comes away.
  ctx.save()
  ctx.shadowColor = `rgba(0,0,0,${0.7 - lift * 0.012})`
  ctx.shadowBlur = (14 + lift * 1.6) * unit
  ctx.shadowOffsetY = (7 + lift * 1.3) * unit
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.97, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  ctx.drawImage(scene.art.button, -r, -r, r * 2, r * 2)
  if (glint > 0 && glint < 1) {
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.clip()
    const x = lerp(-r * 2.2, r * 2.2, glint)
    const band = ctx.createLinearGradient(x - r * 0.7, -r, x + r * 0.7, r)
    band.addColorStop(0, 'rgba(255,240,200,0)')
    band.addColorStop(0.5, 'rgba(255,240,200,0.55)')
    band.addColorStop(1, 'rgba(255,240,200,0)')
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = band
    ctx.fillRect(-r, -r, r * 2, r * 2)
  }
  ctx.restore()
}

/** The socket on the envelope that the button clips into. */
function drawSocket(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.translate(BUTTON.x, BUTTON.y)
  const ring = ctx.createRadialGradient(-8, -10, 2, 0, 0, SOCKET_R)
  ring.addColorStop(0, '#fff0c4')
  ring.addColorStop(0.45, '#c9993f')
  ring.addColorStop(1, '#6a4a12')
  ctx.fillStyle = ring
  ctx.beginPath()
  ctx.arc(0, 0, SOCKET_R, 0, Math.PI * 2)
  ctx.fill()
  const hole = ctx.createRadialGradient(0, -3, 1, 0, 0, SOCKET_R * 0.55)
  hole.addColorStop(0, '#000')
  hole.addColorStop(1, '#2a2116')
  ctx.fillStyle = hole
  ctx.beginPath()
  ctx.arc(0, 0, SOCKET_R * 0.55, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** "An invitation from" and the name, in gold on the black. */
function engrave(ctx: CanvasRenderingContext2D, scene: InviteScene, name: string, unit: number) {
  ctx.save()
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(0,0,0,0.75)'
  ctx.shadowBlur = 3 * unit
  ctx.shadowOffsetY = 1.5 * unit
  ctx.fillStyle = 'rgba(214,180,108,0.85)'
  ctx.font = `600 17px ${scene.font}`
  centred(ctx, 'AN INVITATION FROM', EW / 2, LABEL_Y, 4.5)
  if (name) {
    fit(ctx, name, 600, scene.font, NAME_SIZE, 26, 560)
    ctx.fillStyle = foil(ctx, EW / 2 - 280, 0, EW / 2 + 280, 0, BRIGHT)
    centred(ctx, name, EW / 2, NAME_Y)
  }
  ctx.restore()
}

function drawFlap(ctx: CanvasRenderingContext2D, scene: InviteScene, angle: number, button: { size: number; lift: number; glint: number } | null, unit: number) {
  const k = Math.cos(angle)
  ctx.save()
  ctx.scale(1, k)
  if (k >= 0) {
    ctx.drawImage(scene.flapOut, 0, 0, EW, FLAP_DEPTH + 40)
    if (k < 0.999) {
      ctx.fillStyle = `rgba(0,0,0,${(1 - k) * 0.4})`
      ctx.fill(flapPath())
    }
    if (button) drawButton(ctx, scene, button.size, button.lift, button.glint, unit)
  } else {
    ctx.drawImage(scene.flapIn, 0, 0, EW, FLAP_DEPTH)
    ctx.fillStyle = `rgba(0,0,0,${(1 + k) * 0.5})`
    ctx.fill(flapPath())
  }
  ctx.restore()
}

/** A light passing over the sealed envelope. */
function envelopeSheen(ctx: CanvasRenderingContext2D, p: number) {
  if (p <= 0 || p >= 1) return
  ctx.save()
  ctx.clip(bodyPath())
  const x = lerp(-EW * 0.6, EW * 1.6, easeInOut(p))
  const band = ctx.createLinearGradient(x - 220, 0, x + 220, EH * 0.6)
  band.addColorStop(0, 'rgba(255,236,196,0)')
  band.addColorStop(0.5, 'rgba(255,236,196,0.16)')
  band.addColorStop(1, 'rgba(255,236,196,0)')
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = band
  ctx.fillRect(0, 0, EW, EH)
  ctx.restore()
}

type LetterPose = { cx: number; mid: number; scale: number }

function drawLetter(ctx: CanvasRenderingContext2D, scene: InviteScene, pose: LetterPose, top: number, bottom: number, s: number, unit: number, front: boolean) {
  const lw = LW * pose.scale
  const ph = PH * pose.scale
  const x = pose.cx - lw / 2
  const hingeTop = pose.mid - ph / 2
  const hingeBottom = pose.mid + ph / 2
  const kt = Math.cos(top)
  const kb = Math.cos(bottom)
  const upper = kt < 0 ? hingeTop + ph * kt : hingeTop
  const lower = kb < 0 ? hingeBottom - ph * kb : hingeBottom
  const letter = scene.letter

  // Its shadow falls on whatever is behind.
  ctx.save()
  ctx.shadowColor = front ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 46 * unit * pose.scale
  ctx.shadowOffsetY = 24 * unit * pose.scale
  ctx.fillStyle = '#f6ecd6'
  ctx.fillRect(x, upper, lw, lower - upper)
  ctx.restore()

  const slice = (row: number, dy: number, dh: number) => {
    if (!letter || dh <= 0.5) return
    ctx.drawImage(letter, 0, row * PH, LW, PH, x, dy, lw, dh)
  }
  const shade = (dy: number, dh: number, k: number) => {
    if (dh <= 0.5 || Math.abs(k) > 0.995) return
    ctx.fillStyle = `rgba(60,40,10,${(1 - Math.abs(k)) * 0.35})`
    ctx.fillRect(x, dy, lw, dh)
  }

  slice(1, hingeTop, ph)
  // The bottom third: folded up over the middle, then opening downwards.
  if (kb >= 0) {
    const h = ph * kb
    ctx.drawImage(scene.plain, x, hingeBottom - h, lw, h)
    shade(hingeBottom - h, h, kb)
  } else {
    slice(2, hingeBottom, -ph * kb)
    shade(hingeBottom, -ph * kb, kb)
  }
  // The top third: folded down over everything, then opening upwards.
  if (kt >= 0) {
    const h = ph * kt
    if (h > 0.5) ctx.drawImage(scene.cover, x, hingeTop, lw, h)
    shade(hingeTop, h, kt)
  } else {
    slice(0, hingeTop + ph * kt, -ph * kt)
    shade(hingeTop + ph * kt, -ph * kt, kt)
  }

  // The ministers rise in last.
  const m = easeOut(seg(s, K.ministers))
  if (m > 0 && kb < -0.999 && kt < -0.999) {
    const box = scene.ministers
    const scale = pose.scale
    const letterTop = hingeTop - ph
    ctx.save()
    roundRect(ctx, x + 28 * scale, letterTop + 28 * scale, lw - 56 * scale, PH * 3 * scale - 56 * scale, 10 * scale)
    ctx.clip()
    ctx.globalAlpha = m
    ctx.shadowColor = 'rgba(40,24,4,0.3)'
    ctx.shadowBlur = 10 * unit * scale
    ctx.shadowOffsetY = 3 * unit * scale
    ctx.drawImage(scene.art.ministers, x + box.x * scale, letterTop + (box.y + (1 - m) * 46) * scale, box.w * scale, box.h * scale)
    ctx.restore()
  }

  // A light runs down the letter once it's open.
  const shine = seg(s, K.shine)
  if (shine > 0 && shine < 1) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, upper, lw, lower - upper)
    ctx.clip()
    const by = lerp(upper - 500, lower + 500, easeInOut(shine))
    const band = ctx.createLinearGradient(x, by - 260, x + lw * 0.4, by + 260)
    band.addColorStop(0, 'rgba(255,240,200,0)')
    band.addColorStop(0.5, 'rgba(255,240,200,0.3)')
    band.addColorStop(1, 'rgba(255,240,200,0)')
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = band
    ctx.fillRect(x, upper, lw, lower - upper)
    ctx.restore()
  }
}

export type DrawOptions = {
  /** Seconds the sealed envelope has been waiting, which keeps a light moving over it. */
  idle?: number
  /** The name on the envelope. The page leaves it out while its own field is showing. */
  showName?: boolean
  /** Canvas pixels per card pixel: shadows are measured in canvas pixels. */
  unit?: number
  /** The dark background. Without it the scene can sit on a page. */
  backdrop?: boolean
  /** The glow, the rays and the sparkles. */
  effects?: boolean
}

/** Paints the scene at s seconds. The context should already map the card's 1080×1920 onto the canvas. */
export function drawInvite(ctx: CanvasRenderingContext2D, scene: InviteScene, s: number, { idle, showName = true, unit = 1, backdrop = true, effects = true }: DrawOptions = {}) {
  const { w, h } = INVITE
  ctx.save()
  if (backdrop) ctx.drawImage((scene.backdrop ??= paintBackdrop(scene.grain)), 0, 0, w, h)
  else ctx.clearRect(0, 0, w, h)

  const env = envelopeAt(s)
  const letter = letterAt(s, env)
  const flap = Math.PI * easeInOut(seg(s, K.flap))
  const open = seg(s, K.flap)

  // Where the light comes from: the envelope's mouth, then the letter.
  const fx = env.cx
  const fy = lerp(env.top + 40 * env.scale, letter.mid, letter.rise)
  const pulse = 0.5 + 0.5 * Math.sin(s * 1.6)
  const glowStrength = lerp(0.16 + pulse * 0.04, 0.3, clamp(open * 1.4))
  if (effects) {
    const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, 820)
    glow.addColorStop(0, `rgba(240,169,43,${glowStrength})`)
    glow.addColorStop(0.5, `rgba(240,169,43,${glowStrength * 0.32})`)
    glow.addColorStop(1, 'rgba(240,169,43,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)
    drawRays(ctx, fx, fy, easeOut(seg(s, [2.6, 3.8])) * (1 - 0.4 * seg(s, [5.5, 7.5])), s)

    // Sparkles twinkle behind everything: a few while it's sealed, many once it opens.
    const sparkle = 0.22 + 0.78 * seg(s, [2.1, 3.2]) - 0.4 * seg(s, [6, 8])
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (const p of SPARKLES) {
      const twinkle = Math.max(0, Math.sin(s * p.speed + p.phase)) ** 3
      drawGlint(ctx, scene.glint, p.x, p.y - s * p.drift, p.size, twinkle * sparkle * 0.85)
    }
    ctx.restore()
  }

  // The envelope, and the letter while it's still inside.
  const letterBottom = letter.mid + (PH / 2) * letter.scale
  const inFront = letterBottom <= env.top + 1
  const topFold = Math.PI * easeInOut(seg(s, K.top))
  const bottomFold = Math.PI * easeInOut(seg(s, K.bottom))
  const base = ctx.getTransform()

  ctx.save()
  ctx.globalAlpha = env.alpha
  ctx.translate(env.cx - (EW * env.scale) / 2, env.top)
  ctx.scale(env.scale, env.scale)
  ctx.drawImage(scene.shadow, -PAD, -PAD, EW + PAD * 2, EH + PAD * 2)
  if (open > 0) ctx.drawImage(scene.liner, 0, 0, EW, EH)
  if (Math.cos(flap) < 0) drawFlap(ctx, scene, flap, null, unit)
  if (open > 0 && !inFront) {
    const inner = ctx.getTransform()
    ctx.setTransform(base)
    drawLetter(ctx, scene, letter, 0, 0, s, unit, false)
    ctx.setTransform(inner)
  }
  ctx.drawImage(scene.pocket, 0, 0, EW, EH)
  // Light spills out of the envelope as it opens, and fades once the letter is out.
  const spill = Math.sin(Math.PI * seg(s, [2.35, 4.9]))
  if (spill > 0.01) {
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    const light = ctx.createRadialGradient(EW / 2, 20, 0, EW / 2, 20, 540)
    light.addColorStop(0, `rgba(255,214,140,${0.5 * spill})`)
    light.addColorStop(0.4, `rgba(255,190,90,${0.17 * spill})`)
    light.addColorStop(1, 'rgba(255,190,90,0)')
    ctx.fillStyle = light
    ctx.fillRect(EW / 2 - 540, 20 - 540, 1080, 1080)
    ctx.restore()
  }
  drawSocket(ctx)
  engrave(ctx, scene, showName ? scene.name : '', unit * env.scale)

  // The button: a light runs over it, it's pressed, and it springs open.
  const press = seg(s, K.press)
  const pop = seg(s, K.pop)
  const idleGlint = idle === undefined ? -1 : ((idle + 1.2) % 4.6) / 1.1
  const glint = idle === undefined ? seg(s, K.glint) : idleGlint
  const size = pop > 0 ? lerp(0.965, 1.1, easeOutBack(pop)) : 1 - 0.035 * Math.sin(press * Math.PI * 0.5)
  const lift = pop > 0 ? 14 * easeOut(pop) : 0
  if (Math.cos(flap) >= 0) drawFlap(ctx, scene, flap, { size, lift, glint }, unit * env.scale)
  envelopeSheen(ctx, idle === undefined ? seg(s, K.glint) : (idle % 4.6) / 1.6)
  ctx.restore()

  if (inFront) drawLetter(ctx, scene, letter, topFold, bottomFold, s, unit, true)

  // When the button springs, a ring of light and a burst of sparks.
  if (pop > 0 && pop < 1) {
    const bx = env.cx
    const by = env.top + (BUTTON.y - 14) * env.scale
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.strokeStyle = `rgba(255,222,150,${0.75 * (1 - pop)})`
    ctx.lineWidth = 3 + 6 * (1 - pop)
    ctx.beginPath()
    ctx.arc(bx, by, BUTTON.r * (1.05 + pop * 1.6), 0, Math.PI * 2)
    ctx.stroke()
    const flash = ctx.createRadialGradient(bx, by, 0, bx, by, 300)
    flash.addColorStop(0, `rgba(255,236,190,${0.55 * (1 - pop) ** 2})`)
    flash.addColorStop(1, 'rgba(255,236,190,0)')
    ctx.fillStyle = flash
    ctx.fillRect(bx - 300, by - 300, 600, 600)
    ctx.restore()
  }
  const sparkT = s - K.pop[0]
  if (sparkT > 0 && sparkT < 1) {
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    const bx = env.cx
    const by = env.top + BUTTON.y * env.scale
    for (const p of SPARKS) {
      const d = p.speed * sparkT * (1 - sparkT * 0.45)
      drawGlint(ctx, scene.glint, bx + Math.cos(p.angle) * d, by + Math.sin(p.angle) * d + 420 * sparkT * sparkT, p.size * (1 - sparkT * 0.7), (1 - sparkT) ** 1.5)
    }
    ctx.restore()
  }
  ctx.restore()
}

/** The finished invitation, for sharing. */
export function renderInviteImage(scene: InviteScene) {
  const c = makeCanvas(INVITE.w, INVITE.h)
  drawInvite(context(c), scene, TIMING.duration)
  return c
}

// ---------- for the 3D invitation (invite3d.ts) ----------

/** The flat drawings' measurements, in their pixels, so the 3D envelope and letter are cut to match. */
export const FLAT = {
  envelope: { w: EW, h: EH, button: BUTTON, tab: TAB_R, flapDepth: FLAP_DEPTH, sideApex: SIDE_APEX, bottomApexY: BOTTOM_APEX_Y, labelY: LABEL_Y, nameY: NAME_Y, nameSize: NAME_SIZE },
  letter: { w: LW, panel: PH },
  /** Where the letter and the envelope end up in the shared picture, in its pixels. */
  final: { letterTop: LETTER_TOP, letterScale: LETTER_SCALE, envelopeTop: 1300, envelopeScale: 1.1 },
}

/** The letter, its outside and its plain back, painted larger than the picture needs so they stay sharp in 3D. */
export function paintLetterParts(art: Pick<InviteArt, 'emblem' | 'ministers'>, font: string, name: string, scale = 1.4) {
  const grain = noise(256, 5)
  const { canvas, ministers } = paintLetter(name.trim().replace(/s+/g, ' '), font, art, grain, scale)
  return {
    letter: canvas,
    /** As shares of the letter's width and height. */
    ministers: { x: ministers.x / LW, y: ministers.y / LH, w: ministers.w / LW, h: ministers.h / LH },
    cover: paintCover(font, grain, scale),
    plain: paintPlain(grain, scale),
  }
}

/**
 * Everything the 3D envelope wears, painted in the card slip's own finish (graphite, fine white sunburst,
 * sheen, lit edges) at a size that stays sharp up close: the pocket, the flap outside and in, the lining,
 * the flap's shadow, the back, the sparkle and, for the video, the dark backdrop.
 */
export function paintEnvelopeParts(emblem: HTMLImageElement, font: string, scale = 2) {
  let burst: HTMLCanvasElement | null = null
  const rays = () => (burst ??= sunburst(scale))
  // Each part is painted when it's asked for, so a slow phone can take a breath between them.
  return {
    pocket: () => paintPocket(rays(), scale),
    flapOutside: () => paintFlapOutside(rays(), scale),
    flapInside: () => paintFlapInside(scale),
    flapShadow: () => paintFlapShadow(scale),
    liner: () => paintLiner(scale),
    back: () => paintBack(emblem, font, scale),
    glint: () => paintGlint(),
    backdrop: () => paintBackdrop(noise(256, 3)),
  }
}

/** The closed flap's shadow on the pocket, on its own so it can fade as the flap lifts. */
function paintFlapShadow(scale: number) {
  const c = makeCanvas(EW * scale, (FLAP_DEPTH + 60) * scale)
  const ctx = context(c)
  ctx.scale(scale, scale)
  ctx.translate(-10000, 0)
  ctx.shadowOffsetX = 10000 * scale
  ctx.shadowOffsetY = 9 * scale
  ctx.shadowBlur = 20 * scale
  ctx.shadowColor = 'rgba(0,0,0,0.75)'
  ctx.fill(flapPath())
  return c
}

/** The other side of the envelope, seen as it turns: the slip itself, with the Dunamis logo and name. */
function paintBack(emblem: HTMLImageElement, font: string, scale: number) {
  const c = makeCanvas(EW * scale, EH * scale)
  const ctx = context(c)
  ctx.scale(scale, scale)
  const body = bodyPath()
  ctx.save()
  ctx.clip(body)
  ctx.fillStyle = graphite(ctx, 0, EH)
  ctx.fillRect(0, 0, EW, EH)
  ctx.drawImage(sunburst(scale, { x: EW / 2, y: EH }), 0, 0, EW, EH)
  sheen(ctx, EW, EH)
  ctx.restore()
  rim(ctx, body, 0.16, 2)
  const lh = 120
  const lw = lh * (emblem.naturalWidth / emblem.naturalHeight)
  ctx.font = `600 92px ${font}`
  ctx.textBaseline = 'middle'
  const word = ctx.measureText('Dunamis').width
  const x = EW / 2 - (lw + 26 + word) / 2
  ctx.drawImage(emblem, x, EH / 2 - lh / 2 - 6, lw, lh)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.fillText('Dunamis', x + lw + 26, EH / 2)
  return c
}

/**
 * The button's face: the official Dunamis logo on the slip's black, with a fine sunburst and a lit ring,
 * so the button is made of the same material as the envelope.
 */
export function paintButtonFace(emblem: HTMLImageElement, size = 1024) {
  const c = makeCanvas(size, size)
  const ctx = context(c)
  const r = size / 2
  ctx.save()
  ctx.beginPath()
  ctx.arc(r, r, r, 0, Math.PI * 2)
  ctx.clip()
  const base = ctx.createLinearGradient(0, 0, 0, size)
  base.addColorStop(0, '#2c2c2c')
  base.addColorStop(0.46, '#181818')
  base.addColorStop(1, '#0b0b0b')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)
  ctx.save()
  ctx.translate(r, r)
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  for (let a = 0; a < Math.PI * 2; a += (6 * Math.PI) / 180) {
    const half = (0.35 * Math.PI) / 180
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(a - half) * r, Math.sin(a - half) * r)
    ctx.lineTo(Math.cos(a + half) * r, Math.sin(a + half) * r)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
  const gloss = ctx.createRadialGradient(size * 0.22, size * 0.12, 0, size * 0.22, size * 0.12, size * 0.8)
  gloss.addColorStop(0, 'rgba(255,255,255,0.16)')
  gloss.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gloss
  ctx.fillRect(0, 0, size, size)
  ctx.restore()
  // A lit ring inside the edge, as round the slip's notch.
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'
  ctx.lineWidth = size * 0.008
  ctx.beginPath()
  ctx.arc(r, r, r * 0.9, 0, Math.PI * 2)
  ctx.stroke()
  // The logo, whole, with a soft shadow under it.
  const lw = size * 0.72
  const lh = lw * (emblem.naturalHeight / emblem.naturalWidth)
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur = size * 0.02
  ctx.shadowOffsetY = size * 0.008
  ctx.drawImage(emblem, r - lw / 2, r - lh / 2 + size * 0.01, lw, lh)
  ctx.restore()
  return c
}

/** The button seen flat, for the picture and for browsers without 3D: the face inside a lit black rim. */
export function paintButton(emblem: HTMLImageElement, size = 420) {
  const c = makeCanvas(size, size)
  const ctx = context(c)
  const r = size / 2
  const rimGrad = ctx.createLinearGradient(0, 0, 0, size)
  rimGrad.addColorStop(0, '#4a4a4a')
  rimGrad.addColorStop(0.5, '#141414')
  rimGrad.addColorStop(1, '#2a2a2a')
  ctx.fillStyle = rimGrad
  ctx.beginPath()
  ctx.arc(r, r, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.drawImage(paintButtonFace(emblem, size), size * 0.06, size * 0.06, size * 0.88, size * 0.88)
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'
  ctx.lineWidth = size * 0.008
  ctx.beginPath()
  ctx.arc(r, r, r - size * 0.006, Math.PI * 1.05, Math.PI * 1.95)
  ctx.stroke()
  return c
}

/** Gold text on nothing, for drawing onto the 3D envelope: "An invitation from", the name, and a caret while typing. */
export function paintEngraving(c: HTMLCanvasElement, font: string, name: string, caret: number | null, placeholder: string) {
  const ctx = context(c)
  const k = c.width / 640
  ctx.setTransform(k, 0, 0, k, 0, 0)
  ctx.clearRect(0, 0, 640, c.height / k)
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = 'rgba(214,180,108,0.92)'
  ctx.font = `600 17px ${font}`
  centred(ctx, 'AN INVITATION FROM', 320, 40, 4.5)
  const text = name || placeholder
  const size = fit(ctx, text, 600, font, NAME_SIZE, 26, 560)
  ctx.fillStyle = name ? foil(ctx, 40, 0, 600, 0, BRIGHT) : 'rgba(243,213,138,0.42)'
  centred(ctx, text, 320, 100)
  if (caret !== null) {
    ctx.font = `600 ${size}px ${font}`
    const full = ctx.measureText(name).width
    const before = ctx.measureText(name.slice(0, caret)).width
    const x = 320 - full / 2 + before + (name ? 2 : 0)
    ctx.fillStyle = '#f6dc95'
    ctx.fillRect(name ? x : 320 - ctx.measureText(placeholder).width / 2 - 6, 100 - size * 0.78, 3, size * 0.92)
  }
}
