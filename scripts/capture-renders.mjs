// Captures the 3D objects from /render-lab as transparent WebP images.
// Requires the dev server: npm run dev, then node scripts/capture-renders.mjs [baseUrl] [name-filter]
import fs from 'node:fs'
import { chromium } from 'playwright'
import sharp from 'sharp'

const base = process.argv[2] || 'http://localhost:3000'
const only = process.argv[3]
const outDir = 'src/assets/renders'

const renders = [
  // Gold "30 YEARS" that floats over the hero hand (src/assets/brand/hero-hand.png).
  { name: 'gold-30', q: 'shape=gold-30&rx=-0.08&ry=0.22', size: [1200, 1200], max: 900 },
  // Glass set (FlowSwipe-style supporting renders).
  { name: 'glass-tube', q: 'shape=g-tube&rx=1.2&ry=0.3&rz=0.5' },
  { name: 'glass-pillar', q: 'shape=g-tube&rx=0.38&ry=0&rz=0' },
  { name: 'glass-bubble', q: 'shape=g-bubble' },
  { name: 'glass-flame', q: 'shape=g-flame&rx=0.2&ry=-0.5&rz=0.1' },
  { name: 'glass-crown', q: 'shape=g-crown&rx=0.3&ry=0.5' },
  { name: 'glass-cross', q: 'shape=g-cross&rx=0.25&ry=-0.6&rz=0.2' },
  { name: 'coin-cross', q: 'shape=g-coin-cross&rx=0.3&ry=0.5' },
  { name: 'coin-flame', q: 'shape=g-coin-flame&rx=-0.25&ry=-0.45' },
  { name: 'coin-crown', q: 'shape=g-coin-crown&rx=0.35&ry=-0.4' },
]

fs.mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] }) // real GPU, not SwiftShader

for (const r of renders.filter((r) => !only || r.name.includes(only))) {
  const [width, height] = r.size ?? [1100, 1100]
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  await page.goto(`${base}/render-lab?${r.q}`, { waitUntil: 'networkidle', timeout: 180000 })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 })
  await page.waitForTimeout(600)
  const png = await page.screenshot({ omitBackground: true })
  const max = r.max ?? 900
  const out = `${outDir}/${r.name}.webp`
  await sharp(png).trim({ threshold: 2 }).resize({ width: max, height: max, fit: 'inside' }).webp({ quality: 88, alphaQuality: 92 }).toFile(out)
  console.log(`${out}  ${Math.round(fs.statSync(out).size / 1024)} KB`)
  await page.close()
}

await browser.close()
