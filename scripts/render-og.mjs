// Renders the link preview image from the real brand files: public/og-dunamis-30.jpg.
// WhatsApp, Facebook and X only load JPEG or PNG previews reliably, and WhatsApp skips large ones.
// Usage: node scripts/render-og.mjs
import fs from 'node:fs'
import { chromium } from 'playwright'
import sharp from 'sharp'

const WIDTH = 1200
const HEIGHT = 630
const OUTPUT = 'public/og-dunamis-30.jpg'

const inline = (file, type) => `data:${type};base64,${fs.readFileSync(file).toString('base64')}`
const font = inline('src/fonts/onest-variable.woff2', 'font/woff2')
const hand = inline('src/assets/brand/hero-hand.webp', 'image/webp')
const crest = inline('src/assets/brand/crest-official.webp', 'image/webp')
const lockup = inline('src/assets/brand/lockup-white.webp', 'image/webp')
const tube = inline('src/assets/renders/glass-tube.webp', 'image/webp')

const html = `<!doctype html>
<html>
<head>
<style>
  @font-face { font-family: Onest; src: url(${font}) format('woff2'); font-weight: 100 900; }
  * { box-sizing: border-box; margin: 0; }
  body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; background: #080808; font-family: Onest, sans-serif; position: relative; }
  .glow { position: absolute; left: 50%; top: -170px; width: 1300px; height: 360px; transform: translateX(-50%); border-radius: 50%; background: #1f1f1f; filter: blur(110px); }
  .ticks { position: absolute; inset: 0;
    background-image:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='192' height='159'%3E%3Cpath d='M48 79.5h96' stroke='%23ffffff' stroke-opacity='.07'/%3E%3C/svg%3E"),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='159' height='192'%3E%3Cpath d='M79.5 48v96' stroke='%23ffffff' stroke-opacity='.07'/%3E%3C/svg%3E");
    background-position: center top; }
  .flare { position: absolute; left: 0; right: 0; bottom: 0; height: 330px;
    background:
      radial-gradient(rgb(255 190 90 / .5) 1px, transparent 1.4px) 0 0 / 8px 8px,
      radial-gradient(100% 100% at 50% 100%, rgb(227 154 23 / .75), rgb(184 115 11 / .22) 45%, transparent 75%);
    -webkit-mask-image: radial-gradient(90% 100% at 50% 100%, #000 30%, transparent 80%); }
  .tube { position: absolute; width: 300px; }
  .tube.left { left: -110px; bottom: -80px; transform: rotate(72deg); }
  .tube.right { right: -120px; top: 250px; transform: rotate(-108deg); }
  .top { position: absolute; inset: 0 0 auto 0; padding-top: 34px; text-align: center; color: #fff; }
  .lockup { display: block; width: 214px; margin: 0 auto; }
  h1 { margin-top: 24px; font-size: 68px; line-height: 1.08; font-weight: 500; letter-spacing: -0.01em; }
  .line { margin-top: 14px; font-size: 25px; font-weight: 500; color: #ffd27a; }
  .stage { position: absolute; left: 50%; bottom: -142px; width: 560px; transform: translateX(-50%); }
  .hand { display: block; width: 100%; filter: drop-shadow(0 18px 26px rgb(0 0 0 / .6)); }
  .halo { position: absolute; left: 52%; bottom: 44%; width: 170px; height: 170px; transform: translate(-50%, 0); border-radius: 50%; background: rgb(240 169 43 / .5); filter: blur(44px); }
  .crest { position: absolute; left: 52%; bottom: 42%; width: 176px; transform: translateX(-50%); filter: drop-shadow(0 14px 18px rgb(0 0 0 / .6)); }
</style>
</head>
<body>
  <div class="glow"></div>
  <div class="ticks"></div>
  <div class="flare"></div>
  <img class="tube left" src="${tube}" />
  <img class="tube right" src="${tube}" />
  <div class="stage">
    <img class="hand" src="${hand}" />
    <div class="halo"></div>
    <img class="crest" src="${crest}" />
  </div>
  <div class="top">
    <img class="lockup" src="${lockup}" />
    <h1>Same Mission. Greater Impact.</h1>
    <p class="line">30 years of God’s faithfulness · The Glory Dome, Abuja</p>
  </div>
</body>
</html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(400)
const shot = await page.screenshot({ type: 'png' })
await browser.close()

const jpeg = await sharp(shot).resize(WIDTH, HEIGHT, { kernel: 'lanczos3' }).jpeg({ quality: 86, mozjpeg: true }).toBuffer()
fs.writeFileSync(OUTPUT, jpeg)
console.log(`${OUTPUT}: ${WIDTH}x${HEIGHT}, ${Math.round(jpeg.length / 1024)} KB`)
