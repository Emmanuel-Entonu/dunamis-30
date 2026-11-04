// Converts OFL fonts into the three.js typeface JSON used by the 3D renders.
// Run once: node scripts/build-typeface.mjs
import fs from 'node:fs'
import path from 'node:path'
import opentype from 'opentype.js'

const fonts = [
  {
    family: 'Onest',
    source: 'node_modules/@fontsource/onest/files/onest-latin-700-normal.woff',
    out: 'public/fonts/onest-700.typeface.json',
    chars: '0123456789',
  },
  // Trajan-style roman for the anniversary crest lettering.
  {
    family: 'Cinzel',
    source: 'node_modules/@fontsource/cinzel/files/cinzel-latin-800-normal.woff',
    out: 'public/fonts/cinzel-800.typeface.json',
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'-–. ",
  },
]

for (const { family, source, out, chars } of fonts) build(family, source, out, chars)

function build(family, source, out, chars) {
  const buffer = fs.readFileSync(source)
  const font = opentype.parse(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  )
  const r = Math.round
  // getPath() returns canvas space (y-down); three.js wants font space (y-up).
  const y = (v) => r(-v)

  const glyphs = {}
  for (const char of chars) {
    const glyph = font.charToGlyph(char)
    const ops = []
    // three.js Font expects the end point first, then control points.
    for (const c of glyph.getPath(0, 0, font.unitsPerEm).commands) {
      if (c.type === 'M') ops.push('m', r(c.x), y(c.y))
      else if (c.type === 'L') ops.push('l', r(c.x), y(c.y))
      else if (c.type === 'Q') ops.push('q', r(c.x), y(c.y), r(c.x1), y(c.y1))
      else if (c.type === 'C') ops.push('b', r(c.x), y(c.y), r(c.x1), y(c.y1), r(c.x2), y(c.y2))
    }
    const box = glyph.getBoundingBox()
    glyphs[char] = {
      ha: r(glyph.advanceWidth),
      x_min: r(box.x1),
      x_max: r(box.x2),
      o: ops.join(' '),
    }
  }

  const head = font.tables.head
  const json = {
    glyphs,
    familyName: family,
    ascender: font.ascender,
    descender: font.descender,
    underlinePosition: font.tables.post.underlinePosition,
    underlineThickness: font.tables.post.underlineThickness,
    boundingBox: { xMin: head.xMin, yMin: head.yMin, xMax: head.xMax, yMax: head.yMax },
    resolution: font.unitsPerEm,
    original_font_information: { license: 'SIL Open Font License 1.1', family },
  }

  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, JSON.stringify(json))
  console.log(`wrote ${out} (${fs.statSync(out).size} bytes)`)
}
