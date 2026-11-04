// Captures the glass objects from /render-lab as transparent WebP images.
// Requires the dev server: npm run dev, then node scripts/capture-glass.mjs [baseUrl] [name-filter]
import fs from 'node:fs'
import { chromium } from 'playwright'
import sharp from 'sharp'

const base = process.argv[2] || 'http://localhost:3000'
const only = process.argv[3]
const outDir = process.env.GLASS_OUT || 'src/assets/glass'
const finish = process.env.GLASS_FINISH || 'pale'

// Turned to the left of camera so the faces catch the softbox: that is what makes the glass read pale.
const objects = [
  { name: 'cross', rx: 0.14, ry: -0.42, rz: 0.1 },
  { name: 'flame', rx: 0.1, ry: -0.36, rz: 0.05 },
  { name: 'crown', rx: 0.12, ry: -0.42, rz: 0.06 },
  { name: 'heart', rx: 0.1, ry: -0.42, rz: -0.08 },
  { name: 'dove', rx: 0.12, ry: -0.44, rz: 0.04 },
  { name: 'plane', rx: 0.12, ry: -0.44, rz: 0 },
  { name: 'quote', rx: 0.12, ry: -0.42, rz: 0 },
  { name: 'medical', rx: 0.12, ry: -0.44, rz: 0.1 },
  { name: 'chat', rx: 0.12, ry: -0.42, rz: 0 },
  { name: 'question', rx: 0.14, ry: -0.42, rz: 0 },
  { name: 'play', rx: 0.14, ry: -0.42, rz: 0 },
  { name: 'pin', rx: 0.14, ry: -0.4, rz: 0.1 },
  { name: 'bible', rx: 0.16, ry: -0.44, rz: 0.06 },
  { name: 'house', rx: 0.12, ry: -0.44, rz: 0 },
  { name: 'church', rx: 0.1, ry: -0.42, rz: 0 },
  { name: 'dome', rx: 0.2, ry: 0, rz: 0 },
  { name: 'mic', rx: 0.1, ry: -0.42, rz: 0.1 },
  { name: 'cap', rx: 0.14, ry: -0.44, rz: 0 },
  { name: 'camera', rx: 0.16, ry: -0.4, rz: 0.05 },
  { name: 'sprout', rx: 0.12, ry: -0.42, rz: 0 },
  { name: 'person', rx: 0.08, ry: -0.42, rz: 0 },
  { name: 'flag', rx: 0.1, ry: -0.34, rz: 0.08 },
  { name: 'mountain', rx: 0.12, ry: -0.44, rz: 0 },
  { name: 'canopy', rx: 0.16, ry: -0.36, rz: 0 },
  { name: 'coin-cross', rx: 0.12, ry: -0.5, rz: 0 },
  { name: 'coin-flame', rx: -0.25, ry: -0.45, rz: 0 },
  { name: 'coin-crown', rx: 0.2, ry: -0.42, rz: 0 },
  { name: 'thirty', rx: 0.08, ry: -0.42, rz: 0 },
  { name: 'tube', rx: 1.2, ry: 0.3, rz: 0.5 },
  { name: 'world', rx: 0, ry: 0, rz: 0, size: 1400, max: 1600 },
]

fs.mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] })

for (const o of objects.filter((o) => !only || only.split(',').includes(o.name))) {
  const size = o.size ?? 1000
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => console.log(`${o.name} ERROR`, e.message.slice(0, 200)))
  await page.goto(`${base}/render-lab?shape=p-${o.name}&rx=${o.rx}&ry=${o.ry}&rz=${o.rz}&finish=${finish}`, { waitUntil: 'load', timeout: 180000 })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 })
  await page.waitForTimeout(400)
  const png = await page.screenshot({ omitBackground: true })
  const max = o.max ?? 800
  const out = `${outDir}/${o.name}.webp`
  await sharp(png).trim({ threshold: 2 }).resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 90 }).toFile(out)
  console.log(`${out}  ${Math.round(fs.statSync(out).size / 1024)} KB`)
  await page.close()
}

await browser.close()
