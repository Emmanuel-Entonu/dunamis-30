/*
 * The invitation in 3D, made with three.js like the site's coins and glass. A black envelope in the card
 * slip's own finish (graphite, fine white sunburst, sheen, lit edges, under a glossy clear coat), closed with
 * a black button that carries the official Dunamis logo. On opening, the envelope comes forward, the button
 * unclips, the flap swings open, and the white and gold letter slides out and unfolds.
 *
 * Every surface is painted by inviteFrames.ts, the same drawings as the picture people share, so the 3D
 * envelope and the picture match. createInviteStage() builds the scene on a canvas it owns. draw(s, idle)
 * poses it: `idle` keeps the sealed envelope floating while the page asks for a name, and `s` runs the
 * opening, from 0 to OPEN.duration.
 */

import * as THREE from 'three'

import { recordReveal } from './cardFrames'
import { FLAT, paintButtonFace, paintEngraving, paintEnvelopeParts, paintLetterParts, type InviteArt } from './inviteFrames'
import { encodeMp4 } from './inviteVideo'

export type InviteArt3D = Pick<InviteArt, 'emblem' | 'ministers'> & { rays: HTMLImageElement }

/** Seconds. */
export const OPEN = { duration: 7.6, hold: 2.6 }
const T = {
  enlarge: [0, 1.15],
  sweep: [0.9, 1.75],
  press: [1.7, 1.82],
  pop: [1.82, 2.06],
  flap: [2.0, 3.15],
  spill: [2.15, 4.9],
  out: [2.9, 3.85],
  settle: [3.85, 4.85],
  top: [4.65, 5.5],
  bottom: [5.3, 6.15],
  ministers: [6.05, 6.8],
  shine: [6.4, 7.4],
} as const

// ---------- helpers ----------
const clamp = (v: number) => Math.max(0, Math.min(1, v))
const seg = (s: number, [a, b]: readonly [number, number]) => clamp((s - a) / (b - a))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const easeOut = (v: number) => 1 - (1 - v) ** 3
const easeInOut = (v: number) => (v < 0.5 ? 4 * v ** 3 : 1 - (-2 * v + 2) ** 3 / 2)
const easeOutBack = (v: number) => 1 + 2.6 * (v - 1) ** 3 + 1.6 * (v - 1) ** 2

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = Math.ceil(w)
  c.height = Math.ceil(h)
  return c
}

// ---------- measurements: the flat drawings' pixels, turned into scene units ----------
const E = FLAT.envelope
const PX = 2 / E.w
const EW = E.w * PX
const EH = E.h * PX
const toX = (x: number) => (x - E.w / 2) * PX
const toY = (y: number) => (E.h / 2 - y) * PX
const FLAP_D = E.flapDepth * PX
const BUTTON_R = E.button.r * PX

// The letter's size and its place in the finished picture, so the last frame matches it.
const PICTURE = 2 / (E.w * FLAT.final.envelopeScale)
const LW = FLAT.letter.w * FLAT.final.letterScale * PICTURE
const PH = (LW * FLAT.letter.panel) / FLAT.letter.w
const FINAL_LETTER_Y = (960 - FLAT.final.letterTop) * PICTURE - PH * 1.5
const FINAL_ENVELOPE_Y = (960 - (FLAT.final.envelopeTop + (E.h * FLAT.final.envelopeScale) / 2)) * PICTURE
const FINAL_VIEW = { w: 1080 * PICTURE, h: 1920 * PICTURE }
const LETTER_Z = 0.09

// From the back of the envelope to the front: the address side, the lining, the letter, the flaps.
const Z = { back: -0.0175, liner: -0.0155, letter: -0.0118, sides: 0, bottom: 0.0034, engraving: 0.0076, hinge: -0.002, flap: 0.0118 }
const FOV = 24

// ---------- shapes ----------
/** A polygon with each corner rounded by its own radius. */
function rounded(points: [number, number][], radii: number[]) {
  const shape = new THREE.Shape()
  const n = points.length
  points.forEach((p, i) => {
    const prev = points[(i - 1 + n) % n]
    const next = points[(i + 1) % n]
    const l1 = Math.hypot(prev[0] - p[0], prev[1] - p[1])
    const l2 = Math.hypot(next[0] - p[0], next[1] - p[1])
    const r = Math.min(radii[i], l1 / 2, l2 / 2)
    const a = [p[0] + ((prev[0] - p[0]) / l1) * r, p[1] + ((prev[1] - p[1]) / l1) * r]
    const b = [p[0] + ((next[0] - p[0]) / l2) * r, p[1] + ((next[1] - p[1]) / l2) * r]
    if (i === 0) shape.moveTo(a[0], a[1])
    else shape.lineTo(a[0], a[1])
    shape.quadraticCurveTo(p[0], p[1], b[0], b[1])
  })
  shape.closePath()
  return shape
}
const pt = (x: number, y: number): [number, number] => [toX(x), toY(y)]
const CORNER = 18 * PX
const bodyShape = () => rounded([pt(0, 0), pt(E.w, 0), pt(E.w, E.h), pt(0, E.h)], [CORNER, CORNER, CORNER, CORNER])
const leftShape = () => rounded([pt(0, 0), pt(E.sideApex.x, E.sideApex.y), pt(0, E.h)], [CORNER, 34 * PX, CORNER])
const rightShape = () => rounded([pt(E.w, 0), pt(E.w - E.sideApex.x, E.sideApex.y), pt(E.w, E.h)], [CORNER, 34 * PX, CORNER])
const bottomShape = () => rounded([pt(0, E.h), pt(E.w / 2, E.bottomApexY), pt(E.w, E.h)], [CORNER, 80 * PX, CORNER])

