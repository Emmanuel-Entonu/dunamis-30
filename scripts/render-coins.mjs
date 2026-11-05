// Renders the commemorative coins around the home page hero, and the rays behind the crest:
// src/assets/coins/*.webp. The model is in scripts/coins/scene.js, and how the coins move is in
// src/components/home/HeroRing.tsx. Needs no server or database.
// Usage: node scripts/render-coins.mjs [name-filter]
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import sharp from 'sharp'

const only = process.argv[2]
const outDir = 'src/assets/coins'
const SIZE = 1400 // rendered this large, then reduced, for clean edges
const OUTPUT = 440
const FILL = 0.7 // the coin's share of the image, which leaves room for its glow

/**
 * What each coin stands for: the words come from the ministry's mission and its founding story.
 * `direction` is the way the coin leans, with its lit edge on the opposite side. `tilt` is how far, in radians.
 */
const coins = [
  { name: 'crown', emblem: 'crown', word: 'LIFTING POWER', finish: 'obsidian', direction: [-0.72, -0.69], tilt: 0.72, roll: 0.1 },
  { name: 'cross', emblem: 'cross', word: 'SAVING POWER', finish: 'gold', direction: [0.05, -1], tilt: 0.62, roll: -0.08, light: 0.62 },
  { name: 'flame', emblem: 'flame', word: 'DUNAMIS', finish: 'obsidian', direction: [0.72, -0.69], tilt: 0.62, roll: -0.14 },
  { name: 'globe', emblem: 'globe', word: 'THE NATIONS', finish: 'obsidian', direction: [0.96, -0.28], tilt: 0.66, roll: 0.12 },
  { name: 'heart', emblem: 'heart', word: 'HEALING POWER', finish: 'gold', direction: [1, 0.12], tilt: 0.76, roll: -0.1 },
  { name: 'chain', emblem: 'chain', word: 'DELIVERING POWER', finish: 'obsidian', direction: [0.86, 0.5], tilt: 0.7, roll: 0.08 },
  { name: 'thirty', emblem: 'thirty', word: 'THIRTY YEARS', finish: 'gold', direction: [0.5, 0.87], tilt: 0.58, roll: -0.12 },
  { name: 'bible', emblem: 'bible', word: 'THE WORD', finish: 'obsidian', direction: [-0.02, 1], tilt: 0.5, roll: 0.06 },
  { name: 'dome', emblem: 'dome', word: 'THE GLORY DOME', finish: 'pale', direction: [-0.5, 0.87], tilt: 0.66, roll: 0.1 },
  { name: 'mountain', emblem: 'mountain', word: 'ONE INSTRUCTION', finish: 'obsidian', direction: [-0.88, 0.47], tilt: 0.7, roll: -0.06 },
  { name: 'dove', emblem: 'dove', word: 'HIS PRESENCE', finish: 'gold', direction: [-1, -0.1], tilt: 0.64, roll: 0.12, light: 0.42 },
]

