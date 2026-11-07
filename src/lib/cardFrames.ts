/*
 * Canvas renderer for the "I Am Attending" card, one tall size (1080×1920) for WhatsApp Status and
 * Stories. White and gold, with the Glory Dome crowd rising under the photo, comes first; the rest are other backdrops.
 * drawCard(ctx, input, assets, t) paints one frame; t runs 0 → 1
 * for the reveal used in the video export (t = 1 is the finished card). Everything runs in the
 * browser: photos never leave the visitor's device.
 */

export type TemplateId = 'pearl' | 'glory' | 'nations' | 'emerald' | 'royal' | 'onyx'
export type PhotoSource = HTMLImageElement | HTMLCanvasElement

export const CARD = { w: 1080, h: 1920 }
// The card says 23rd and 29th, at the church's request (7 Nov 2026). The rest of the site says 23 to 29 November.
export const EVENT = { title: 'Kingdom Power & Glory World Conference', date: '23rd to 29th November 2026', venue: 'The Glory Dome, Abuja' }

export type CardAssets = { crest: HTMLImageElement; emblem: HTMLImageElement; crowd: HTMLImageElement; dome: HTMLImageElement | null; nations: HTMLImageElement | null }

export type CardInput = {
  name: string
  city: string
  photo: PhotoSource | null
  zoom: number
  template: TemplateId
  font: string
}

/** White and gold is the default; the rest are alternative backdrops for the same card. */
export const TEMPLATE_ORDER: TemplateId[] = ['pearl', 'glory', 'nations', 'emerald', 'royal', 'onyx']

type Theme = { label: string; light?: boolean; paint: (ctx: CanvasRenderingContext2D, a: CardAssets, w: number, h: number) => void }

// ---------- helpers ----------
const clamp = (v: number) => Math.max(0, Math.min(1, v))
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a))
const easeOut = (v: number) => 1 - (1 - v) ** 3
const easeOutBack = (v: number) => 1 + 2.5 * (v - 1) ** 3 + 1.5 * (v - 1) ** 2
const dims = (p: PhotoSource) => ('naturalWidth' in p ? { w: p.naturalWidth, h: p.naturalHeight } : { w: p.width, h: p.height })

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Draw `img` to fill the box (CSS object-fit: cover); focusY biases the crop vertically. */
function cover(ctx: CanvasRenderingContext2D, img: PhotoSource, x: number, y: number, w: number, h: number, zoom = 1, focusY = 0.5) {
  const d = dims(img)
  const s = Math.max(w / d.w, h / d.h) * zoom
  const dw = d.w * s
  const dh = d.h * s
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) * focusY, dw, dh)
}

const GOLD = ['#8a5f10', '#c2902a', '#94660f', '#cf9f3b', '#8f6210']
/** For the dark backdrops. */
const BRIGHT_GOLD = ['#a8781f', '#f6dc95', '#c48f2a', '#fff0c4', '#b07a1c']
/** Deeper, because the date sits over the crowd and has to read at a glance. */
const DEEP_GOLD = ['#6f4a07', '#966b18', '#7a5209', '#9c7019', '#744e08']

/** Polished gold foil for rules, frame and headline type. */
function foil(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, stops = GOLD) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  ;[0, 0.22, 0.45, 0.7, 1].forEach((at, i) => g.addColorStop(at, stops[i]))
  return g
}

function radial(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, stops: [number, string][]) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  for (const [o, c] of stops) g.addColorStop(o, c)
  return g
}

function vignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength: number) {
  const g = ctx.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.3, w / 2, h * 0.5, Math.max(w, h) * 0.72)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, `rgba(0,0,0,${strength})`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

let grain: HTMLCanvasElement | null = null
/** Fine film grain so flat colour never bands on phone screens. */
function addGrain(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number) {
  if (!grain) {
    grain = document.createElement('canvas')
    grain.width = grain.height = 256
    const g = grain.getContext('2d')!
    const img = g.createImageData(256, 256)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    g.putImageData(img, 0, 0)
  }
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.globalCompositeOperation = 'overlay'
  ctx.fillStyle = ctx.createPattern(grain, 'repeat')!
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

// ---------- the paper ----------
function paintPaper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w * 0.3, h)
  g.addColorStop(0, '#fffefb')
  g.addColorStop(0.62, '#fefcf6')
  g.addColorStop(1, '#f9f0dd')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = radial(ctx, w * 0.18, 0, h * 0.45, [
    [0, 'rgba(255,225,160,0.16)'],
    [1, 'rgba(255,225,160,0)'],
  ])
  ctx.fillRect(0, 0, w, h)
}