/** The flap: straight sides running into the round tab that holds the button, as in the flat drawing. */
function flapShape() {
  const { x: bx, y: by } = E.button
  const d = Math.hypot(bx, by)
  const reach = Math.sqrt(d * d - E.tab * E.tab)
  const along = Math.atan2(by, bx) + Math.asin(E.tab / d)
  const tx = Math.cos(along) * reach
  const ty = Math.sin(along) * reach
  const start = Math.atan2(ty - by, tx - bx)
  const s = new THREE.Shape()
  s.moveTo(...pt(0, 0))
  s.lineTo(...pt(E.w, 0))
  s.lineTo(...pt(E.w - tx, ty))
  s.absarc(toX(bx), toY(by), E.tab * PX, -(Math.PI - start), -start, true)
  s.closePath()
  return s
}

/** UVs that lay a flat drawing over the envelope: u across it, v up it, from the top down to `depth` pixels. */
function laidOver<G extends THREE.BufferGeometry>(g: G, depth: number = E.h): G {
  const p = g.getAttribute('position')
  const uv = new Float32Array(p.count * 2)
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) / EW + 0.5
    uv[i * 2 + 1] = 1 - (E.h / 2 - p.getY(i) / PX) / depth
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return g
}
/** A flap of the envelope: thin, with softly rounded edges that catch the light. */
const flapSolid = (shape: THREE.Shape, depth: number = E.h) =>
  laidOver(new THREE.ExtrudeGeometry(shape, { depth: 0.0016, bevelEnabled: true, bevelThickness: 0.0011, bevelSize: 0.0042, bevelSegments: 3, curveSegments: 32 }), depth)

// ---------- textures ----------
function radialSprite(stops: [number, string][], size = 256) {
  const c = makeCanvas(size, size)
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  for (const [o, colour] of stops) g.addColorStop(o, colour)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return c
}

/** A soft rectangle of shadow, half dark at the middle of its edges, which are at half the picture's size. */
function softShadow(blur: number) {
  const c = makeCanvas(256, 256)
  const ctx = c.getContext('2d')!
  ctx.shadowColor = 'rgba(0,0,0,1)'
  ctx.shadowBlur = blur
  ctx.shadowOffsetX = 1000
  ctx.fillStyle = '#000'
  ctx.fillRect(64 - 1000, 64, 128, 128)
  return c
}

/** A band of light for running down the letter. */
function shineBand() {
  const c = makeCanvas(64, 512)
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 512)
  g.addColorStop(0, 'rgba(255,240,200,0)')
  g.addColorStop(0.5, 'rgba(255,240,200,0.5)')
  g.addColorStop(1, 'rgba(255,240,200,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 512)
  return c
}

/** The logo's outline, softly raised, so the light catches it on the button as it turns. */
function logoRelief(emblem: HTMLImageElement, size = 512) {
  const c = makeCanvas(size, size)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, size, size)
  const lw = size * 0.72
  const lh = lw * (emblem.naturalHeight / emblem.naturalWidth)
  const shape = makeCanvas(size, size)
  const s = shape.getContext('2d')!
  s.drawImage(emblem, size / 2 - lw / 2, size / 2 - lh / 2 + size * 0.01, lw, lh)
  s.globalCompositeOperation = 'source-in'
  s.fillStyle = '#fff'
  s.fillRect(0, 0, size, size)
  ctx.filter = 'blur(2px)'
  ctx.drawImage(shape, 0, 0)
  return c
}

// ---------- light ----------
/** A dark studio with soft white panels: what black lacquer shows as it turns. */
function studio(renderer: THREE.WebGLRenderer) {
  const room = new THREE.Scene()
  room.background = new THREE.Color(0x020202)
  const panel = (w: number, h: number, position: [number, number, number], power: number, colour = 0xffffff) => {
    const material = new THREE.MeshBasicMaterial({ color: colour, side: THREE.DoubleSide, toneMapped: false })
    material.color.multiplyScalar(power)
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material)
    mesh.position.set(...position)
    mesh.lookAt(0, 0, 0)
    room.add(mesh)
  }
  panel(10, 3.2, [0, 7, 5], 3.2)
  panel(2, 11, [-8, 1, 4], 4)
  panel(1.4, 10, [8, -1, 4], 2.2, 0xfff3e0)
  panel(6, 6, [1, 2, 11], 0.35)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromScene(room, 0.02).texture
  pmrem.dispose()
  room.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose()
      ;(o.material as THREE.Material).dispose()
    }
  })
  return env
}

// ---------- framing ----------
type Box = { cx: number; cy: number; w: number; h: number }
type View = { x: number; y: number; d: number }
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV) / 2)

/** Where the camera stands so the box fills `fill` of the screen, its centre at `at` (-1 to 1 across). */
function viewFor(box: Box, fill: number, aspect: number, at = { x: 0, y: 0 }): View {
  const d = Math.max(box.h / (2 * TAN * fill), box.w / (2 * TAN * aspect * fill))
  return { x: box.cx - at.x * d * TAN * aspect, y: box.cy - at.y * d * TAN, d }
}
const mix = (a: View, b: View, k: number): View => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), d: 1 / lerp(1 / a.d, 1 / b.d, k) })

