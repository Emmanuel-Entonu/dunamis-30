// Renders the closed invitation envelope, with its Dunamis button, for the reminder toast:
// src/assets/invite/envelope.webp. It uses the real renderer (src/lib/inviteFrames.ts), so it always
// matches the envelope on the invitation page. Needs no server or database.
// Usage: node scripts/render-invite-art.mjs
import fs from 'node:fs'
import http from 'node:http'
import esbuild from 'esbuild'
import { chromium } from 'playwright'
import sharp from 'sharp'

const js = (await esbuild.build({ stdin: { contents: `import * as api from './src/lib/inviteFrames'; window.api = api`, resolveDir: '.', loader: 'ts' }, bundle: true, format: 'iife', write: false, target: 'es2020', charset: 'utf8', tsconfig: 'tsconfig.json' })).outputFiles[0].text
const files = { '/emblem': 'src/assets/brand/emblem-official.webp', '/ministers': 'src/assets/photos/card-ministers.webp', '/onest.woff2': 'src/fonts/onest-variable.woff2' }
const server = http.createServer((req, res) => {
  if (req.url === '/app.js') return res.end(js)
  if (files[req.url]) return res.end(fs.readFileSync(files[req.url]))
  res.setHeader('content-type', 'text/html; charset=utf-8')
  res.end('<!doctype html><meta charset="utf-8"><body><script src="/app.js"></script></body>')
}).listen(0)
const browser = await chromium.launch()
const page = await browser.newPage()
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message))
await page.goto(`http://localhost:${server.address().port}/`)
const dataUrl = await page.evaluate(async () => {
  const face = new FontFace('Onest', 'url(/onest.woff2)', { weight: '100 900' })
  document.fonts.add(await face.load())
  const load = (src) => new Promise((ok, no) => Object.assign(new Image(), { onload() { ok(this) }, onerror: no, src }))
  const [emblem, ministers] = await Promise.all([load('/emblem'), load('/ministers')])
  const scene = window.api.prepareInvite({ emblem, button: window.api.paintButton(emblem), ministers }, 'Onest')
  const c = document.createElement('canvas')
  c.width = 1080
  c.height = 1920
  window.api.drawInvite(c.getContext('2d'), scene, window.api.TIMING.rest, { showName: false, backdrop: false, effects: false })
  return c.toDataURL('image/png')
})
await browser.close()
server.close()
const target = 'src/assets/invite/envelope.webp'
await sharp(Buffer.from(dataUrl.split(',')[1], 'base64'))
  .trim({ threshold: 1 })
  .resize(420, null, { kernel: 'lanczos3' })
  .webp({ quality: 86, alphaQuality: 90, effort: 6 })
  .toFile(target)
console.log(`${target}  ${Math.round(fs.statSync(target).size / 1024)} KB`)