// ---------- backdrops ----------
export const TEMPLATES: Record<TemplateId, Theme> = {
  pearl: { label: 'White & Gold', light: true, paint: (ctx, _a, w, h) => paintPaper(ctx, w, h) },
  glory: {
    label: 'Glory Dome',
    paint: (ctx, a, w, h) => {
      if (a.dome) cover(ctx, a.dome, 0, 0, w, h)
      ctx.fillStyle = 'rgba(8,6,3,0.62)'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = radial(ctx, w / 2, h, h * 0.62, [
        [0, 'rgba(240,169,43,0.38)'],
        [1, 'rgba(240,169,43,0)'],
      ])
      ctx.fillRect(0, 0, w, h)
      vignette(ctx, w, h, 0.55)
    },
  },
  nations: {
    label: 'Nations',
    paint: (ctx, a, w, h) => {
      if (a.nations) cover(ctx, a.nations, 0, 0, w, h, 1, 0.65)
      ctx.fillStyle = 'rgba(5,7,12,0.72)'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = radial(ctx, w / 2, 0, h * 0.55, [
        [0, 'rgba(240,169,43,0.22)'],
        [1, 'rgba(240,169,43,0)'],
      ])
      ctx.fillRect(0, 0, w, h)
      vignette(ctx, w, h, 0.6)
    },
  },
  emerald: {
    label: 'Emerald',
    paint: (ctx, _a, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w * 0.3, h)
      g.addColorStop(0, '#0f3b2c')
      g.addColorStop(1, '#03110c')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = radial(ctx, w * 0.2, h * 0.08, h * 0.6, [
        [0, 'rgba(96,170,130,0.28)'],
        [1, 'rgba(96,170,130,0)'],
      ])
      ctx.fillRect(0, 0, w, h)
      vignette(ctx, w, h, 0.5)
    },
  },
  royal: {
    label: 'Royal',
    paint: (ctx, _a, w, h) => {
      ctx.fillStyle = radial(ctx, w / 2, h * 0.16, h * 0.95, [
        [0, '#6d17b8'],
        [0.45, '#3a0a66'],
        [1, '#140325'],
      ])
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = radial(ctx, w / 2, h, h * 0.5, [
        [0, 'rgba(240,169,43,0.22)'],
        [1, 'rgba(240,169,43,0)'],
      ])
      ctx.fillRect(0, 0, w, h)
      vignette(ctx, w, h, 0.45)
    },
  },
  onyx: {
    label: 'Onyx',
    paint: (ctx, _a, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, '#1b1915')
      g.addColorStop(1, '#060606')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      // A faint diagonal sheen, like light across black lacquer.
      const s = ctx.createLinearGradient(0, h * 0.15, w, h * 0.55)
      s.addColorStop(0, 'rgba(255,215,140,0)')
      s.addColorStop(0.5, 'rgba(255,215,140,0.07)')
      s.addColorStop(1, 'rgba(255,215,140,0)')
      ctx.fillStyle = s
      ctx.fillRect(0, 0, w, h)
      vignette(ctx, w, h, 0.55)
    },
  },
}

// ---------- statement text with bold runs ----------
type Run = { text: string; strong?: boolean }
type Part = { text: string; strong: boolean }

/** Split into words that keep punctuation glued to styled names (e.g. "Adebayo" + ","). */
function toWords(runs: Run[]): Part[][] {
  const words: Part[][] = []
  let cur: Part[] = []
  for (const r of runs)
    for (const s of r.text.split(/(\s+)/)) {
      if (!s) continue
      if (/^\s+$/.test(s)) {
        if (cur.length) words.push(cur)
        cur = []
      } else cur.push({ text: s, strong: !!r.strong })
    }
  if (cur.length) words.push(cur)
  return words
}

