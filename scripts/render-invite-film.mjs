// Films the 3D invitation opening for the home page: public/films/invitation.webm (VP9), invitation.mp4
// (H.264, for Safari) and invitation-poster.webp. It uses the real 3D stage (src/lib/invite3d.ts) with the
// sample name, in Edge for its video encoders. A film costs a phone almost nothing to play; drawing the 3D
// live would cost a slow one dearly. The film fades in and out, so it loops without a jump.
// Usage: node scripts/render-invite-film.mjs
import fs from 'node:fs'
import http from 'node:http'
import esbuild from 'esbuild'
import { chromium } from 'playwright'

const W = 720
const H = 1280
const FPS = 30
const outDir = 'public/films'

const js = (
  await esbuild.build({
    stdin: {
      contents: `
        import { createInviteStage, OPEN } from './src/lib/invite3d'
        import { BufferTarget, CanvasSource, Mp4OutputFormat, Output, WebMOutputFormat } from 'mediabunny'
        window.film = async () => {
          const face = new FontFace('Onest', 'url(/onest.woff2)', { weight: '100 900' })
          document.fonts.add(await face.load())
          await Promise.all([500, 600, 700].map((w) => document.fonts.load(w + ' 40px Onest')))
          const load = (src) => new Promise((ok, no) => Object.assign(new Image(), { onload() { ok(this) }, onerror: no, src }))
          const [emblem, ministers, rays] = await Promise.all([load('/emblem'), load('/ministers'), load('/rays')])
          const stage = await createInviteStage({ emblem, ministers, rays }, 'Onest', { preserve: true, backdrop: true, detail: 1, letterDetail: 1 })
          stage.setName('Your Name')
          stage.resize(${W}, ${H}, 1)
          stage.setLayout('story')
          stage.startFrom(null)
          const copy = Object.assign(document.createElement('canvas'), { width: ${W}, height: ${H} })
          const ctx = copy.getContext('2d')
          const lead = 0.6
          const seconds = lead + OPEN.duration + 2.2
          const frames = Math.round(seconds * ${FPS})
          const paint = (t) => {
            stage.draw(t - lead, 0)
            ctx.drawImage(stage.canvas, 0, 0, ${W}, ${H})
            // Into and out of the dark, so the end meets the start.
            const fade = Math.max(0, 1 - t / 0.4, 1 - (seconds - t) / 0.5)
            if (fade > 0) {
              ctx.fillStyle = 'rgba(11,9,6,' + Math.min(1, fade) + ')'
              ctx.fillRect(0, 0, ${W}, ${H})
            }
          }
          paint(lead)
          const poster = copy.toDataURL('image/webp', 0.86)
          const encode = async (format, codec, bitrate) => {
            const target = new BufferTarget()
            const output = new Output({ format, target })
            const source = new CanvasSource(copy, { codec, bitrate, keyFrameInterval: 2 })
            output.addVideoTrack(source, { frameRate: ${FPS} })
            await output.start()
            for (let i = 0; i < frames; i++) {
              paint(i / ${FPS})
              await source.add(i / ${FPS}, 1 / ${FPS})
            }
            source.close()
            await output.finalize()
            const bytes = new Uint8Array(target.buffer)
            let text = ''
            for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
            return btoa(text)
          }
          const webm = await encode(new WebMOutputFormat(), 'vp9', 1_100_000)
          const mp4 = await encode(new Mp4OutputFormat({ fastStart: 'in-memory' }), 'avc', 1_150_000)
          stage.dispose()
          return { poster, webm, mp4 }
        }`,
      resolveDir: '.',
      loader: 'ts',
    },
    bundle: true,
    format: 'iife',
    write: false,
    target: 'es2020',
    charset: 'utf8',
    tsconfig: 'tsconfig.json',
    logLevel: 'error',
  })
).outputFiles[0].text

const files = { '/emblem': 'src/assets/brand/emblem-official.webp', '/ministers': 'src/assets/photos/card-ministers.webp', '/rays': 'src/assets/coins/rays.webp', '/onest.woff2': 'src/fonts/onest-variable.woff2' }
const server = http
  .createServer((req, res) => {
    if (req.url === '/app.js') return res.end(js)
    if (files[req.url]) return res.end(fs.readFileSync(files[req.url]))
    res.setHeader('content-type', 'text/html; charset=utf-8')
    res.end('<!doctype html><meta charset="utf-8"><body><script src="/app.js"></script></body>')
  })
  .listen(0)
const browser = await chromium.launch({ channel: 'msedge', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage()
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message))
await page.goto(`http://localhost:${server.address().port}/`)
const made = await page.evaluate(() => window.film())
await browser.close()
server.close()

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(`${outDir}/invitation.webm`, Buffer.from(made.webm, 'base64'))
fs.writeFileSync(`${outDir}/invitation.mp4`, Buffer.from(made.mp4, 'base64'))
fs.writeFileSync(`${outDir}/invitation-poster.webp`, Buffer.from(made.poster.split(',')[1], 'base64'))
for (const f of ['invitation.webm', 'invitation.mp4', 'invitation-poster.webp']) console.log(`${outDir}/${f}  ${Math.round(fs.statSync(`${outDir}/${f}`).size / 1024)} KB`)