const nodeModules = path.resolve('node_modules/three')
const types = { '.js': 'text/javascript', '.json': 'application/json' }
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] }) // a real graphics chip
const page = await browser.newPage({ viewport: { width: 800, height: 800 } })
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message.slice(0, 400)))
page.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 400))
})
await page.route('http://coins.test/**', (route) => {
  const url = new URL(route.request().url())
  if (url.pathname === '/') {
    return route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><body style="background:#000">
        <script type="importmap">{"imports":{"three":"http://coins.test/three/build/three.module.js","three/addons/":"http://coins.test/three/examples/jsm/"}}</script>
        <script>window.__coinSize=${SIZE};window.__coinFill=${FILL};window.__coinFont=${fs.readFileSync('public/fonts/cinzel-800.typeface.json', 'utf8')};</script>
        <script type="module" src="/scene.js"></script></body>`,
    })
  }
  const file = url.pathname === '/scene.js' ? path.resolve('scripts/coins/scene.js') : path.join(nodeModules, url.pathname.replace('/three/', ''))
  return route.fulfill({ contentType: types[path.extname(file)] ?? 'application/octet-stream', body: fs.readFileSync(file) })
})
await page.goto('http://coins.test/', { waitUntil: 'load' })
await page.waitForFunction(() => window.__coinsReady === true, null, { timeout: 60000 })

/** Adds the bloom a camera would see around the brightest light, in two soft layers. */
async function withGlow(png) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const count = width * height
  const bright = Buffer.alloc(count * 3)
  for (let i = 0; i < count; i++) {
    const a = data[i * 4 + 3] / 255
    const r = data[i * 4] * a
    const g = data[i * 4 + 1] * a
    const b = data[i * 4 + 2] * a
    const level = Math.max(0, ((r + g + b) / 3 / 255 - 0.76) / 0.24)
    bright[i * 3] = Math.min(255, level * 255)
    bright[i * 3 + 1] = Math.min(255, level * 182)
    bright[i * 3 + 2] = Math.min(255, level * 78)
  }
  const raw = { raw: { width, height, channels: 3 } }
  const tight = await sharp(bright, raw).blur(13).raw().toBuffer()
  const wide = await sharp(bright, raw).blur(46).raw().toBuffer()
  const out = Buffer.alloc(count * 4)
  for (let i = 0; i < count; i++) {
    const a = data[i * 4 + 3] / 255
    const glow = [0, 1, 2].map((c) => tight[i * 3 + c] * 1.05 + wide[i * 3 + c] * 1.75)
    const sum = [0, 1, 2].map((c) => data[i * 4 + c] * a + glow[c])
    const glowAlpha = Math.min(1, Math.max(glow[0], glow[1], glow[2]) / 255)
    const alpha = a + glowAlpha * (1 - a)
    for (let c = 0; c < 3; c++) out[i * 4 + c] = alpha > 0 ? Math.min(255, sum[c] / alpha) : 0
    out[i * 4 + 3] = Math.round(alpha * 255)
  }
  return sharp(out, { raw: { width, height, channels: 4 } })
}

fs.mkdirSync(outDir, { recursive: true })
let total = 0
for (const coin of coins.filter((c) => !only || only.split(',').includes(c.name))) {
  const dataUrl = await page.evaluate((spec) => window.renderCoin(spec), coin)
  const png = Buffer.from(dataUrl.split(',')[1], 'base64')
  const image = await withGlow(png)
  const target = `${outDir}/${coin.name}.webp`
  await image.resize(OUTPUT, OUTPUT, { kernel: 'lanczos3' }).webp({ quality: 76, alphaQuality: 82, effort: 6 }).toFile(target)
  const size = fs.statSync(target).size
  total += size
  console.log(`${target}  ${Math.round(size / 1024)} KB`)
}
console.log(`total ${Math.round(total / 1024)} KB`)
await browser.close()

// The soft rays of light behind the crest, which turn slowly. Baked into an image so turning them costs nothing.
if (!only || only.includes('rays')) {
  const rays = Array.from({ length: 56 }, (_, i) => {
    const a = (i / 56) * Math.PI * 2
    const spread = (i % 2 ? 0.006 : 0.012) + (i % 7 === 0 ? 0.007 : 0)
    const reach = i % 2 ? 340 : 500
    const point = (angle, r) => `${(500 + Math.cos(angle) * r).toFixed(1)},${(500 + Math.sin(angle) * r).toFixed(1)}`
    return `<polygon points="${point(a - spread, 110)} ${point(a + spread, 110)} ${point(a + spread * 1.5, reach)} ${point(a - spread * 1.5, reach)}" fill="#ffc861"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000">
    <defs>
      <radialGradient id="fade"><stop offset="0.16" stop-color="#fff" stop-opacity="0.5"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.14"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <mask id="m"><rect width="1000" height="1000" fill="url(#fade)"/></mask>
      <filter id="soft"><feGaussianBlur stdDeviation="3.2"/></filter>
    </defs>
    <g mask="url(#m)" filter="url(#soft)">${rays}</g>
  </svg>`
  const target = `${outDir}/rays.webp`
  await sharp(Buffer.from(svg)).resize(400, 400).webp({ quality: 38, alphaQuality: 40, effort: 6 }).toFile(target)
  console.log(`${target}  ${Math.round(fs.statSync(target).size / 1024)} KB`)
}
