// Renders the link preview image from the real brand files. The slip and gold card here follow
// src/components/home/CardCase.tsx and src/components/AnniversaryCard.tsx, so keep them in step. The
// slip has no notch here: at this size the gold showing through it looked like an orange blob.
// WhatsApp, Facebook and X only load JPEG or PNG previews reliably, and WhatsApp skips large ones.
// They also keep old previews for a while, so a new design needs a new file name (see shareImage
// in src/lib/site.ts).
// Usage: node scripts/render-og.mjs
import fs from 'node:fs'
import { chromium } from 'playwright'
import sharp from 'sharp'

const WIDTH = 1200
const HEIGHT = 630
const OUTPUT = 'public/og-dunamis-30-coins.jpg'

const inline = (file, type = 'image/webp') => `data:${type};base64,${fs.readFileSync(file).toString('base64')}`
const font = inline('src/fonts/onest-variable.woff2', 'font/woff2')
const coinThirty = inline('src/assets/coins/thirty.webp')
const coinDome = inline('src/assets/coins/dome.webp')
const coinGlobe = inline('src/assets/coins/globe.webp')
const coinCross = inline('src/assets/coins/cross.webp')
const crest = inline('src/assets/brand/crest-official.webp')
const emblem = inline('src/assets/brand/emblem-official.webp')
const lockup = inline('src/assets/brand/lockup-white.webp')
const tube = inline('src/assets/renders/glass-tube.webp')
const dove = inline('src/assets/glass/dove.webp')
const crown = inline('src/assets/renders/coin-crown.webp')
const flame = inline('src/assets/renders/coin-flame.webp')
const bubble = inline('src/assets/renders/glass-bubble.webp')

const gold = [
  'radial-gradient(60% 45% at 22% 12%, #ffe9b3 0%, rgba(255,233,179,0) 70%)',
  'radial-gradient(55% 50% at 88% 28%, rgba(255,207,112,0.9) 0%, rgba(255,207,112,0) 70%)',
  'radial-gradient(70% 55% at 25% 88%, rgba(212,118,8,0.85) 0%, rgba(212,118,8,0) 70%)',
  'radial-gradient(60% 55% at 96% 96%, #a35a04 0%, rgba(163,90,4,0) 70%)',
  'linear-gradient(155deg, #ffc45a 0%, #f2a227 50%, #cf770c 100%)',
].join(', ')
const crosses = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12'%3E%3Cpath d='M4.5 4.5l3 3M7.5 4.5l-3 3' stroke='%23fff' stroke-opacity='.6' stroke-width='.9' stroke-linecap='round'/%3E%3C/svg%3E")`

// Where the card comes out of the slip, which the light fans out from.
const LIGHT_X = 1012
const LIGHT_Y = 336