function drawStatement(
  ctx: CanvasRenderingContext2D,
  runs: Run[],
  { cx, top, maxW, font, colors, alpha }: { cx: number; top: number; maxW: number; font: string; colors: { text: string; strong: string }; alpha: number },
) {
  const words = toWords(runs)
  for (let size = 46; size >= 30; size -= 2) {
    const lh = Math.round(size * 1.42)
    const width = (p: Part) => {
      ctx.font = `${p.strong ? 700 : 500} ${size}px ${font}`
      return ctx.measureText(p.text).width
    }
    ctx.font = `500 ${size}px ${font}`
    const space = ctx.measureText(' ').width
    const wordW = words.map((w) => w.reduce((s, p) => s + width(p), 0))
    const wrap = (limit: number) => {
      const out: number[][] = []
      let line: number[] = []
      let lw = 0
      for (let i = 0; i < words.length; i++) {
        const add = (line.length ? space : 0) + wordW[i]
        if (line.length && lw + add > limit) {
          out.push(line)
          line = [i]
          lw = wordW[i]
        } else {
          line.push(i)
          lw += add
        }
      }
      if (line.length) out.push(line)
      return out
    }
    const greedy = wrap(maxW)
    if ((greedy.length > 3 || Math.max(...wordW) > maxW) && size > 30) continue
    // Balance: the narrowest width that still needs no extra line (no lone last word).
    let lo = Math.max(...wordW)
    let hi = maxW
    for (let k = 0; k < 14; k++) {
      const mid = (lo + hi) / 2
      if (wrap(mid).length <= greedy.length) hi = mid
      else lo = mid
    }
    const lines = wrap(hi)
    ctx.save()
    ctx.globalAlpha *= alpha
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
    lines.forEach((ln, li) => {
      const total = ln.reduce((s, wi, k) => s + wordW[wi] + (k ? space : 0), 0)
      let x = cx - total / 2
      const y = top + size + li * lh
      ln.forEach((wi, k) => {
        if (k) x += space
        for (const p of words[wi]) {
          ctx.font = `${p.strong ? 700 : 500} ${size}px ${font}`
          ctx.fillStyle = p.strong ? colors.strong : colors.text
          ctx.fillText(p.text, x, y)
          x += ctx.measureText(p.text).width
        }
      })
    })
    ctx.restore()
    return
  }
}