const ENVELOPE_BOX: Box = { cx: 0, cy: 0, w: EW, h: EH }
const OPEN_BOX: Box = { cx: 0, cy: FLAP_D / 2, w: EW, h: EH + FLAP_D * 0.9 }
const FINAL_BOX: Box = { cx: 0, cy: 0, w: FINAL_VIEW.w, h: FINAL_VIEW.h }

export type Layout = 'stage' | 'present' | 'story'
type Rect = { x: number; y: number; w: number; h: number }

export type StageOptions = {
  /** Keeps each drawn frame readable, for recording video. */
  preserve?: boolean
  /** The video's dark backdrop behind everything. */
  backdrop?: boolean
  sparkles?: number
  /** How sharply the envelope and the letter are painted: 1 is the flat drawing's size. Fit them to the screen. */
  detail?: number
  letterDetail?: number
  /**
   * For phones that would struggle: the painted finish shown flat (it looks the same), simple light, no
   * anti-aliasing and no rays. The envelope is the same; it just costs a fraction to draw.
   */
  light?: boolean
  /** Called if the phone takes the 3D drawing back to free memory, so the page can switch to the flat one. */
  onLost?: () => void
}

/**
 * Whether this browser draws 3D on the processor instead of a graphics chip (Chrome does on phones whose chip it
 * doesn't trust). Such a phone looks capable on paper but needs the lighter envelope.
 */
export function drawsInSoftware() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl')
    if (!gl) return true
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name)
  } catch {
    return false
  }
}

/** Lets a slow phone draw a frame between the heavy steps of building the scene. */
const breathe = () => new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)))

export type InviteStage = {
  canvas: HTMLCanvasElement
  /** Switches to the lighter envelope while running, for a phone that turns out slower than it looked. */
  lighten(): void
  /** Paints the letter for this name ahead of time, so opening doesn't have to. */
  prepareLetter(name: string, to?: string): Promise<void>
  /** The envelope's engraving while the name is typed: the caret is where it's typed, or null. */
  engrave(name: string, caret: number | null): void
  /** Writes the letter for this name, and engraves it on the envelope. */
  setName(name: string, to?: string): void
  resize(width: number, height: number, pixelRatio: number): void
  setLayout(layout: Layout): void
  /** Where the envelope was on screen, in the canvas's pixels, so the opening can start from there. */
  startFrom(rect: Rect | null): void
  draw(s: number, idle: number): void
  /** The envelope's and its engraving's places on the canvas, in its CSS pixels. */
  envelopeRect(): Rect
  nameRect(): Rect
  dispose(): void
}

