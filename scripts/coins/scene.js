// The commemorative coins around the home page hero, modelled in three.js. Loaded in a browser by
// scripts/render-coins.mjs, which calls window.renderCoin once for each coin.
import * as THREE from 'three'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'

const SIZE = window.__coinSize
const font = new FontLoader().parse(window.__coinFont)

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
renderer.setSize(SIZE, SIZE, false)
renderer.setClearColor(0x000000, 0)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05
document.body.append(renderer.domElement)

/* ─── Light: a dark studio with a few bright panels, which is what metal shows ─── */

const pmrem = new THREE.PMREMGenerator(renderer)

function studio() {
  const room = new THREE.Scene()
  room.background = new THREE.Color(0x040302)
  const panel = (w, h, position, color, power) => {
    const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, toneMapped: false })
    material.color.multiplyScalar(power)
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material)
    mesh.position.set(...position)
    mesh.lookAt(0, 0, 0)
    room.add(mesh)
  }
  panel(9, 3, [0, 7, 5], 0xfff1d6, 7)
  panel(2.2, 11, [-8, 1, 3], 0xffe6bd, 9)
  panel(1.4, 10, [8, -1, 4], 0xffc873, 6)
  panel(10, 1.4, [0, -7, 4], 0xffb347, 3)
  panel(5, 5, [2, 2, 11], 0xffe9c9, 0.55)
  panel(1, 6, [-3, -2, 9], 0xffffff, 1.6)
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    panel(2.6, 2.6, [Math.cos(a) * 9, Math.sin(a) * 9, 1.5], 0xffefd6, 1.1 + (i % 3) * 0.55)
  }
  return pmrem.fromScene(room, 0.015).texture
}
const environment = studio()

/* ─── Surfaces ─── */

const canvasTexture = (draw, width = 2048, height = width) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d'), width, height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
  return texture
}

const INNER_RING = 0.565
const FIELD_RADIUS = 0.83

/** Fine rays from the centre of the coin, the same motif as the sunburst on the card's slip. */
const fieldBump = canvasTexture((ctx, w) => {
  const c = w / 2
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, w, w)
  const reach = c * (INNER_RING / FIELD_RADIUS)
  ctx.lineWidth = 2.2
  for (let i = 0; i < 180; i++) {
    const a = (i / 180) * Math.PI * 2
    ctx.strokeStyle = i % 2 ? '#a8a8a8' : '#5a5a5a'
    ctx.beginPath()
    ctx.moveTo(c + Math.cos(a) * reach * 0.08, c + Math.sin(a) * reach * 0.08)
    ctx.lineTo(c + Math.cos(a) * reach, c + Math.sin(a) * reach)
    ctx.stroke()
  }
})

/** The ridges around a coin's edge. */
const edgeBump = canvasTexture(
  (ctx, w, h) => {
    const ridges = 220
    for (let i = 0; i < ridges; i++) {
      ctx.fillStyle = i % 2 ? '#d8d8d8' : '#202020'
      ctx.fillRect((i / ridges) * w, 0, w / ridges + 1, h)
    }
  },
  4096,
  8,
)

const GOLD = 0xf2b13a
const metal = (color, roughness, extra = {}) =>
  new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness, envMapIntensity: 1.25, ...extra })
// Relief glows very slightly from within, so an emblem stays readable at any angle.
const relief = (color, roughness, glow) => metal(color, roughness, { emissive: 0xa86f18, emissiveIntensity: glow })

const finishes = {
  // Black lacquer with gold relief: the set's main look, and the site's own colours.
  obsidian: () => ({
    field: new THREE.MeshPhysicalMaterial({ color: 0x0b0a08, metalness: 0.75, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.16, envMapIntensity: 1, bumpMap: fieldBump, bumpScale: 0.9 }),
    rim: metal(GOLD, 0.2),
    relief: relief(0xffcf6a, 0.22, 0.55),
  }),
  // Struck gold: a frosted field with bright, polished relief.
  gold: () => ({
    field: metal(0x9a6c1c, 0.5, { bumpMap: fieldBump, bumpScale: 0.8, envMapIntensity: 0.8 }),
    rim: metal(0xf6bb45, 0.16),
    relief: relief(0xffdf8e, 0.14, 0.8),
  }),
  // Pale gold, a nod to the pale glass elsewhere on the site.
  pale: () => ({
    field: metal(0xefe2c4, 0.36, { bumpMap: fieldBump, bumpScale: 0.7, envMapIntensity: 0.9 }),
    rim: metal(GOLD, 0.18),
    relief: metal(0x7d5410, 0.26),
  }),
}