const html = `<!doctype html>
<html>
<head>
<style>
  @font-face { font-family: Onest; src: url(${font}) format('woff2'); font-weight: 100 900; }
  * { box-sizing: border-box; margin: 0; }
  body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; background: #070707; font-family: Onest, sans-serif; position: relative; }
  .layer { position: absolute; inset: 0; }
  .haze { background: radial-gradient(50% 60% at 28% -6%, rgb(46 46 46 / .85), transparent 100%); }
  .ticks {
    background-image:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='192' height='159'%3E%3Cpath d='M48 79.5h96' stroke='%23ffffff' stroke-opacity='.07'/%3E%3C/svg%3E"),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='159' height='192'%3E%3Cpath d='M79.5 48v96' stroke='%23ffffff' stroke-opacity='.07'/%3E%3C/svg%3E");
    background-position: center top; }
  /* Gold halftone rising from the bottom, as on the site */
  .flare { position: absolute; left: -60px; bottom: 0; width: 900px; height: 300px;
    background:
      radial-gradient(rgb(255 190 90 / .5) 1px, transparent 1.4px) 0 0 / 8px 8px,
      radial-gradient(100% 100% at 40% 100%, rgb(227 154 23 / .62), rgb(184 115 11 / .18) 48%, transparent 76%);
    -webkit-mask-image: radial-gradient(70% 100% at 40% 100%, #000 24%, transparent 82%); }
  /* The light the card comes out into */
  .glow { background: radial-gradient(420px 420px at ${LIGHT_X}px ${LIGHT_Y - 70}px, rgb(240 169 43 / .46), rgb(240 169 43 / .17) 52%, transparent 100%); }
  .rays {
    background: repeating-conic-gradient(from 3deg at ${LIGHT_X}px ${LIGHT_Y}px, rgb(255 214 140 / .17) 0deg 1.1deg, transparent 1.1deg 8.6deg);
    -webkit-mask-image: radial-gradient(640px 640px at ${LIGHT_X}px ${LIGHT_Y}px, #000 22%, transparent 100%); }
  /* Falling light */
  .streak { position: absolute; width: 1px; background: linear-gradient(to bottom, transparent, rgb(255 255 255 / .62) 92%, transparent); }

  .object { position: absolute; display: block; }

  .card { position: absolute; left: 838px; top: 37px; width: 334px; aspect-ratio: 302 / 479; transform: rotate(-10deg);
    container-type: inline-size; overflow: hidden; border-radius: 20px; background: ${gold};
    box-shadow: 0 34px 80px -18px rgb(227 154 23 / .62); }
  .card .pattern { position: absolute; inset: 0; background-image: ${crosses};
    -webkit-mask-image: radial-gradient(60% 44% at 50% 42%, #000 0%, transparent 78%); }
  .card .sheen { position: absolute; inset: 0 0 50% 0; background: linear-gradient(to bottom, rgb(255 255 255 / .2), transparent); }
  .card .gloss { position: absolute; inset: 0; background: linear-gradient(112deg, transparent 22%, rgb(255 255 255 / .36) 40%, rgb(255 255 255 / .07) 48%, transparent 60%); }
  .card .rim { position: absolute; inset: 0; border-radius: inherit;
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / .3), inset 0 1px 0 rgb(255 255 255 / .6), inset 0 -16px 28px -12px rgb(110 52 0 / .4); }
  .card .inner { position: relative; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 14cqw 8cqw 9cqw; }
  .card .crest { width: 68cqw; filter: drop-shadow(0 10px 16px rgb(90 40 0 / .45)); }
  .card .name { font-size: 10cqw; line-height: 1; font-weight: 600; letter-spacing: -.02em; color: #140c02; }

  .slip { position: absolute; left: 884px; top: 330px; width: 372px; aspect-ratio: 325 / 488; transform: rotate(-12deg);
    container-type: inline-size; border-radius: 22px; }
  .slip .shadow { position: absolute; inset: 0; border-radius: 22px; -webkit-mask-image: none; box-shadow: 0 -18px 40px rgb(0 0 0 / .55), 0 6px 10px rgb(0 0 0 / .45); clip-path: inset(-80px -80px 0 -80px); }
  .slip .body { position: absolute; inset: 0; overflow: hidden; border-radius: 22px;
    background: linear-gradient(180deg, #2c2c2c 0%, #181818 46%, #0c0c0c 100%); }
  .slip .burst { position: absolute; inset: 0;
    background: repeating-conic-gradient(from 90deg at 50% 0%, rgb(255 255 255 / .07) 0deg .5deg, transparent .5deg 5.5deg);
    -webkit-mask-image: radial-gradient(120% 95% at 50% 0%, #000 15%, transparent 78%); }
  .slip .shine { position: absolute; inset: 0; background: radial-gradient(110% 55% at 0% 0%, rgb(255 255 255 / .13), transparent 62%); }
  .slip .reflect { position: absolute; inset: 0; background: linear-gradient(118deg, transparent 36%, rgb(255 255 255 / .075) 46%, transparent 57%); }
  .slip .edge { position: absolute; inset: 0; border-radius: 22px; box-shadow: inset 0 0 0 1px rgb(255 255 255 / .08), inset 0 1px 0 rgb(255 255 255 / .16); }
  .slip .mark { position: absolute; left: 8%; top: 9%; display: flex; flex-direction: column; align-items: center; gap: 2.5cqw; color: #fff; }
  .slip .mark img { width: 17cqw; height: auto; transform: rotate(90deg); }
  .slip .mark span { font-size: 9.5cqw; line-height: 1; font-weight: 500; writing-mode: vertical-rl; }

  .copy { position: absolute; left: 62px; top: 50px; color: #fff; }
  .lockup { display: block; width: 236px; }
  h1 { margin-top: 42px; font-size: 83px; line-height: 1.03; font-weight: 500; letter-spacing: -.018em; }
  .line { margin-top: 20px; font-size: 24px; line-height: 1.3; font-weight: 500; color: #ffd27a; }
</style>
</head>
<body>
  <div class="layer haze"></div>
  <div class="layer ticks"></div>
  <div class="flare"></div>
  <div class="layer glow"></div>
  <div class="layer rays"></div>

  <span class="streak" style="left: 356px; top: 0; height: 104px"></span>
  <span class="streak" style="left: 724px; top: 118px; height: 132px"></span>
  <span class="streak" style="left: 556px; top: 408px; height: 118px"></span>

  <img class="object" src="${tube}" style="width: 300px; right: -132px; top: -96px; transform: rotate(-24deg)" />
  <img class="object" src="${bubble}" style="width: 96px; left: 716px; top: 268px" />

  <svg class="layer" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none">
    <path d="M430 560C560 590 720 560 846 470" stroke="rgb(255 255 255 / .34)" stroke-dasharray="2 7" />
    <path d="M764 150A300 300 0 0 0 738 276" stroke="rgb(255 255 255 / .46)" stroke-width="1.25" />
    <circle cx="764" cy="150" r="4.5" fill="#fff" />
  </svg>

  <img class="object" src="${coinGlobe}" style="width: 104px; left: 400px; top: 424px; transform: rotate(10deg); filter: drop-shadow(0 12px 16px rgb(0 0 0 / .55))" />
  <img class="object" src="${coinCross}" style="width: 128px; left: 34px; top: 424px; transform: rotate(-12deg); filter: drop-shadow(0 14px 18px rgb(0 0 0 / .55))" />
  <img class="object" src="${coinDome}" style="width: 150px; left: 268px; top: 494px; transform: rotate(7deg); filter: drop-shadow(0 16px 20px rgb(0 0 0 / .6))" />
  <img class="object" src="${coinThirty}" style="width: 186px; left: 112px; top: 462px; transform: rotate(-5deg); filter: drop-shadow(0 18px 24px rgb(0 0 0 / .6))" />

  <div class="card">
    <span class="pattern"></span>
    <span class="sheen"></span>
    <span class="gloss"></span>
    <span class="rim"></span>
    <div class="inner">
      <img class="crest" src="${crest}" />
      <span class="name">Dunamis@30</span>
    </div>
  </div>

  <div class="slip">
    <div class="shadow"></div>
    <div class="body">
      <div class="burst"></div>
      <div class="shine"></div>
      <div class="reflect"></div>
      <div class="edge"></div>
      <div class="mark">
        <img src="${emblem}" />
        <span>Dunamis</span>
      </div>
    </div>
  </div>

  <img class="object" src="${flame}" style="width: 128px; left: 700px; top: 470px; transform: rotate(-10deg); filter: drop-shadow(0 16px 20px rgb(0 0 0 / .55))" />
  <img class="object" src="${crown}" style="width: 92px; left: 578px; top: 410px; transform: rotate(12deg); filter: drop-shadow(0 12px 16px rgb(0 0 0 / .5))" />
  <img class="object" src="${dove}" style="width: 112px; left: 646px; top: 26px; transform: rotate(-6deg); filter: drop-shadow(0 12px 16px rgb(0 0 0 / .5))" />

  <div class="copy">
    <img class="lockup" src="${lockup}" />
    <h1>Same Mission.<br />Greater Impact.</h1>
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