export async function createInviteStage(
  art: InviteArt3D,
  font: string,
  { preserve = false, backdrop = false, sparkles = 36, detail = 2, letterDetail = 1.4, light: startLight = false, onLost }: StageOptions = {},
): Promise<InviteStage> {
  let light = startLight
  const canvas = document.createElement('canvas')
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !light, alpha: !backdrop, preserveDrawingBuffer: preserve, powerPreference: light ? 'default' : 'high-performance' })
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault()
    onLost?.()
  })
  // The surfaces are painted already, so their colours are shown exactly as painted.
  renderer.toneMapping = THREE.NoToneMapping
  renderer.setClearColor(0x000000, 0)
  const anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), light ? 4 : 16)
  const scene = new THREE.Scene()
  if (light) scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 2.2))
  else scene.environment = studio(renderer)
  await breathe()
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 60)
  const owned: { dispose(): void }[] = []
  const keep = <T extends { dispose(): void }>(thing: T) => (owned.push(thing), thing)
  const texture = (source: HTMLCanvasElement | HTMLImageElement, colour = true) => {
    const t = keep(new THREE.Texture(source))
    if (colour) t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = anisotropy
    t.needsUpdate = true
    return t
  }
  const painters = paintEnvelopeParts(art.emblem, font, detail)
  const painted = {} as { [K in keyof typeof painters]: HTMLCanvasElement }
  for (const part of ['pocket', 'flapOutside', 'flapInside', 'flapShadow', 'liner', 'back', 'glint'] as const) {
    painted[part] = painters[part]()
    await breathe()
  }
  if (backdrop) scene.background = texture(painters.backdrop())

  /**
   * The slip's finish: the painting shows exactly as drawn, under a glossy clear coat that reflects the room.
   * On a phone that would struggle, the same painting is shown flat, which looks the same at a fraction of the cost.
   */
  const glossy = new Map<THREE.Material, THREE.MeshBasicMaterial>()
  const lacquer = (map: THREE.Texture, extra: THREE.MeshPhysicalMaterialParameters = {}): THREE.Material => {
    const flat = keep(new THREE.MeshBasicMaterial({ map, side: extra.side ?? THREE.FrontSide }))
    if (light) return flat
    const gloss = keep(new THREE.MeshPhysicalMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: map, metalness: 0, roughness: 0.5, specularIntensity: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.45, ...extra }))
    glossy.set(gloss, flat)
    return gloss
  }

  // A key light from the top left for the lit edges, and a light that sweeps across before it opens.
  const key = new THREE.DirectionalLight(0xffffff, 1.6)
  key.position.set(-3, 4, 5)
  scene.add(key)
  const sweep = new THREE.DirectionalLight(0xffffff, 0)
  scene.add(sweep)

  // ---------- the envelope ----------
  const envelope = new THREE.Group()
  scene.add(envelope)

  const liner = new THREE.Mesh(keep(laidOver(new THREE.ShapeGeometry(bodyShape(), 16))), lacquer(texture(painted.liner), { roughness: 0.4 }))
  liner.position.z = Z.liner
  envelope.add(liner)

  // The other side, seen as it turns: the slip with the logo and name. Seen from behind, so it's turned round.
  const backGeometry = laidOver(new THREE.ShapeGeometry(bodyShape(), 16))
  {
    const uv = backGeometry.getAttribute('uv')
    for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i))
  }
  const back = new THREE.Mesh(keep(backGeometry), lacquer(texture(painted.back), { side: THREE.BackSide }))
  back.position.z = Z.back
  envelope.add(back)

  const pocketMaterial = lacquer(texture(painted.pocket))
  const pocket = new THREE.Group()
  envelope.add(pocket)
  const left = new THREE.Mesh(keep(flapSolid(leftShape())), pocketMaterial)
  const right = new THREE.Mesh(keep(flapSolid(rightShape())), pocketMaterial)
  left.position.z = right.position.z = Z.sides
  const bottom = new THREE.Mesh(keep(flapSolid(bottomShape())), pocketMaterial)
  bottom.position.z = Z.bottom
  pocket.add(left, right, bottom)

  // The socket the button clips into: a small gold ring.
  const socket = new THREE.Mesh(keep(new THREE.TorusGeometry(0.044, 0.011, 16, 48)), light ? keep(new THREE.MeshStandardMaterial({ color: 0xe8b04a, metalness: 0.6, roughness: 0.35 })) : keep(new THREE.MeshPhysicalMaterial({ color: 0xe8b04a, metalness: 1, roughness: 0.25, envMapIntensity: 1.2 })))
  socket.position.set(0, toY(E.button.y), Z.engraving)
  const hole = new THREE.Mesh(keep(new THREE.CircleGeometry(0.036, 32)), keep(new THREE.MeshBasicMaterial({ color: 0x050505 })))
  hole.position.set(0, toY(E.button.y), Z.engraving - 0.0004)
  pocket.add(socket, hole)

  // "An invitation from" and the name, in gold on the bottom flap.
  const engravingCanvas = makeCanvas(1280, 300)
  const engravingTexture = texture(engravingCanvas)
  const engravingH = (150 / 640) * 1.3
  const engraving = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(1.3, engravingH)),
    light
      ? keep(new THREE.MeshBasicMaterial({ map: engravingTexture, transparent: true, depthWrite: false }))
      : keep(new THREE.MeshPhysicalMaterial({ color: 0x000000, map: engravingTexture, emissive: 0xffffff, emissiveMap: engravingTexture, transparent: true, clearcoat: 1, roughness: 0.35, depthWrite: false })),
  )
  // The drawing puts the label's baseline at 40 and the name's at 100, of 150.
  engraving.position.set(0, toY(E.labelY) + (40 / 150 - 0.5) * engravingH, Z.engraving)
  pocket.add(engraving)

  // The flap, hinged along the top edge. Closed it lies over the pocket; open it stands up behind the letter.
  const hinge = new THREE.Group()
  hinge.position.set(0, EH / 2, Z.hinge)
  envelope.add(hinge)
  const flapGeometry = flapSolid(flapShape(), E.flapDepth + 40)
  flapGeometry.translate(0, -EH / 2, Z.flap - Z.hinge)
  hinge.add(new THREE.Mesh(keep(flapGeometry), lacquer(texture(painted.flapOutside))))
  const liningGeometry = laidOver(new THREE.ShapeGeometry(flapShape(), 32), E.flapDepth)
  liningGeometry.translate(0, -EH / 2, Z.flap - Z.hinge - 0.0013)
  hinge.add(new THREE.Mesh(keep(liningGeometry), lacquer(texture(painted.flapInside), { side: THREE.BackSide, roughness: 0.4 })))
  // Its shadow on the pocket while it's closed.
  const shadowDepth = E.flapDepth + 60
  const flapShadowGeometry = laidOver(new THREE.PlaneGeometry(EW, shadowDepth * PX).translate(0, EH / 2 - (shadowDepth * PX) / 2, 0), shadowDepth)
  flapShadowGeometry.translate(0, -EH / 2, Z.flap - Z.hinge - 0.0021)
  const flapShadowMaterial = keep(new THREE.MeshBasicMaterial({ map: texture(painted.flapShadow), transparent: true, depthWrite: false }))
  hinge.add(new THREE.Mesh(keep(flapShadowGeometry), flapShadowMaterial))

  // The button: black lacquer like the slip, the official logo on its face, and a rounded, lit edge.
  const button = new THREE.Group()
  {
    const r = BUTTON_R
    const h = r * 0.26
    const profile: THREE.Vector2[] = [new THREE.Vector2(0, h)]
    for (let i = 0; i <= 10; i++) {
      const a = (Math.PI / 2) * (i / 10)
      profile.push(new THREE.Vector2(r * 0.8 + r * 0.2 * Math.sin(a), h - r * 0.16 * (1 - Math.cos(a))))
    }
    profile.push(new THREE.Vector2(r, h * 0.12), new THREE.Vector2(r * 0.95, 0))
    const body = new THREE.LatheGeometry(profile, 96)
    body.rotateX(Math.PI / 2)
    button.add(
      new THREE.Mesh(
        keep(body),
        light
          ? keep(new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.2, roughness: 0.35 }))
          : keep(new THREE.MeshPhysicalMaterial({ color: 0x101010, metalness: 0.35, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.2 })),
      ),
    )
    const face = new THREE.Mesh(
      keep(new THREE.CircleGeometry(r * 0.82, 96)),
      lacquer(texture(paintButtonFace(art.emblem, light ? 512 : 1024)), light ? {} : { bumpMap: texture(logoRelief(art.emblem), false), bumpScale: 2.5, clearcoatRoughness: 0.08 }),
    )
    face.position.z = h + 0.0004
    button.add(face)
  }
  const buttonRest = new THREE.Vector3(0, toY(E.button.y) - EH / 2, Z.flap - Z.hinge + 0.0028)
  button.position.copy(buttonRest)
  hinge.add(button)
  const buttonShadowMaterial = keep(new THREE.MeshBasicMaterial({ map: texture(radialSprite([[0, 'rgba(0,0,0,0.8)'], [0.45, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0)']])), transparent: true, depthWrite: false }))
  const buttonShadow = new THREE.Mesh(keep(new THREE.PlaneGeometry(BUTTON_R * 3, BUTTON_R * 3)), buttonShadowMaterial)
  buttonShadow.position.set(0, buttonRest.y - 0.012, Z.flap - Z.hinge + 0.0029)
  hinge.add(buttonShadow)

  const envelopeShadow = new THREE.Mesh(keep(new THREE.PlaneGeometry(EW * 1.6, EH * 1.75)), keep(new THREE.MeshBasicMaterial({ map: texture(softShadow(30), false), transparent: true, opacity: 0.7, depthWrite: false })))
  envelopeShadow.position.set(0, -0.07, Z.back - 0.05)
  envelope.add(envelopeShadow)

  // Light from inside, as it opens.
  const glowTexture = texture(radialSprite([[0, 'rgba(255,214,140,1)'], [0.3, 'rgba(255,190,90,0.4)'], [1, 'rgba(255,190,90,0)']]))
  const mouthGlowMaterial = keep(new THREE.SpriteMaterial({ map: glowTexture, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }))
  const mouthGlow = new THREE.Sprite(mouthGlowMaterial)
  mouthGlow.scale.set(2.8, 1.6, 1)
  mouthGlow.position.set(0, EH / 2, 0.05)
  envelope.add(mouthGlow)

  // ---------- the letter ----------
  const letter = new THREE.Group()
  scene.add(letter)
  const paper = (side: THREE.Side = THREE.FrontSide) => keep(new THREE.MeshBasicMaterial({ side, toneMapped: false }))
  const slice = (row: number, flipV = false) => {
    const g = keep(new THREE.PlaneGeometry(LW, PH))
    const uv = g.getAttribute('uv')
    for (let i = 0; i < uv.count; i++) {
      const v = flipV ? 1 - uv.getY(i) : uv.getY(i)
      uv.setY(i, row < 0 ? v : (2 - row + v) / 3)
    }
    return g
  }
  const fronts = [paper(), paper(), paper()]
  const coverMaterial = paper(THREE.BackSide)
  const plainMaterials = [paper(THREE.BackSide), paper(THREE.BackSide)]
  const panel = (row: number, reverseMaterial: THREE.Material, flip: boolean) => {
    const g = new THREE.Group()
    g.add(new THREE.Mesh(slice(row), fronts[row]))
    const reverse = new THREE.Mesh(slice(-1, flip), reverseMaterial)
    reverse.position.z = -0.0003
    g.add(reverse)
    return g
  }
  letter.add(panel(1, plainMaterials[0], false))
  const PAPER = 0.0009
  const topHinge = new THREE.Group()
  topHinge.position.set(0, PH / 2, PAPER * 2)
  const topPanel = panel(0, coverMaterial, true)
  topPanel.position.set(0, PH / 2, -PAPER * 2)
  topHinge.add(topPanel)
  letter.add(topHinge)
  const bottomHinge = new THREE.Group()
  bottomHinge.position.set(0, -PH / 2, PAPER)
  const bottomPanel = panel(2, plainMaterials[1], false)
  bottomPanel.position.set(0, -PH / 2, -PAPER)
  bottomHinge.add(bottomPanel)
  letter.add(bottomHinge)

  const ministersMaterial = keep(new THREE.MeshBasicMaterial({ map: texture(art.ministers), transparent: true, toneMapped: false, depthWrite: false, opacity: 0 }))
  const ministers = new THREE.Mesh(keep(new THREE.PlaneGeometry(1, 1)), ministersMaterial)
  letter.add(ministers)
  const shineMaterial = keep(new THREE.MeshBasicMaterial({ map: texture(shineBand()), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, toneMapped: false }))
  const shine = new THREE.Mesh(keep(new THREE.PlaneGeometry(LW, PH * 0.7)), shineMaterial)
  shine.position.z = 0.0022
  letter.add(shine)
  const letterShadowMaterial = keep(new THREE.MeshBasicMaterial({ map: texture(softShadow(40), false), transparent: true, depthWrite: false }))
  const letterShadow = new THREE.Mesh(keep(new THREE.PlaneGeometry(1, 1)), letterShadowMaterial)
  letterShadow.position.z = -0.03
  letter.add(letterShadow)
  let ministersBox = { x: 0, y: 0, w: 0, h: 0 }
  let letterReady = false

  // ---------- light effects ----------
  const glowMaterial = keep(new THREE.SpriteMaterial({ map: glowTexture, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }))
  const glow = new THREE.Sprite(glowMaterial)
  glow.position.z = -0.9
  scene.add(glow)
  const raysMaterial = keep(new THREE.SpriteMaterial({ map: texture(art.rays), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }))
  const rays = new THREE.Sprite(raysMaterial)
  rays.position.z = -1.2
  scene.add(rays)
  const glintTexture = texture(painted.glint)
  const sparkle = () => {
    const material = keep(new THREE.SpriteMaterial({ map: glintTexture, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }))
    const sprite = new THREE.Sprite(material)
    scene.add(sprite)
    return { sprite, material }
  }
  let seed = 29
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const twinkles = Array.from({ length: light ? Math.min(sparkles, 14) : sparkles }, () => {
    const a = random() * Math.PI * 2
    const r = 0.35 + Math.sqrt(random()) * 0.65
    return { ...sparkle(), x: Math.cos(a) * r * 2.6, y: Math.sin(a) * r * 2.4, z: -0.6 + random() * 0.9, size: 0.06 + random() * 0.12, phase: random() * Math.PI * 2, speed: 1.4 + random() * 2.4 }
  })
  const sparks = Array.from({ length: 16 }, (_, i) => ({ ...sparkle(), angle: (i / 16) * Math.PI * 2 + random() * 0.3, speed: 1.1 + random() * 1.5, size: 0.07 + random() * 0.07 }))
  const flashMaterial = keep(new THREE.SpriteMaterial({ map: glowTexture, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }))
  const flash = new THREE.Sprite(flashMaterial)
  scene.add(flash)

  // ---------- state ----------
  let layout: Layout = 'stage'
  let aspect = 1
  let width = 1
  let height = 1
  let from: View | null = null
  let fromPose = { rx: 0, ry: 0, y: 0 }
  let lastIdle = { rx: 0, ry: 0, y: 0 }
  let written = ''

  const engrave = (name: string, caret: number | null) => {
    paintEngraving(engravingCanvas, font, name, caret, 'Write your name')
    engravingTexture.needsUpdate = true
  }
  engrave('', null)

  const writeLetter = (clean: string, to: string) => {
    if (letterReady && `${clean}|${to}` === written) return
    written = `${clean}|${to}`
    const parts = paintLetterParts(art, font, clean, letterDetail, to)
    const front = texture(parts.letter)
    fronts.forEach((m) => (m.map = front))
    coverMaterial.map = texture(parts.cover)
    const plain = texture(parts.plain)
    plainMaterials.forEach((m) => (m.map = plain))
    ;[...fronts, coverMaterial, ...plainMaterials].forEach((m) => (m.needsUpdate = true))
    ministersBox = parts.ministers
    ministers.scale.set(ministersBox.w * LW, ministersBox.h * PH * 3, 1)
    ministers.position.x = (ministersBox.x + ministersBox.w / 2 - 0.5) * LW
    letterReady = true
  }
  const clean = (name: string) => name.trim().replace(/\s+/g, ' ')
  const setName = (name: string, to = '') => {
    engrave(clean(name), null)
    writeLetter(clean(name), clean(to))
  }
  const prepareLetter = async (name: string, to = '') => {
    if (!clean(name)) return
    await breathe()
    writeLetter(clean(name), clean(to))
  }

  const project = (points: THREE.Vector3[]): Rect => {
    let x0 = Infinity
    let y0 = Infinity
    let x1 = -Infinity
    let y1 = -Infinity
    for (const p of points) {
      const v = p.clone().project(camera)
      const x = ((v.x + 1) / 2) * width
      const y = ((1 - v.y) / 2) * height
      x0 = Math.min(x0, x)
      x1 = Math.max(x1, x)
      y0 = Math.min(y0, y)
      y1 = Math.max(y1, y)
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
  }
  const corners = (object: THREE.Object3D, w: number, h: number) =>
    [
      [-w / 2, -h / 2],
      [w / 2, -h / 2],
      [w / 2, h / 2],
      [-w / 2, h / 2],
    ].map(([x, y]) => object.localToWorld(new THREE.Vector3(x, y, 0)))

  const draw = (s: number, idle: number) => {
    const opening = layout !== 'stage'
    // Sealed, the envelope floats, so the lacquer catches the light as it turns.
    const float = { rx: -0.08 + 0.05 * Math.sin(idle * 0.8 + 1), ry: 0.17 * Math.sin(idle * 0.55), y: 0.03 * Math.sin(idle * 0.9) }
    if (!opening) lastIdle = float

    // ----- the camera -----
    let view: View
    if (!opening) view = viewFor({ ...ENVELOPE_BOX, w: EW * 1.04, h: EH * 1.22 }, 0.94, aspect)
    else {
      const portrait = aspect < 1
      const start = from ?? viewFor(ENVELOPE_BOX, portrait ? 0.8 : 0.52, aspect)
      const big = viewFor(ENVELOPE_BOX, portrait ? 0.92 : 0.62, aspect)
      const open = viewFor(OPEN_BOX, portrait ? 0.94 : 0.8, aspect)
      const end = viewFor(FINAL_BOX, portrait ? 0.98 : 0.94, aspect)
      view = mix(start, big, easeInOut(seg(s, T.enlarge)))
      view = mix(view, open, easeInOut(seg(s, [1.95, 2.95])))
      view = mix(view, end, easeInOut(seg(s, [3.75, 5.0])))
      if (s < 0) view = { ...view, d: view.d * (1 + 0.05 * Math.min(1, -s)) }
    }
    camera.position.set(view.x, view.y, view.d)
    camera.lookAt(view.x, view.y, 0)

    // ----- the envelope -----
    const settle = easeInOut(seg(s, T.settle))
    if (!opening) {
      envelope.position.set(0, float.y, 0)
      envelope.rotation.set(float.rx, float.ry, 0)
    } else {
      // It comes forward and turns once, showing its other side, then faces you.
      const spin = easeInOut(seg(s, T.enlarge))
      const breathe = 0.015 * Math.sin(s * 1.3) * (1 - settle)
      envelope.position.set(0, lerp(fromPose.y * (1 - spin), FINAL_ENVELOPE_Y, settle), 0.32 * Math.sin(Math.PI * spin))
      envelope.rotation.set(lerp(fromPose.rx, 0, spin) + 0.18 * Math.sin(Math.PI * spin), lerp(fromPose.ry, 0, spin) + Math.PI * 2 * spin + breathe, -0.06 * Math.sin(Math.PI * spin))
    }

    // The button is pressed, springs off its socket with a flash, settles back unclipped, and rides up with the flap.
    const press = seg(s, T.press)
    const pop = seg(s, T.pop)
    const settleBack = easeInOut(seg(s, [T.pop[1], T.pop[1] + 0.45]))
    const sprung = (pop > 0 ? easeOutBack(pop) : 0) * (1 - settleBack)
    button.position.set(buttonRest.x, buttonRest.y + 0.012 * sprung, buttonRest.z - 0.005 * Math.sin((press * Math.PI) / 2) * (1 - pop) + 0.075 * sprung)
    button.rotation.set(-0.5 * easeOut(pop) * (1 - settleBack), 0.14 * Math.sin(pop * Math.PI), 0)
    button.scale.setScalar(1 + 0.05 * sprung)
    const flapAngle = 3.32 * easeInOut(seg(s, T.flap))
    hinge.rotation.x = -flapAngle
    buttonShadowMaterial.opacity = (0.9 - 0.45 * sprung) * clamp(1 - flapAngle / 1.2)
    buttonShadow.scale.setScalar(1 + 0.5 * sprung)
    flapShadowMaterial.opacity = clamp(1 - flapAngle / 0.7)

    // A light sweeps across the lacquer while it waits, and once more before it opens.
    const sweepAt = opening ? seg(s, T.sweep) : (idle % 5.5) / 1.8
    sweep.intensity = sweepAt > 0 && sweepAt < 1 ? 3.5 * Math.sin(Math.PI * sweepAt) : 0
    sweep.position.set(lerp(-6, 6, sweepAt), 2.5, 3)

    // Light spills out as it opens.
    const spill = opening ? Math.sin(Math.PI * seg(s, T.spill)) : 0
    mouthGlowMaterial.opacity = 0.75 * spill

    // ----- the letter -----
    const visible = opening && s >= T.flap[0] && letterReady
    letter.visible = visible
    if (visible) {
      // Inside, it moves with the envelope; then it leaves for its place in the picture.
      const out = easeInOut(seg(s, T.out))
      envelope.updateMatrixWorld(true)
      const inside = new THREE.Vector3(0, out * (EH / 2 + PH / 2 + 0.07), Z.letter).applyMatrix4(envelope.matrixWorld)
      letter.position.set(lerp(inside.x, 0, settle), lerp(inside.y, FINAL_LETTER_Y, settle), lerp(inside.z, LETTER_Z, settle))
      letter.quaternion.copy(envelope.getWorldQuaternion(new THREE.Quaternion())).slerp(new THREE.Quaternion(), settle)
      letter.rotateX(-0.16 * Math.sin(Math.PI * settle))
      letter.rotateY(0.32 * Math.sin(Math.PI * settle))
      const top = Math.PI * (1 - easeInOut(seg(s, T.top)))
      const low = Math.PI * (1 - easeInOut(seg(s, T.bottom)))
      topHinge.rotation.x = top
      bottomHinge.rotation.x = -low
      // Panels turning away from the light darken.
      const shade = (angle: number) => 0.62 + 0.38 * Math.abs(Math.cos(angle))
      fronts[0].color.setScalar(shade(top))
      fronts[2].color.setScalar(shade(low))
      coverMaterial.color.setScalar(shade(top))
      plainMaterials[1].color.setScalar(shade(low))
      const above = PH / 2 + Math.max(0, Math.cos(top)) * PH
      const below = PH / 2 + Math.max(0, Math.cos(low)) * PH
      letterShadow.scale.set(LW * 2, (above + below) * 2, 1)
      letterShadow.position.set(0.02, (above - below) / 2 - 0.07, -0.03)
      letterShadowMaterial.opacity = 0.25 + 0.45 * settle
      const m = easeOut(seg(s, T.ministers))
      ministersMaterial.opacity = m
      ministers.visible = m > 0
      ministers.position.set(ministers.position.x, (0.5 - (ministersBox.y + ministersBox.h / 2)) * PH * 3 - (1 - m) * 0.05, 0.0016)
      const sh = seg(s, T.shine)
      shineMaterial.opacity = sh > 0 && sh < 1 ? Math.sin(Math.PI * sh) : 0
      shine.position.y = lerp(PH * 1.9, -PH * 1.9, easeInOut(sh))
    }

    // ----- glow, rays and sparkles: only once the opening has begun -----
    const focus = new THREE.Vector3(0, visible ? lerp(envelope.position.y + EH / 2, letter.position.y, settle) : envelope.position.y, -0.9)
    glow.position.copy(focus)
    glow.scale.setScalar(5 + 2 * spill)
    glowMaterial.opacity = opening ? 0.3 + 0.3 * seg(s, [2, 3.5]) : 0
    rays.position.set(focus.x, focus.y, -1.2)
    rays.scale.set(7.5, 7.5, 1)
    raysMaterial.opacity = opening && !light ? 0.7 * easeOut(seg(s, [2.5, 3.7])) * (1 - 0.35 * seg(s, [5.5, 7.5])) : 0
    rays.visible = raysMaterial.opacity > 0.001
    raysMaterial.rotation = s * 0.05
    const twinkle = opening ? 0.25 + 0.75 * seg(s, [2.0, 3.0]) - 0.3 * seg(s, [6.5, 8]) : 0
    for (const p of twinkles) {
      const k = Math.max(0, Math.sin(s * p.speed + p.phase)) ** 3
      p.sprite.position.set(focus.x + p.x, focus.y + p.y + s * 0.02, p.z)
      p.sprite.scale.setScalar(p.size * (0.6 + 0.6 * k))
      p.material.opacity = k * twinkle
    }
    const buttonWorld = button.getWorldPosition(new THREE.Vector3())
    const burst = s - T.pop[0]
    for (const p of sparks) {
      if (!opening || burst <= 0 || burst >= 1) {
        p.material.opacity = 0
        continue
      }
      const d = p.speed * burst * (1 - burst * 0.45)
      p.sprite.position.set(buttonWorld.x + Math.cos(p.angle) * d, buttonWorld.y + Math.sin(p.angle) * d - 1.2 * burst * burst, buttonWorld.z + 0.05)
      p.sprite.scale.setScalar(p.size * (1 - burst * 0.6))
      p.material.opacity = (1 - burst) ** 1.4
    }
    flash.position.set(buttonWorld.x, buttonWorld.y, buttonWorld.z + 0.06)
    flash.scale.setScalar(0.5 + 1.6 * pop)
    flashMaterial.opacity = opening && pop > 0 && pop < 1 ? (1 - pop) ** 2 : 0

    renderer.render(scene, camera)
  }

  letter.visible = true
  await renderer.compileAsync(scene, camera).catch(() => undefined)
  letter.visible = false

  /** The same envelope, drawn flat: the painting is unchanged, only the costly gloss and the rays go. */
  const lighten = () => {
    if (light) return
    light = true
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh && glossy.has(o.material as THREE.Material)) o.material = glossy.get(o.material as THREE.Material)!
    })
    twinkles.forEach((p, i) => (p.sprite.visible = i < 14))
  }

  return {
    canvas,
    lighten,
    prepareLetter,
    engrave,
    setName,
    resize(w, h, pixelRatio) {
      width = Math.max(1, w)
      height = Math.max(1, h)
      aspect = width / height
      renderer.setPixelRatio(pixelRatio)
      renderer.setSize(width, height, false)
      camera.aspect = aspect
      camera.updateProjectionMatrix()
    },
    setLayout(next) {
      layout = next
      if (next === 'stage') from = null
    },
    startFrom(rect) {
      fromPose = { ...lastIdle }
      if (!rect) {
        from = null
        return
      }
      const at = { x: ((rect.x + rect.w / 2) / width) * 2 - 1, y: 1 - ((rect.y + rect.h / 2) / height) * 2 }
      from = viewFor({ ...ENVELOPE_BOX, w: 0.0001 }, rect.h / height, aspect, at)
    },
    draw,
    envelopeRect() {
      envelope.updateMatrixWorld(true)
      return project(corners(liner, EW, EH))
    },
    nameRect() {
      engraving.updateMatrixWorld(true)
      return project(corners(engraving, 1.3, engravingH))
    },
    dispose() {
      owned.forEach((d) => d.dispose())
      scene.environment?.dispose()
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          ;(Array.isArray(o.material) ? o.material : [o.material]).forEach((m: THREE.Material) => m.dispose())
        }
      })
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}

/**
 * The opening as a video, 1080×1920, from a stage made for it (with preserve and backdrop): a moment on the
 * sealed envelope with the name, the whole opening, then the finished invitation held while it sparkles.
 * Each frame is copied onto a flat canvas first, which is the surest way to read what was just drawn.
 */
export async function recordInvite(stage: InviteStage, onProgress: (share: number) => void) {
  stage.resize(1080, 1920, 1)
  stage.setLayout('story')
  stage.startFrom(null)
  const copy = makeCanvas(1080, 1920)
  const ctx = copy.getContext('2d')!
  const paint = (s: number) => {
    stage.draw(s, 0)
    ctx.drawImage(stage.canvas, 0, 0, 1080, 1920)
  }
  const from = -0.6
  const encoded = await encodeMp4(copy, OPEN.duration + OPEN.hold - from, (t) => paint(from + t), onProgress)
  if (encoded) return encoded
  return recordReveal(copy, (k) => paint(from + k * (OPEN.duration - from)), { duration: (OPEN.duration - from) * 1000, hold: OPEN.hold * 1000 })
}