/** Makes the edge facing the crest glow, as if the crest were the light source. */
function withEdgeLight(material, direction, strength) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uEdgeDir = { value: direction }
    shader.uniforms.uEdgeGlow = { value: new THREE.Vector3(7, 4.5, 1.7).multiplyScalar(strength) }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCoinPosition;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCoinPosition = position;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCoinPosition;\nuniform vec2 uEdgeDir;\nuniform vec3 uEdgeGlow;')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float edgeFacing = pow(max(dot(normalize(vCoinPosition.xy), uEdgeDir), 0.0), 16.0);
        float edgeBand = smoothstep(0.925, 0.992, length(vCoinPosition.xy));
        totalEmissiveRadiance += uEdgeGlow * edgeFacing * edgeBand;`,
      )
  }
  return material
}

/* ─── Emblems: flat outlines, struck into relief ─── */

const rounded = (points, radius = 0.25, into = new THREE.Shape()) => {
  const n = points.length
  points.forEach((p, i) => {
    const prev = points[(i - 1 + n) % n]
    const next = points[(i + 1) % n]
    const l1 = Math.hypot(prev[0] - p[0], prev[1] - p[1])
    const l2 = Math.hypot(next[0] - p[0], next[1] - p[1])
    const r = Math.min(radius, l1 / 2, l2 / 2)
    const a = [p[0] + ((prev[0] - p[0]) / l1) * r, p[1] + ((prev[1] - p[1]) / l1) * r]
    const b = [p[0] + ((next[0] - p[0]) / l2) * r, p[1] + ((next[1] - p[1]) / l2) * r]
    if (i === 0) into.moveTo(a[0], a[1])
    else into.lineTo(a[0], a[1])
    into.quadraticCurveTo(p[0], p[1], b[0], b[1])
  })
  into.closePath()
  return into
}
const roundRect = (w, h, r, cx = 0, cy = 0, into) =>
  rounded(
    [
      [cx - w / 2, cy - h / 2],
      [cx + w / 2, cy - h / 2],
      [cx + w / 2, cy + h / 2],
      [cx - w / 2, cy + h / 2],
    ],
    r,
    into,
  )
const disc = (r, cx = 0, cy = 0, into = new THREE.Shape()) => {
  into.absarc(cx, cy, r, 0, Math.PI * 2, false)
  return into
}

/** A copy of a shape, turned, scaled and moved, with its holes. */
const moved = (shape, { rot = 0, s = 1, x = 0, y = 0 }) => {
  const turn = (p) => new THREE.Vector2(p.x * s * Math.cos(rot) - p.y * s * Math.sin(rot) + x, p.x * s * Math.sin(rot) + p.y * s * Math.cos(rot) + y)
  const copy = new THREE.Shape(shape.getPoints(40).map(turn))
  copy.holes = shape.holes.map((h) => new THREE.Path(h.getPoints(40).map(turn)))
  return copy
}
const asHole = (shape) => new THREE.Path(shape.getPoints(40))

const crossOutline = (thick = 0.62) =>
  rounded(
    [
      [-thick, -3.1],
      [thick, -3.1],
      [thick, 0.5],
      [1.95, 0.5],
      [1.95, 1.72],
      [thick, 1.72],
      [thick, 3.1],
      [-thick, 3.1],
      [-thick, 1.72],
      [-1.95, 1.72],
      [-1.95, 0.5],
      [-thick, 0.5],
    ],
    0.16,
  )

const flameOutline = (s = 1, x = 0, y = 0) => {
  const f = new THREE.Shape()
  f.moveTo(x, y - 3.1 * s)
  f.bezierCurveTo(x - 1.5 * s, y - 3.1 * s, x - 2.5 * s, y - 2.05 * s, x - 2.45 * s, y - 0.8 * s)
  f.bezierCurveTo(x - 2.4 * s, y + 0.5 * s, x - 1 * s, y + 1.1 * s, x - 0.55 * s, y + 3.65 * s)
  f.bezierCurveTo(x + 1 * s, y + 2.7 * s, x + 2.5 * s, y + 1 * s, x + 2.45 * s, y - 0.8 * s)
  f.bezierCurveTo(x + 2.4 * s, y - 2.1 * s, x + 1.4 * s, y - 3.1 * s, x, y - 3.1 * s)
  return f
}

const emblems = {
  cross: () => [crossOutline()],
  flame: () => {
    const outer = flameOutline()
    outer.holes.push(asHole(flameOutline(0.46, 0, -1.3)))
    return [outer]
  },
  dove: () => {
    const d = new THREE.Shape()
    d.moveTo(-3.3, 1.05)
    d.bezierCurveTo(-2.95, 1.55, -2.45, 1.75, -2.05, 1.55)
    d.bezierCurveTo(-1.65, 1.35, -1.45, 0.95, -1.05, 0.95)
    d.bezierCurveTo(-0.95, 2, -0.35, 3, 1.05, 3.4)
    d.bezierCurveTo(0.75, 2.65, 0.9, 1.75, 1.45, 1.2)
    d.bezierCurveTo(1.95, 1.5, 2.75, 1.75, 3.5, 1.35)
    d.bezierCurveTo(3.1, 0.75, 2.2, -0.25, 1.05, -0.55)
    d.bezierCurveTo(1.45, -1.25, 2.3, -1.95, 3.2, -2.1)
    d.bezierCurveTo(2.2, -2.55, 0.75, -2.2, -0.15, -1.25)
    d.bezierCurveTo(-0.95, -0.95, -1.95, -0.25, -2.3, 0.65)
    d.bezierCurveTo(-2.55, 0.8, -2.95, 0.85, -3.3, 1.05)
    return [d]
  },
  heart: () => {
    const h = new THREE.Shape()
    h.moveTo(0, -2.9)
    h.bezierCurveTo(-1.2, -1.7, -3.1, -0.5, -3.1, 1)
    h.bezierCurveTo(-3.1, 2.3, -2.2, 3, -1.4, 3)
    h.bezierCurveTo(-0.85, 3, -0.42, 2.72, -0.22, 2.32)
    h.bezierCurveTo(-0.12, 2.12, 0.12, 2.12, 0.22, 2.32)
    h.bezierCurveTo(0.42, 2.72, 0.85, 3, 1.4, 3)
    h.bezierCurveTo(2.2, 3, 3.1, 2.3, 3.1, 1)
    h.bezierCurveTo(3.1, -0.5, 1.2, -1.7, 0, -2.9)
    h.holes.push(asHole(moved(crossOutline(0.62), { s: 0.42, y: 0.42 })))
    return [h]
  },
  crown: () => {
    const body = rounded(
      [
        [-2.6, -1.9],
        [2.6, -1.9],
        [3.1, 1.3],
        [1.55, 0.05],
        [0, 2.3],
        [-1.55, 0.05],
        [-3.1, 1.3],
      ],
      0.16,
    )
    const band = roundRect(5.7, 0.52, 0.14, 0, -2.75)
    return [body, band, disc(0.36, 0, 2.85), disc(0.32, 3.15, 1.85), disc(0.32, -3.15, 1.85)]
  },
  bible: () => {
    const page = (side) => {
      const p = new THREE.Shape()
      p.moveTo(side * 0.17, -1.72)
      p.bezierCurveTo(side * 1.2, -1.0, side * 2.7, -1.15, side * 4, -1.75)
      p.lineTo(side * 4, 1.72)
      p.bezierCurveTo(side * 2.7, 2.3, side * 1.2, 2.15, side * 0.17, 1.42)
      p.closePath()
      return p
    }
    const line = (y) =>
      new THREE.Path([
        new THREE.Vector2(-3.4, y + 0.42),
        new THREE.Vector2(-2.2, y + 0.42),
        new THREE.Vector2(-0.75, y + 0.02),
        new THREE.Vector2(-0.75, y - 0.2),
        new THREE.Vector2(-2.2, y + 0.2),
        new THREE.Vector2(-3.4, y + 0.2),
      ])
    const left = page(-1)
    ;[0.95, 0.15, -0.65].forEach((y) => left.holes.push(line(y)))
    const right = page(1)
    right.holes.push(asHole(moved(crossOutline(0.62), { s: 0.42, x: 2.1, y: -0.05 })))
    const cover = new THREE.Shape()
    cover.moveTo(0, -2.5)
    cover.bezierCurveTo(1.2, -1.75, 3, -1.95, 4.5, -2.45)
    cover.lineTo(4.5, -2.05)
    cover.bezierCurveTo(3, -1.55, 1.2, -1.35, 0, -2.08)
    cover.bezierCurveTo(-1.2, -1.35, -3, -1.55, -4.5, -2.05)
    cover.lineTo(-4.5, -2.45)
    cover.bezierCurveTo(-3, -1.95, -1.2, -1.75, 0, -2.5)
    return [left, right, cover]
  },
  dome: () => {
    const dome = new THREE.Shape()
    dome.moveTo(-3, 0)
    dome.absarc(0, 0, 3, Math.PI, 0, true)
    dome.closePath()
    // The ribs of the dome.
    ;[1.55, 0.42].forEach((rx, i) => {
      ;[-1, 1].forEach((side) => {
        if (i === 1 && side === -1) return
        const outer = []
        const inner = []
        const width = 0.15
        const sign = i === 1 ? 0 : side
        for (let t = 0.13; t <= 0.9; t += 0.06) {
          const a = t * (Math.PI / 2)
          const xOuter = i === 1 ? 0.08 : sign * (rx + width) * Math.cos(a)
          const xInner = i === 1 ? -0.08 : sign * (rx - width) * Math.cos(a)
          outer.push(new THREE.Vector2(xOuter, 2.86 * Math.sin(a)))
          inner.unshift(new THREE.Vector2(xInner, 2.86 * Math.sin(a)))
        }
        dome.holes.push(new THREE.Path([...outer, ...inner]))
      })
    })
    const columns = Array.from({ length: 7 }, (_, i) => roundRect(0.34, 1.75, 0.06, -2.7 + i * 0.9, -1.33))
    return [
      dome,
      roundRect(6.9, 0.36, 0.08, 0, -0.26),
      ...columns,
      roundRect(7.3, 0.38, 0.08, 0, -2.38),
      roundRect(8.1, 0.32, 0.08, 0, -2.82),
      roundRect(0.72, 0.36, 0.08, 0, 3.12),
      moved(crossOutline(0.62), { s: 0.26, y: 3.95 }),
    ]
  },
  globe: () => {
    const ring = disc(3)
    ring.holes.push(asHole(disc(2.7)))
    const meridian = new THREE.Shape()
    meridian.absellipse(0, 0, 1.42, 2.9, 0, Math.PI * 2, false, 0)
    const hollow = new THREE.Path()
    hollow.absellipse(0, 0, 1.14, 2.75, 0, Math.PI * 2, false, 0)
    meridian.holes.push(hollow)
    return [
      ring,
      meridian,
      roundRect(0.28, 5.6, 0.04),
      roundRect(5.6, 0.28, 0.04),
      roundRect(4.75, 0.26, 0.04, 0, 1.5),
      roundRect(4.75, 0.26, 0.04, 0, -1.5),
    ]
  },
  chain: () => {
    const link = () => {
      const outer = roundRect(4, 2.1, 1.05)
      outer.holes.push(asHole(roundRect(2.55, 0.86, 0.43)))
      return outer
    }
    const spark = (x, y, rot) =>
      moved(
        rounded(
          [
            [-0.13, -0.5],
            [0.13, -0.5],
            [0.2, 0.5],
            [-0.2, 0.5],
          ],
          0.06,
        ),
        { x, y, rot },
      )
    return [moved(link(), { x: -2.15, y: -1.05, rot: 0.62 }), moved(link(), { x: 2.15, y: 1.05, rot: 0.62 }), spark(-0.62, 1.05, 0.32), spark(0.62, -1.05, 0.32 + Math.PI), spark(0.02, 1.32, -0.25), spark(-0.02, -1.32, Math.PI - 0.25)]
  },
  mountain: () => {
    const range = rounded(
      [
        [-4.2, -2.6],
        [-2.55, -0.4],
        [-1.95, -1.05],
        [0, 2],
        [1.95, -1.05],
        [2.55, -0.4],
        [4.2, -2.6],
      ],
      0.1,
    )
    // Light falling down the face of the peak.
    range.holes.push(
      new THREE.Path([
        new THREE.Vector2(0, 1.28),
        new THREE.Vector2(0.72, 0.15),
        new THREE.Vector2(0.28, 0.42),
        new THREE.Vector2(-0.02, -0.05),
        new THREE.Vector2(-0.32, 0.42),
        new THREE.Vector2(-0.72, 0.15),
      ]),
    )
    return [range, moved(crossOutline(0.62), { s: 0.31, y: 3.08 })]
  },
  thirty: () => font.generateShapes('30', 3),
}

/** Fits an emblem's outlines inside the coin's inner ring, centred. */
function emblemGeometry(name, box) {
  const shapes = emblems[name]()
  const bounds = new THREE.Box2()
  shapes.forEach((s) => s.getPoints(32).forEach((p) => bounds.expandByPoint(p)))
  const size = bounds.getSize(new THREE.Vector2())
  const centre = bounds.getCenter(new THREE.Vector2())
  const scale = box / Math.max(size.x, size.y)
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.07,
    bevelSegments: 5,
    curveSegments: 48,
  })
  geometry.translate(-centre.x, -centre.y, 0)
  geometry.scale(scale, scale, scale)
  return geometry
}

/* ─── The inscription ─── */

const CAP = 0.72 // Cinzel's capitals, as a share of the type size.
const glyphWidth = (ch, size) => ((font.data.glyphs[ch] ?? font.data.glyphs[' ']).ha * size) / font.data.resolution

function arcText(group, text, { radius, centre, top, size, material, z, tracking = 0.012 }) {
  const widths = [...text].map((ch) => glyphWidth(ch, size) + tracking)
  const span = widths.reduce((a, b) => a + b, 0) / radius
  let angle = top ? centre + span / 2 : centre - span / 2
  ;[...text].forEach((ch, i) => {
    const half = widths[i] / 2 / radius
    const a = top ? angle - half : angle + half
    angle = top ? angle - half * 2 : angle + half * 2
    if (ch === ' ') return
    const geometry = new THREE.ExtrudeGeometry(font.generateShapes(ch, size), { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.0028, bevelSegments: 2, curveSegments: 10 })
    geometry.translate(-glyphWidth(ch, size) / 2, 0, 0)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(radius * Math.cos(a), radius * Math.sin(a), z)
    mesh.rotation.z = top ? a - Math.PI / 2 : a + Math.PI / 2
    group.add(mesh)
  })
  return span
}

/* ─── The coin ─── */

function buildCoin({ emblem, word, finish, towardCentre }) {
  const coin = new THREE.Group()
  const look = finishes[finish]()
  const half = 0.095 // half the coin's thickness
  const fieldZ = 0.06

  // The rim, turned from a profile. Its axis ends up pointing at the viewer.
  const profile = []
  const arc = (cx, cy, r, a0, a1, steps = 8) => {
    for (let i = 0; i <= steps; i++) {
      const a = a0 + ((a1 - a0) * i) / steps
      profile.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r))
    }
  }
  profile.push(new THREE.Vector2(FIELD_RADIUS, -fieldZ))
  arc(0.86, -half + 0.012, 0.012, Math.PI, Math.PI * 1.5, 4)
  arc(0.97, -half + 0.03, 0.03, -Math.PI / 2, 0)
  arc(0.97, half - 0.03, 0.03, 0, Math.PI / 2)
  arc(0.86, half - 0.012, 0.012, Math.PI / 2, Math.PI, 4)
  profile.push(new THREE.Vector2(FIELD_RADIUS, fieldZ))
  const rimGeometry = new THREE.LatheGeometry(profile, 360)
  rimGeometry.rotateX(Math.PI / 2)
  const rimMaterial = withEdgeLight(look.rim, towardCentre, 1)
  coin.add(new THREE.Mesh(rimGeometry, rimMaterial))

  // Ridges around the edge.
  const edgeGeometry = new THREE.CylinderGeometry(1.0006, 1.0006, (half - 0.03) * 2, 720, 1, true)
  edgeGeometry.rotateX(Math.PI / 2)
  const edgeMaterial = metal(GOLD, 0.26, { bumpMap: edgeBump, bumpScale: 1.4 })
  withEdgeLight(edgeMaterial, towardCentre, 1.15)
  coin.add(new THREE.Mesh(edgeGeometry, edgeMaterial))

  // The field.
  const field = new THREE.Mesh(new THREE.CircleGeometry(FIELD_RADIUS + 0.002, 240), look.field)
  field.position.z = fieldZ
  coin.add(field)

  // A raised line around the emblem, and a border of beads.
  const line = new THREE.Mesh(new THREE.TorusGeometry(INNER_RING, 0.0065, 12, 280), look.relief)
  line.position.z = fieldZ + 0.002
  coin.add(line)
  const beadCount = 112
  const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0085, 12, 12), look.relief, beadCount)
  const place = new THREE.Matrix4()
  for (let i = 0; i < beadCount; i++) {
    const a = (i / beadCount) * Math.PI * 2
    place.setPosition(0.8 * Math.cos(a), 0.8 * Math.sin(a), fieldZ + 0.003)
    beads.setMatrixAt(i, place)
  }
  coin.add(beads)

  // The emblem.
  const relief = new THREE.Mesh(emblemGeometry(emblem, emblem === 'thirty' ? 0.72 : 0.76), look.relief)
  relief.position.z = fieldZ + 0.002
  coin.add(relief)

  // The inscription: what the coin stands for across the top, the years across the bottom.
  const size = 0.122
  const capHeight = size * CAP
  const baseline = 0.635
  const spanTop = arcText(coin, word, { radius: baseline, centre: Math.PI / 2, top: true, size, material: look.relief, z: fieldZ + 0.001 })
  const spanBottom = arcText(coin, '1996 – 2026', { radius: baseline + capHeight, centre: -Math.PI / 2, top: false, size, material: look.relief, z: fieldZ + 0.001 })
  const dotAngle = Math.PI / 2 + spanTop / 2 + (Math.PI * 2 - spanTop - spanBottom) / 4
  ;[dotAngle, Math.PI - dotAngle].forEach((a) => {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.015, 16, 16), look.relief)
    dot.position.set((baseline + capHeight / 2) * Math.cos(a), (baseline + capHeight / 2) * Math.sin(a), fieldZ + 0.006)
    coin.add(dot)
  })
  return coin
}

window.renderCoin = (spec) => {
  const scene = new THREE.Scene()
  scene.environment = environment
  scene.environmentIntensity = (spec.finish === 'obsidian' ? 0.8 : 0.95) * (spec.light ?? 1)

  // From the middle of the hero to this coin, on screen. World y points up, screen y down.
  const outward = new THREE.Vector2(spec.direction[0], -spec.direction[1]).normalize()

  // The coin faces a little away from the crest, which shows the edge nearest it, like the reference.
  const tilt = spec.tilt
  const normal = new THREE.Vector3(outward.x * Math.sin(tilt), outward.y * Math.sin(tilt), Math.cos(tilt))
  const turn = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
  const roll = spec.roll ?? 0
  const spin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll)

  const local = outward.clone().multiplyScalar(-1).rotateAround(new THREE.Vector2(0, 0), -roll)
  const coin = buildCoin({ emblem: spec.emblem, word: spec.word, finish: spec.finish, towardCentre: local })
  coin.quaternion.copy(turn).multiply(spin)
  scene.add(coin)

  // A hard light from the crest's side rakes across the relief, which is what makes it read as struck.
  const rake = new THREE.DirectionalLight(0xffd9a0, 8)
  rake.position.set(-outward.x * 6, -outward.y * 6, 1.7)
  scene.add(rake)
  const fill = new THREE.DirectionalLight(0xfff2de, spec.finish === 'obsidian' ? 0.7 : 0.45)
  fill.position.set(1, 2, 6)
  scene.add(fill)

  const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 100)
  camera.position.z = (1 / window.__coinFill) / Math.tan(THREE.MathUtils.degToRad(10))

  renderer.render(scene, camera)
  const png = renderer.domElement.toDataURL('image/png')
  scene.traverse((o) => {
    o.geometry?.dispose?.()
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose())
  })
  return png
}


window.__coinsReady = true