function spaced(ctx: CanvasRenderingContext2D, px: number) {
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`
}

// ---------- the card ----------
const LIGHT_INK = { text: '#3a3122', strong: '#17130c', soft: 'rgba(58,49,34,0.9)', hair: 'rgba(154,106,12,0.35)', panel: '#efe6d2', figure: 'rgba(120,100,60,0.22)' }
const DARK_INK = { text: '#eee0bf', strong: '#ffffff', soft: 'rgba(238,224,191,0.85)', hair: 'rgba(246,220,149,0.32)', panel: '#15110b', figure: 'rgba(238,224,191,0.13)' }
const M = 64 // side margin
// Where the crowd layer starts, hidden behind the photo. It's made by scripts/render-card-crowd.mjs.
const CROWD_TOP = 1240
// The white card's photo is a little shorter, to leave room for the crowd.
const LIGHT_LAYOUT = { photo: 1040, statement: 1304, rule: 1524, date: 1612, venue: 1672, tag: 1722 }
const DARK_LAYOUT = { photo: 1120, statement: 1394, rule: 1640, date: 1742, venue: 1808, tag: 1862 }

export function drawCard(ctx: CanvasRenderingContext2D, input: CardInput, assets: CardAssets, t = 1) {
  const { w, h } = CARD
  const font = input.font
  const light = Boolean(TEMPLATES[input.template].light)
  const INK = light ? LIGHT_INK : DARK_INK
  const LINE = light ? LIGHT_LAYOUT : DARK_LAYOUT
  const PHOTO = { x: M, y: 212, w: w - M * 2, h: LINE.photo }
  const gold = (x0: number, y0: number, x1: number, y1: number) => foil(ctx, x0, y0, x1, y1, light ? GOLD : BRIGHT_GOLD)
  // A glow of paper on the white card, and a soft shadow on the dark ones, keeps the words crisp over the pictures.
  const lift = (on: boolean) => {
    ctx.shadowColor = !on ? 'transparent' : light ? 'rgba(255,251,241,0.95)' : 'rgba(0,0,0,0.85)'
    ctx.shadowBlur = !on ? 0 : light ? 22 : 16
    ctx.shadowOffsetY = on && !light ? 2 : 0
  }
  ctx.save()
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = light ? '#fdf9f0' : '#060606'
  ctx.fillRect(0, 0, w, h)

  // The backdrop settles in. On the white card, the crowd rises into place.
  const bg = easeOut(seg(t, 0, 0.4))
  ctx.save()
  ctx.globalAlpha = clamp(seg(t, 0, 0.16))
  const z = 1.05 - 0.05 * bg
  ctx.translate(w / 2, h / 2)
  ctx.scale(z, z)
  ctx.translate(-w / 2, -h / 2)
  TEMPLATES[input.template].paint(ctx, assets, w, h)
  if (light) ctx.drawImage(assets.crowd, 0, CROWD_TOP + (1 - easeOut(seg(t, 0.06, 0.5))) * 90, w, h - CROWD_TOP)
  ctx.restore()
  addGrain(ctx, w, h, 0.06)

  // Gold frame: foil outline + inner hairline.
  const fr = easeOut(seg(t, 0.08, 0.32))
  ctx.save()
  ctx.globalAlpha = fr
  roundRect(ctx, 20, 20, w - 40, h - 40, 26)
  ctx.strokeStyle = gold(0, 0, w, h)
  ctx.lineWidth = 3
  ctx.stroke()
  roundRect(ctx, 30, 30, w - 60, h - 60, 18)
  ctx.strokeStyle = INK.hair
  ctx.lineWidth = 1.2
  ctx.stroke()

  // Header: the church's logo and name, then Dunamis@30, over a foil rule.
  const logoH = 108
  const logoW = logoH * (assets.emblem.naturalWidth / assets.emblem.naturalHeight)
  ctx.drawImage(assets.emblem, M, 50, logoW, logoH)
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.fillStyle = INK.strong
  ctx.font = `600 31px ${font}`
  ctx.fillText('Dunamis International', M + logoW + 16, 98)
  ctx.fillText('Gospel Centre', M + logoW + 16, 138)
  ctx.font = `700 52px ${font}`
  spaced(ctx, 3)
  ctx.fillStyle = gold(w * 0.45, 70, w - M, 140)
  ctx.textAlign = 'right'
  ctx.fillText('DUNAMIS@30', w - M - 3, 130)
  spaced(ctx, 0)
  ctx.fillStyle = gold(M, 0, w - M, 0)
  ctx.fillRect(M, 172, (w - M * 2) * fr, 2)
  ctx.restore()

  // Photo panel grows in.
  const p = seg(t, 0.18, 0.52)
  const ps = 0.94 + 0.06 * easeOut(p)
  ctx.save()
  ctx.globalAlpha = clamp(seg(t, 0.18, 0.34))
  ctx.translate(w / 2, PHOTO.y + PHOTO.h / 2)
  ctx.scale(ps, ps)
  ctx.translate(-w / 2, -(PHOTO.y + PHOTO.h / 2))
  ctx.shadowColor = light ? 'rgba(92,62,12,0.34)' : 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 16
  roundRect(ctx, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, 10)
  ctx.fillStyle = INK.panel
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.save()
  ctx.clip()
  if (input.photo) {
    cover(ctx, input.photo, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, input.zoom, 0.42)
  } else {
    ctx.fillStyle = INK.figure
    ctx.beginPath()
    ctx.arc(w / 2, PHOTO.y + PHOTO.h * 0.4, PHOTO.w * 0.17, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(w / 2, PHOTO.y + PHOTO.h * 1.02, PHOTO.w * 0.38, PHOTO.h * 0.34, 0, Math.PI, 0)
    ctx.fill()
  }
  ctx.restore()
  roundRect(ctx, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, 10)
  ctx.strokeStyle = gold(PHOTO.x, PHOTO.y, PHOTO.x + PHOTO.w, PHOTO.y + PHOTO.h)
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.restore()

  // The official 30th-anniversary crest, set like a seal on the photo's corner.
  const sl = seg(t, 0.42, 0.68)
  if (sl > 0) {
    const size = 168 * (0.6 + 0.4 * easeOutBack(sl))
    const ch = size * (assets.crest.naturalHeight / assets.crest.naturalWidth)
    const cx = PHOTO.x + PHOTO.w - 92
    const cy = PHOTO.y + PHOTO.h - 40
    ctx.save()
    ctx.globalAlpha = clamp(sl * 1.6)
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = 34
    ctx.shadowOffsetY = 12
    ctx.drawImage(assets.crest, cx - size / 2, cy - ch / 2, size, ch)
    ctx.restore()
  }

  // "I, Name, from City, will be attending the Kingdom Power & Glory World Conference."
  const st = easeOut(seg(t, 0.5, 0.78))
  const name = input.name.trim() || 'Your Name'
  const city = input.city.trim()
  const runs: Run[] = [{ text: 'I, ' }, { text: name, strong: true }]
  if (city) runs.push({ text: ', from ' }, { text: city, strong: true })
  runs.push({ text: `, will be attending the ${EVENT.title}.` })
  lift(true)
  drawStatement(ctx, runs, { cx: w / 2, top: LINE.statement + (1 - st) * 24, maxW: w - M * 2 - 40, font, colors: { text: INK.text, strong: INK.strong }, alpha: st })
  lift(false)

  // Foil rule, date and venue.
  const d = easeOut(seg(t, 0.64, 0.9))
  ctx.save()
  ctx.globalAlpha = d
  ctx.fillStyle = gold(M, 0, w - M, 0)
  const ruleW = (w - M * 2) * d
  ctx.fillRect(w / 2 - ruleW / 2, LINE.rule, ruleW, 2)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  lift(true)
  // The date fills the line at most: a longer date gets a slightly smaller size rather than running into the frame.
  let dateSize = 58
  ctx.font = `700 ${dateSize}px ${font}`
  while (ctx.measureText(EVENT.date).width > w - M * 2 - 48 && dateSize > 44) {
    dateSize -= 2
    ctx.font = `700 ${dateSize}px ${font}`
  }
  ctx.fillStyle = foil(ctx, w * 0.2, 0, w * 0.8, 0, light ? DEEP_GOLD : BRIGHT_GOLD)
  ctx.fillText(EVENT.date, w / 2, LINE.date)
  ctx.font = `600 38px ${font}`
  ctx.fillStyle = INK.strong
  ctx.fillText(EVENT.venue, w / 2, LINE.venue)
  ctx.font = `600 30px ${font}`
  spaced(ctx, 2)
  ctx.fillStyle = INK.soft
  ctx.fillText('#Dunamis@30', w / 2, LINE.tag)
  spaced(ctx, 0)
  ctx.restore()

  // A light sweep finishes the reveal.
  const sweep = seg(t, 0.74, 1)
  if (sweep > 0 && sweep < 1) {
    ctx.save()
    const bx = -w * 0.6 + sweep * w * 2.2
    const gr = ctx.createLinearGradient(bx - w * 0.25, 0, bx + w * 0.25, h)
    gr.addColorStop(0, 'rgba(255,240,200,0)')
    gr.addColorStop(0.5, 'rgba(255,240,200,0.26)')
    gr.addColorStop(1, 'rgba(255,240,200,0)')
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = gr
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
  }
  ctx.restore()
}

/** Records the reveal animation to a video (MP4 where the browser supports it, else WebM). */
export async function recordReveal(
  canvas: HTMLCanvasElement,
  render: (t: number) => void,
  { duration = 3400, hold = 1600 }: { duration?: number; hold?: number } = {},
): Promise<{ blob: Blob; ext: 'mp4' | 'webm' }> {
  const types = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  const mimeType = types.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m))
  if (!mimeType) throw new Error('Video recording is not supported in this browser.')
  const stream = canvas.captureStream(30)
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 9_000_000 })
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  const done = new Promise<void>((resolve) => (recorder.onstop = () => resolve()))
  recorder.start()
  const start = performance.now()
  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = performance.now() - start
      render(Math.min(1, elapsed / duration))
      if (elapsed < duration + hold) requestAnimationFrame(tick)
      else resolve()
    }
    requestAnimationFrame(tick)
  })
  recorder.stop()
  await done
  stream.getTracks().forEach((track) => track.stop())
  return { blob: new Blob(chunks, { type: mimeType.split(';')[0] }), ext: mimeType.includes('mp4') ? 'mp4' : 'webm' }
}
