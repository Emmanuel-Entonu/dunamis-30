// Renders the crowd layer of the "I Am Attending" card from the official Glory Dome photo. Its gold tone and fade
// are baked in here, so the card looks the same on every phone and the file stays small on a weak connection.
// Usage: node scripts/render-card-crowd.mjs
import fs from 'node:fs'
import { chromium } from 'playwright'
import sharp from 'sharp'

const SOURCE = 'src/assets/gallery/dome-interior-wide.webp'
const OUTPUT = 'src/assets/photos/card-crowd.webp'
// The layer runs from CROWD_TOP, behind the photo, to the foot of the card. See src/lib/cardFrames.ts.
const WIDTH = 1080
const HEIGHT = 680
// Where the words sit in this layer. The crowd is cleared back there so they stay crisp.
const WORDS_Y = 260

const source = `data:image/png;base64,${(await sharp(SOURCE).png().toBuffer()).toString('base64')}`
const browser = await chromium.launch()
const page = await browser.newPage()
const layer = await page.evaluate(
  async ({ source, WIDTH, HEIGHT, WORDS_Y }) => {
    const crowd = await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = source
    })
    const canvas = document.createElement('canvas')
    canvas.width = WIDTH
    canvas.height = HEIGHT
    const ctx = canvas.getContext('2d')
    const fill = (style) => {
      ctx.fillStyle = style
      ctx.fillRect(0, 0, WIDTH, HEIGHT)
    }

    // Closer in than a plain fit, and held to the bottom of the photo, where the crowd is.
    const scale = Math.max(WIDTH / crowd.naturalWidth, HEIGHT / crowd.naturalHeight) * 1.2
    const w = crowd.naturalWidth * scale
    const h = crowd.naturalHeight * scale
    ctx.drawImage(crowd, (WIDTH - w) / 2, HEIGHT - h, w, h)

    // Towards gold, so the card stays white and gold.
    ctx.globalCompositeOperation = 'saturation'
    fill('rgba(128,128,128,0.7)')
    ctx.globalCompositeOperation = 'soft-light'
    fill('rgba(240,169,43,0.7)')

    // A pale wash, heavier towards the top.
    ctx.globalCompositeOperation = 'source-over'
    const wash = ctx.createLinearGradient(0, 0, 0, HEIGHT)
    wash.addColorStop(0, 'rgba(255,251,241,0.82)')
    wash.addColorStop(1, 'rgba(255,251,241,0.1)')
    fill(wash)

    // It comes up out of the white paper.
    ctx.globalCompositeOperation = 'destination-in'
    const rise = ctx.createLinearGradient(0, 0, 0, HEIGHT)
    rise.addColorStop(0, 'rgba(0,0,0,0)')
    rise.addColorStop(0.4, 'rgba(0,0,0,1)')
    fill(rise)

    // A soft clearing behind the words.
    ctx.globalCompositeOperation = 'destination-out'
    ctx.save()
    ctx.translate(WIDTH / 2, WORDS_Y)
    ctx.scale(1, 0.46)
    const clearing = ctx.createRadialGradient(0, 0, 0, 0, 0, WIDTH * 0.66)
    clearing.addColorStop(0, 'rgba(0,0,0,0.8)')
    clearing.addColorStop(0.62, 'rgba(0,0,0,0.66)')
    clearing.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = clearing
    ctx.fillRect(-WIDTH, -HEIGHT * 3, WIDTH * 2, HEIGHT * 6)
    ctx.restore()

    return canvas.toDataURL('image/png')
  },
  { source, WIDTH, HEIGHT, WORDS_Y },
)
await browser.close()

await sharp(Buffer.from(layer.split(',')[1], 'base64')).webp({ quality: 76, alphaQuality: 100, effort: 6 }).toFile(OUTPUT)
const { width, height } = await sharp(OUTPUT).metadata()
console.log(`${OUTPUT}: ${width}x${height}, ${Math.round(fs.statSync(OUTPUT).size / 1024)} KB`)
