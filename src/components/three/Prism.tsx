/* eslint-disable react-hooks/immutability -- three.js scenes are changed in place on every frame. Only used to render the glass images. */
'use client'

import { Text3D } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import { GlassMaterial, GlassStudioEnv } from './GlassKit'

/*
 * Glass object shapes, with two finishes. "pale" (the site's look) is the clear refractive
 * GlassMaterial from GlassKit. "prism" is below: dark, smoked interiors with thin bright rims. Every surface is drawn see-through
 * (no depth writes), so the back walls of an object add a second set of rim lines, which is what
 * makes it read as poured glass. The colour is a thin-film spectrum over warm copper rims, plus
 * softbox reflections. Used only to pre-render still images (scripts/capture-glass.mjs).
 */

const vertex = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vP;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - world.xyz);
    vP = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragment = /* glsl */ `
  precision highp float;
  uniform float uGain;
  uniform float uFill;
  uniform float uSeed;
  uniform float uBody;
  uniform float uRimPower;
  uniform float uBox;
  uniform float uSweep;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vP;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float a = 0.5, v = 0.0;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
    return v;
  }
  vec3 spectrum(float t) { return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67))); }

  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(vV);
    float facing = gl_FrontFacing ? 1.0 : 0.55;
    if (!gl_FrontFacing) N = -N;
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    vec3 R = reflect(-V, N);
    // Flat faces have no curvature, so they stay dark and only curved glass catches the studio.
    float curved = smoothstep(0.00012, 0.0007, length(fwidth(N)));

    float rim = pow(1.0 - ndv, uRimPower);
    float edge = pow(1.0 - ndv, uRimPower * 2.6);
    float swirl = fbm(vP.xy * 0.38 + uSeed);
    float phase = ndv * 1.1 + R.y * 0.55 + R.x * 0.35 + swirl * 0.9 + uSeed;
    vec3 film = pow(spectrum(phase), vec3(1.35)) * vec3(1.0, 0.8, 1.0);
    vec3 copper = mix(vec3(1.0, 0.5, 0.26), vec3(1.0, 0.8, 0.62), ndv);

    // Rims: copper and cream, with the spectrum breaking through in patches.
    float patches = smoothstep(0.38, 0.62, fbm(vP.xy * 0.55 + uSeed * 5.0 + 9.0));
    vec3 col = mix(copper, film * 1.7, patches * 0.85) * rim * 1.9 + vec3(1.0, 0.93, 0.85) * edge * 0.95;

    // Rectangular softboxes reflected in the curved glass.
    float box1 = smoothstep(0.0, 0.1, 0.3 - abs(R.x + 0.44)) * smoothstep(0.0, 0.1, 0.34 - abs(R.y - 0.56));
    float box2 = smoothstep(0.0, 0.05, 0.08 - abs(R.x - 0.62)) * smoothstep(0.0, 0.12, 0.6 - abs(R.y - 0.05));
    float box3 = smoothstep(0.0, 0.08, 0.5 - abs(R.x)) * smoothstep(0.0, 0.04, 0.06 - abs(R.y + 0.72));
    col += (vec3(1.0, 0.98, 0.95) * box1 * 1.25 + vec3(1.0, 0.9, 0.78) * box2 * 1.0 + film * box3 * 1.2) * curved * uBox;

    // Big smooth forms: a bright crescent sweeping along the upper edge, instead of softboxes.
    float crescent = pow(max(dot(normalize(N.xy + 1e-4), normalize(vec2(-0.55, 0.83))), 0.0), 3.0) * smoothstep(0.62, 0.18, ndv) * smoothstep(0.0, 0.12, ndv);
    col += mix(vec3(1.0, 0.95, 0.85), film * 1.5, 0.45 * patches) * crescent * uSweep;

    // Fine lines of colour running along the glass.
    float bands = pow(abs(sin(R.y * 6.5 + R.x * 3.5 + swirl * 2.4)), 26.0);
    col += mix(copper, film * 1.3, 0.7) * bands * (0.1 * curved + rim * 1.1);

    // Long diagonal streaks of colour deep inside the faces.
    float streak = smoothstep(0.48, 0.82, fbm(vec2((vP.x + vP.y) * 0.16, (vP.x - vP.y) * 0.8) + uSeed * 3.1 + 4.0));
    col += film * vec3(1.0, 0.55, 1.0) * streak * uFill * (1.0 - rim * 0.7) * (1.0 - pow(ndv, 3.0) * min(uSweep, 1.0) * 0.82);

    col *= uGain * facing;
    float peak = max(max(col.r, col.g), col.b);
    float alpha = clamp(max(peak, uBody + rim * 0.25), 0.0, 1.0) * mix(0.6, 1.0, facing);
    gl_FragColor = vec4(min(col, vec3(1.0)), alpha);
  }
`

type PrismLook = { gain?: number; fill?: number; seed?: number; body?: number; rimPower?: number; box?: number; sweep?: number }

export function prismMaterial({ gain = 1, fill = 0.32, seed = 0.2, body = 0.2, rimPower = 2.5, box = 1, sweep = 0 }: PrismLook = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: { uGain: { value: gain }, uFill: { value: fill }, uSeed: { value: seed }, uBody: { value: body }, uRimPower: { value: rimPower }, uBox: { value: box }, uSweep: { value: sweep } },
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
}

type Pt = [number, number]

/** Polygon with softened corners. */
function rounded(points: Pt[], radius = 0.25, into: THREE.Shape | THREE.Path = new THREE.Shape()) {
  const n = points.length
  points.forEach((p, i) => {
    const prev = points[(i - 1 + n) % n]
    const next = points[(i + 1) % n]
    const l1 = Math.hypot(prev[0] - p[0], prev[1] - p[1])
    const l2 = Math.hypot(next[0] - p[0], next[1] - p[1])
    const r = Math.min(radius, l1 / 2, l2 / 2)
    const a: Pt = [p[0] + ((prev[0] - p[0]) / l1) * r, p[1] + ((prev[1] - p[1]) / l1) * r]
    const b: Pt = [p[0] + ((next[0] - p[0]) / l2) * r, p[1] + ((next[1] - p[1]) / l2) * r]
    if (i === 0) into.moveTo(a[0], a[1])
    else into.lineTo(a[0], a[1])
    into.quadraticCurveTo(p[0], p[1], b[0], b[1])
  })
  into.closePath()
  return into as THREE.Shape
}

const roundRect = (w: number, h: number, r: number, cx = 0, cy = 0, into?: THREE.Shape | THREE.Path) =>
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

const circle = (r: number, cx = 0, cy = 0, into: THREE.Shape | THREE.Path = new THREE.Shape()) => {
  into.absarc(cx, cy, r, 0, Math.PI * 2, false)
  return into as THREE.Shape
}

/** Thick extrusion with a deep rounded bevel and smooth normals. */
function solid(shape: THREE.Shape, depth = 0.35, bevel = 0.2) {
  let g: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.9,
    bevelSegments: 16,
    curveSegments: 40,
  })
  g.deleteAttribute('normal')
  g.deleteAttribute('uv')
  g = mergeVertices(g, 1e-3)
  g.computeVertexNormals()
  const pos = g.getAttribute('position')
  const nor = g.getAttribute('normal')
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i)
    if (Math.abs(z - (depth + bevel)) < 1e-3) nor.setXYZ(i, 0, 0, 1)
    if (Math.abs(z + bevel) < 1e-3) nor.setXYZ(i, 0, 0, -1)
  }
  g.translate(0, 0, -depth / 2)
  return g
}

/** A glass rod following a 2D outline. */
function rod(shape: THREE.Path | THREE.Shape | Pt[], radius = 0.09, closed = true, z = 0) {
  const pts = Array.isArray(shape) ? shape.map(([x, y]) => new THREE.Vector2(x, y)) : shape.getSpacedPoints(180)
  const v = pts.map((p) => new THREE.Vector3(p.x, p.y, z))
  if (closed && v[0].distanceTo(v[v.length - 1]) < 1e-3) v.pop()
  const curve = new THREE.CatmullRomCurve3(v, closed, 'centripetal')
  return new THREE.TubeGeometry(curve, 420, radius, 22, closed)
}

const torus = (r: number, t: number, x = 0, y = 0, z = 0) => {
  const g = new THREE.TorusGeometry(r, t, 28, 120)
  g.translate(x, y, z)
  return g
}

const ball = (r: number, x = 0, y = 0, z = 0) => {
  const g = new THREE.SphereGeometry(r, 48, 48)
  g.translate(x, y, z)
  return g
}

/** Solid of revolution around Y from a list of (radius, height) points. */
function turned(profile: Pt[], y = 0) {
  const g = new THREE.LatheGeometry(
    new THREE.SplineCurve(profile.map(([r, h]) => new THREE.Vector2(r, h))).getPoints(120),
    128,
  )
  g.computeVertexNormals()
  g.translate(0, y, 0)
  return g
}

/* ─── Shapes ─── */

const crossShape = (s = 1, thick = 0.5) =>
  rounded(
    (
      [
        [-thick, -3],
        [thick, -3],
        [thick, 0.55],
        [1.7, 0.55],
        [1.7, 1.55],
        [thick, 1.55],
        [thick, 3],
        [-thick, 3],
        [-thick, 1.55],
        [-1.7, 1.55],
        [-1.7, 0.55],
        [-thick, 0.55],
      ] as Pt[]
    ).map(([x, y]) => [x * s, y * s] as Pt),
    0.22 * s,
  )

function flameShape(s = 1) {
  const sh = new THREE.Shape()
  sh.moveTo(0, -3.1 * s)
  sh.bezierCurveTo(-1.5 * s, -3.1 * s, -2.5 * s, -2.05 * s, -2.45 * s, -0.8 * s)
  sh.bezierCurveTo(-2.4 * s, 0.5 * s, -1 * s, 1.1 * s, -0.55 * s, 3.65 * s)
  sh.bezierCurveTo(1 * s, 2.7 * s, 2.5 * s, 1 * s, 2.45 * s, -0.8 * s)
  sh.bezierCurveTo(2.4 * s, -2.1 * s, 1.4 * s, -3.1 * s, 0, -3.1 * s)
  return sh
}

function heartShape(s = 1) {
  const sh = new THREE.Shape()
  sh.moveTo(0, -2.9 * s)
  sh.bezierCurveTo(-1.2 * s, -1.7 * s, -3.1 * s, -0.5 * s, -3.1 * s, 1 * s)
  sh.bezierCurveTo(-3.1 * s, 2.3 * s, -2.2 * s, 3 * s, -1.4 * s, 3 * s)
  sh.bezierCurveTo(-0.85 * s, 3 * s, -0.42 * s, 2.72 * s, -0.22 * s, 2.32 * s)
  sh.bezierCurveTo(-0.12 * s, 2.12 * s, 0.12 * s, 2.12 * s, 0.22 * s, 2.32 * s)
  sh.bezierCurveTo(0.42 * s, 2.72 * s, 0.85 * s, 3 * s, 1.4 * s, 3 * s)
  sh.bezierCurveTo(2.2 * s, 3 * s, 3.1 * s, 2.3 * s, 3.1 * s, 1 * s)
  sh.bezierCurveTo(3.1 * s, -0.5 * s, 1.2 * s, -1.7 * s, 0, -2.9 * s)
  return sh
}

function doveShape() {
  const sh = new THREE.Shape()
  sh.moveTo(-3.3, 1.05)
  sh.bezierCurveTo(-2.95, 1.55, -2.45, 1.75, -2.05, 1.55)
  sh.bezierCurveTo(-1.65, 1.35, -1.45, 0.95, -1.05, 0.95)
  sh.bezierCurveTo(-0.95, 2, -0.35, 3, 1.05, 3.4)
  sh.bezierCurveTo(0.75, 2.65, 0.9, 1.75, 1.45, 1.2)
  sh.bezierCurveTo(1.95, 1.5, 2.75, 1.75, 3.5, 1.35)
  sh.bezierCurveTo(3.1, 0.75, 2.2, -0.25, 1.05, -0.55)
  sh.bezierCurveTo(1.45, -1.25, 2.3, -1.95, 3.2, -2.1)
  sh.bezierCurveTo(2.2, -2.55, 0.75, -2.2, -0.15, -1.25)
  sh.bezierCurveTo(-0.95, -0.95, -1.95, -0.25, -2.3, 0.65)
  sh.bezierCurveTo(-2.55, 0.8, -2.95, 0.85, -3.3, 1.05)
  return sh
}

function planeShape() {
  return rounded(
    [
      [0, 3.4],
      [0.42, 2.6],
      [0.48, 0.95],
      [3.2, -0.72],
      [3.2, -1.35],
      [0.48, -0.5],
      [0.34, -2.1],
      [1.2, -2.8],
      [1.2, -3.25],
      [0, -2.92],
      [-1.2, -3.25],
      [-1.2, -2.8],
      [-0.34, -2.1],
      [-0.48, -0.5],
      [-3.2, -1.35],
      [-3.2, -0.72],
      [-0.48, 0.95],
      [-0.42, 2.6],
    ],
    0.16,
  )
}

function quoteShape() {
  const sh = new THREE.Shape()
  sh.moveTo(-1.15, -1.5)
  sh.bezierCurveTo(-2.1, -1.5, -2.6, -0.8, -2.6, 0.1)
  sh.bezierCurveTo(-2.6, 1.3, -1.8, 2.2, -0.75, 2.6)
  sh.bezierCurveTo(-0.5, 2.7, -0.3, 2.5, -0.5, 2.3)
  sh.bezierCurveTo(-1.05, 1.9, -1.4, 1.35, -1.45, 0.8)
  sh.bezierCurveTo(-0.6, 0.85, 0, 0.2, 0, -0.45)
  sh.bezierCurveTo(0, -1.05, -0.5, -1.5, -1.15, -1.5)
  return sh
}

function leafShape(s = 1, flip = 1) {
  const sh = new THREE.Shape()
  sh.moveTo(0, 0)
  sh.bezierCurveTo(0.2 * s * flip, 1.3 * s, 1.5 * s * flip, 1.9 * s, 2.7 * s * flip, 1.9 * s)
  sh.bezierCurveTo(2.75 * s * flip, 0.75 * s, 1.5 * s * flip, -0.3 * s, 0, 0)
  return sh
}

type Part = { g: THREE.BufferGeometry; look?: PrismLook; at?: [number, number, number]; rot?: [number, number, number] }

/** Every object as glass parts. Coordinates are roughly ±3.5 units. */
function buildParts(name: string): Part[] {
  switch (name) {
    case 'cross':
      return [{ g: solid(crossShape(1), 0.5, 0.26), look: { fill: 0.42, seed: 0.1 } }]
    case 'flame': {
      return [
        { g: solid(flameShape(1), 0.5, 0.26), look: { fill: 0.42, seed: 0.72 } },
        { g: rod(flameShape(0.46), 0.075), at: [0, -1.45, 0.55], look: { fill: 0, seed: 0.3 } },
      ]
    }
    case 'crown': {
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
        0.22,
      )
      return [
        { g: solid(body, 0.5, 0.24), look: { fill: 0.36, seed: 0.42 } },
        { g: ball(0.34, 0, 2.75), look: { fill: 0.5 } },
        { g: ball(0.3, 3.15, 1.75), look: { fill: 0.5 } },
        { g: ball(0.3, -3.15, 1.75), look: { fill: 0.5 } },
        { g: solid(roundRect(5.7, 0.52, 0.2, 0, -2.7), 0.4, 0.14), look: { fill: 0.2 } },
      ]
    }
    case 'heart':
      return [{ g: solid(heartShape(1), 0.55, 0.24), look: { fill: 0.5, seed: 0.85 } }]
    case 'dove':
      return [{ g: solid(doveShape(), 0.34, 0.2), look: { fill: 0.38, seed: 0.55 } }]
    case 'plane':
      return [{ g: solid(planeShape(), 0.24, 0.15), rot: [0, 0, -0.8], look: { fill: 0.34, seed: 0.05 } }]
    case 'quote':
      return [
        { g: solid(quoteShape(), 0.42, 0.24), at: [-0.3, 0, 0], look: { fill: 0.42, seed: 0.62 } },
        { g: solid(quoteShape(), 0.42, 0.24), at: [3.1, 0, 0], look: { fill: 0.42, seed: 0.18 } },
      ]
    case 'medical':
      return [
        {
          g: solid(
            rounded(
              [
                [-0.9, -2.9],
                [0.9, -2.9],
                [0.9, -0.9],
                [2.9, -0.9],
                [2.9, 0.9],
                [0.9, 0.9],
                [0.9, 2.9],
                [-0.9, 2.9],
                [-0.9, 0.9],
                [-2.9, 0.9],
                [-2.9, -0.9],
                [-0.9, -0.9],
              ],
              0.42,
            ),
            0.55,
            0.34,
          ),
          look: { fill: 0.46, seed: 0.28 },
        },
      ]
    case 'chat': {
      const bubble = rounded(
        [
          [-3.2, -2],
          [-1.5, -2],
          [-1.9, -3.2],
          [-0.1, -2],
          [3.2, -2],
          [3.2, 2.3],
          [-3.2, 2.3],
        ],
        0.55,
      )
      return [
        { g: solid(bubble, 0.4, 0.36), look: { fill: 0.42, seed: 0.48 } },
        { g: torus(0.46, 0.2, -1.6, 0.15, 0.45), look: { fill: 0, rimPower: 1.8 } },
        { g: torus(0.46, 0.2, 0, 0.15, 0.45), look: { fill: 0, rimPower: 1.8 } },
        { g: torus(0.46, 0.2, 1.6, 0.15, 0.45), look: { fill: 0, rimPower: 1.8 } },
      ]
    }
    case 'question': {
      const q: Pt[] = [
        [-1.15, 1.1],
        [-0.95, 1.75],
        [-0.35, 2.15],
        [0.45, 2.1],
        [1.1, 1.6],
        [1.15, 0.85],
        [0.6, 0.25],
        [0.05, -0.2],
        [0, -0.85],
      ]
      return [
        { g: torus(3.25, 0.34), look: { fill: 0, seed: 0.3, rimPower: 1.9 } },
        { g: rod(q, 0.4, false), look: { fill: 0.1, seed: 0.1, rimPower: 1.9 } },
        { g: ball(0.48, 0, -2.05), look: { fill: 0.3, rimPower: 1.9 } },
      ]
    }
    case 'play': {
      const tri = rounded(
        [
          [-1, -1.75],
          [2, 0],
          [-1, 1.75],
        ],
        0.4,
      )
      return [
        { g: torus(3.3, 0.24), look: { fill: 0, seed: 0.2 } },
        { g: solid(tri, 0.36, 0.26), look: { fill: 0.5, seed: 0.7 } },
      ]
    }
    case 'pin': {
      const sh = new THREE.Shape()
      sh.moveTo(0, -3.4)
      sh.bezierCurveTo(-0.8, -1.9, -2.5, -0.5, -2.5, 1.05)
      sh.bezierCurveTo(-2.5, 2.45, -1.4, 3.5, 0, 3.5)
      sh.bezierCurveTo(1.4, 3.5, 2.5, 2.45, 2.5, 1.05)
      sh.bezierCurveTo(2.5, -0.5, 0.8, -1.9, 0, -3.4)
      sh.holes.push(circle(0.95, 0, 1.05, new THREE.Path()))
      return [{ g: solid(sh, 0.6, 0.3), look: { fill: 0.42, seed: 0.9 } }]
    }
    case 'bible': {
      const left = rounded(
        [
          [-0.1, -1.6],
          [-3.6, -1.1],
          [-3.6, 1.9],
          [-0.1, 1.45],
        ],
        0.24,
      )
      const right = rounded(
        [
          [0.1, -1.6],
          [3.6, -1.1],
          [3.6, 1.9],
          [0.1, 1.45],
        ],
        0.24,
      )
      return [
        { g: solid(left, 0.3, 0.17), look: { fill: 0.4, seed: 0.3 } },
        { g: solid(right, 0.3, 0.17), look: { fill: 0.4, seed: 0.74 } },
        { g: solid(crossShape(0.32, 0.42), 0.08, 0.07), at: [1.85, 0.15, 0.32], look: { fill: 0.15 } },
        ...[0.65, 0.05, -0.55].map((y) => ({
          g: rod(
            [
              [-3.05, y + 0.42],
              [-1.9, y + 0.28],
              [-0.7, y + 0.06],
            ],
            0.045,
            false,
            0.34,
          ),
          look: { fill: 0 },
        })),
      ]
    }
    case 'house': {
      const sh = rounded(
        [
          [-2.5, -3],
          [2.5, -3],
          [2.5, 0.5],
          [3.3, 0.5],
          [0, 3.4],
          [-3.3, 0.5],
          [-2.5, 0.5],
        ],
        0.28,
      )
      sh.holes.push(roundRect(1.5, 2.6, 0.2, 0, -1.65, new THREE.Path()))
      return [{ g: solid(sh, 1.1, 0.24), look: { fill: 0.56, seed: 0.62 } }]
    }
    case 'church': {
      const sh = rounded(
        [
          [-2.9, -3.3],
          [2.9, -3.3],
          [2.9, -0.4],
          [0.95, 0.75],
          [0, 2.15],
          [-0.95, 0.75],
          [-2.9, -0.4],
        ],
        0.22,
      )
      const door = new THREE.Path()
      door.moveTo(-0.72, -3)
      door.lineTo(-0.72, -1.5)
      door.absarc(0, -1.5, 0.72, Math.PI, 0, true)
      door.lineTo(0.72, -3)
      door.closePath()
      sh.holes.push(door)
      return [
        { g: solid(sh, 0.9, 0.22), look: { fill: 0.54, seed: 0.16 } },
        { g: solid(crossShape(0.24, 0.42), 0.14, 0.08), at: [0, 3.05, 0], look: { fill: 0.1 } },
      ]
    }
    case 'dome': {
      const wall: Pt[] = [
        [0.02, 2.05],
        [0.9, 1.9],
        [1.8, 1.5],
        [2.55, 0.85],
        [3, 0.05],
        [3.15, -0.35],
        [3.2, -2.3],
        [3.42, -2.55],
        [3.42, -2.85],
      ]
      const columns: Part[] = Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + 0.2
        const g = new THREE.CylinderGeometry(0.07, 0.07, 1.95, 16)
        g.translate(Math.cos(a) * 3.2, -1.32, Math.sin(a) * 3.2)
        return { g, look: { fill: 0 } }
      })
      return [
        { g: turned(wall), look: { fill: 0.4, seed: 0.5, rimPower: 2.8, box: 0, sweep: 0.7 } },
        { g: torus(3.18, 0.09), rot: [Math.PI / 2, 0, 0], at: [0, -0.36, 0], look: { fill: 0 } },
        ...columns,
        { g: solid(crossShape(0.22, 0.42), 0.12, 0.07), at: [0, 2.7, 0], look: { fill: 0.1 } },
      ]
    }
    case 'mic': {
      const capsule = new THREE.CapsuleGeometry(1.25, 1.9, 24, 64)
      capsule.translate(0, 1.15, 0)
      const cradle: Pt[] = [
        [-1.95, 0.75],
        [-1.75, -0.45],
        [-1, -1.15],
        [0, -1.4],
        [1, -1.15],
        [1.75, -0.45],
        [1.95, 0.75],
      ]
      return [
        { g: capsule, look: { fill: 0.4, seed: 0.84, rimPower: 2.6, box: 0, sweep: 0.6 } },
        ...[1.55, 0.75, -0.05].map((y) => {
          const g = torus(1.27, 0.035)
          g.rotateX(Math.PI / 2)
          g.translate(0, y, 0)
          return { g, look: { fill: 0 } }
        }),
        { g: rod(cradle, 0.14, false), look: { fill: 0 } },
        { g: rod([[0, -1.45], [0, -2.6]], 0.14, false), look: { fill: 0 } },
        { g: solid(roundRect(2.8, 0.28, 0.12, 0, -2.75), 0.28, 0.12), look: { fill: 0 } },
      ]
    }
    case 'cap': {
      const board = rounded(
        [
          [0, 0.1],
          [3.6, 1.35],
          [0, 2.6],
          [-3.6, 1.35],
        ],
        0.16,
      )
      const base = rounded(
        [
          [-2, -1.7],
          [2, -1.7],
          [2.1, 0.75],
          [-2.1, 0.75],
        ],
        0.3,
      )
      return [
        { g: solid(base, 0.6, 0.18), at: [0, -0.1, -0.15], look: { fill: 0.42, seed: 0.3 } },
        { g: solid(board, 0.14, 0.09), at: [0, 0, 0.3], look: { fill: 0.36, seed: 0.7 } },
        { g: rod([[0, 1.35], [1.8, 1.05], [3, 0.65], [3.05, -1]], 0.05, false, 0.5), look: { fill: 0 } },
        { g: ball(0.2, 3.05, -1.15, 0.5), look: { fill: 0.3 } },
      ]
    }
    case 'camera': {
      const body = rounded(
        [
          [-3.4, -2.1],
          [3.4, -2.1],
          [3.4, 1.7],
          [1.5, 1.7],
          [1, 2.6],
          [-1, 2.6],
          [-1.5, 1.7],
          [-3.4, 1.7],
        ],
        0.42,
      )
      return [
        { g: solid(body, 0.7, 0.24), look: { fill: 0.26, seed: 0.4 } },
        { g: torus(1.42, 0.16, 0, -0.1, 0.55), look: { fill: 0 } },
        { g: torus(0.9, 0.09, 0, -0.1, 0.55), look: { fill: 0 } },
        { g: ball(0.66, 0, -0.1, 0.5), look: { fill: 0.7, seed: 0.1 } },
      ]
    }
    case 'sprout':
      return [
        { g: rod([[0, -3.1], [0.05, -1.6], [-0.05, -0.3], [0, 0.7]], 0.14, false), look: { fill: 0 } },
        { g: solid(leafShape(1.05, 1), 0.2, 0.14), at: [0.05, 0.55, 0], look: { fill: 0.42, seed: 0.35 } },
        { g: solid(leafShape(0.82, -1), 0.2, 0.13), at: [-0.05, -0.75, 0], look: { fill: 0.42, seed: 0.8 } },
        { g: turned([[0.02, -2.95], [1.35, -3.05], [1.9, -3.4], [1.5, -3.8], [0.02, -3.85]]), look: { fill: 0.4 } },
      ]
    case 'person': {
      const shoulders = new THREE.Shape()
      shoulders.moveTo(-3, -3.2)
      shoulders.bezierCurveTo(-3, -0.9, -1.8, -0.2, 0, -0.2)
      shoulders.bezierCurveTo(1.8, -0.2, 3, -0.9, 3, -3.2)
      shoulders.closePath()
      return [
        { g: ball(1.55, 0, 1.75), look: { fill: 0.4, seed: 0.45, rimPower: 2.6, box: 0, sweep: 0.7 } },
        { g: solid(shoulders, 1, 0.3), look: { fill: 0.45, seed: 0.1 } },
      ]
    }
    case 'flag': {
      const cloth = new THREE.Shape()
      cloth.moveTo(-2.3, 2.9)
      cloth.bezierCurveTo(-1.1, 3.6, 0.2, 2.2, 3.2, 3)
      cloth.lineTo(3.2, -0.2)
      cloth.bezierCurveTo(0.2, -1, -1.1, 0.4, -2.3, -0.3)
      cloth.closePath()
      return [
        { g: rod([[-2.6, 3.5], [-2.6, -3.6]], 0.14, false), look: { fill: 0 } },
        { g: ball(0.28, -2.6, 3.65), look: { fill: 0.3 } },
        { g: solid(cloth, 0.14, 0.11), look: { fill: 0.56, seed: 0.26 } },
      ]
    }
    case 'mountain': {
      const back = rounded(
        [
          [-3.5, -2.4],
          [-0.9, 2.5],
          [0.5, 0.2],
          [1.2, 1.1],
          [3.5, -2.4],
        ],
        0.2,
      )
      return [
        { g: solid(back, 0.75, 0.22), look: { fill: 0.48, seed: 0.66 } },
        { g: rod([[-1.75, 0.85], [-1.25, 0.3], [-0.85, 0.65], [-0.45, 0.15], [-0.1, 0.8]], 0.05, false, 0.6), look: { fill: 0 } },
      ]
    }
    case 'canopy': {
      const top = rounded(
        [
          [-3.5, 0.3],
          [0, 2.6],
          [3.5, 0.3],
        ],
        0.26,
      )
      return [
        { g: solid(top, 0.8, 0.2), look: { fill: 0.5, seed: 0.22 } },
        ...[-3.1, 3.1].map((x) => ({ g: rod([[x, 0.1], [x, -3]], 0.11, false), look: { fill: 0 } })),
        ...[-1.1, 1.1].map((x) => ({ g: rod([[x, 0.1], [x, -3]], 0.07, false, -0.5), look: { fill: 0 } })),
      ]
    }
    case 'coin-cross':
    case 'coin-flame':
    case 'coin-crown': {
      const emblem =
        name === 'coin-cross'
          ? solid(crossShape(0.5), 0.08, 0.1)
          : name === 'coin-flame'
            ? solid(flameShape(0.56), 0.08, 0.1)
            : solid(
                rounded(
                  [
                    [-1.5, -1.05],
                    [1.5, -1.05],
                    [1.8, 0.8],
                    [0.9, 0.05],
                    [0, 1.35],
                    [-0.9, 0.05],
                    [-1.8, 0.8],
                  ],
                  0.12,
                ),
                0.08,
                0.1,
              )
      const seed = name === 'coin-cross' ? 0.16 : name === 'coin-flame' ? 0.54 : 0.82
      const disc = new THREE.CylinderGeometry(3.15, 3.15, 0.3, 128, 1)
      disc.rotateX(Math.PI / 2)
      return [
        { g: disc, look: { fill: 0.42, seed, body: 0.3 } },
        { g: torus(3.2, 0.3), look: { fill: 0, seed } },
        { g: emblem, at: [0, 0, 0.28], look: { fill: 0.1, seed: seed + 0.3 } },
      ]
    }
    case 'tube': {
      const profile: Pt[] = [
        [2.2, -3.3],
        [2.55, -3.3],
        [2.62, -3.2],
        [2.62, 3.2],
        [2.55, 3.3],
        [2.2, 3.3],
        [2.13, 3.2],
        [2.13, -3.2],
        [2.2, -3.3],
      ]
      const g = new THREE.LatheGeometry(
        profile.map(([r, h]) => new THREE.Vector2(r, h)),
        160,
      )
      g.computeVertexNormals()
      return [{ g, look: { fill: 0.2, seed: 0.4, rimPower: 4.2, box: 0.15 } }]
    }
    case 'bubble':
    case 'world':
      return [{ g: new THREE.SphereGeometry(3.4, 192, 192), look: { fill: 1.3, seed: name === 'world' ? 0.15 : 0.6, rimPower: 2.3, gain: 1, body: 0.05, box: 0, sweep: 0.75 } }]
    default:
      throw new Error(`Unknown prism shape: ${name}`)
  }
}

function PrismObject({ name, pale }: { name: string; pale: boolean }) {
  const parts = useMemo(() => buildParts(name), [name])
  return (
    <>
      {parts.map((p, i) =>
        pale ? (
          <mesh key={i} geometry={p.g} position={p.at} rotation={p.rot}>
            {/* Rods and rings are thin, so they refract less than the solid bodies. */}
            <GlassMaterial thickness={p.look?.fill === 0 ? 0.8 : 2.2} />
          </mesh>
        ) : (
          <mesh key={i} geometry={p.g} position={p.at} rotation={p.rot} material={prismMaterial(p.look)} />
        ),
      )}
    </>
  )
}

function GlassThirty({ pale }: { pale: boolean }) {
  const material = useMemo(() => prismMaterial({ fill: 0.4, seed: 0.4, rimPower: 3.2 }), [])
  return (
    <Text3D font="/fonts/cinzel-800.typeface.json" size={4} height={1.1} curveSegments={36} bevelEnabled bevelThickness={0.22} bevelSize={0.12} bevelSegments={14} letterSpacing={-0.2} material={pale ? undefined : material}>
      30
      {pale && <GlassMaterial thickness={1.6} />}
    </Text3D>
  )
}

/** Moves the camera so the object fills the frame, however big it is. */
function Fit({ children, margin }: { children: ReactNode; margin: number }) {
  const group = useRef<THREE.Group>(null)
  const { camera, size } = useThree()
  useLayoutEffect(() => {
    const g = group.current!
    g.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(g)
    const c = box.getCenter(new THREE.Vector3())
    const s = box.getSize(new THREE.Vector3())
    g.position.sub(c)
    const cam = camera as THREE.PerspectiveCamera
    const half = Math.tan((cam.fov * Math.PI) / 360)
    const dist = Math.max(s.y / 2 / half, s.x / 2 / (half * (size.width / size.height))) * margin + s.z / 2
    cam.position.set(0, 0, dist)
    cam.near = 0.1
    cam.far = dist + s.z + 50
    cam.updateProjectionMatrix()
  }, [camera, size, margin])
  return <group ref={group}>{children}</group>
}

function Ready({ onReady }: { onReady?: () => void }) {
  const frames = useRef(0)
  useFrame(() => {
    frames.current += 1
    if (frames.current === 8) onReady?.()
  })
  return null
}

export function PrismScene({ shape, finish = 'pale', rotation = [0, 0, 0], margin = 1.06, onReady }: { shape: string; finish?: string; rotation?: [number, number, number]; margin?: number; onReady?: () => void }) {
  const pale = finish === 'pale'
  return (
    <Canvas
      dpr={pale ? 1 : 2}
      camera={{ position: [0, 0, 30], fov: pale ? 28 : 20 }}
      gl={{ antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = pale ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping
        gl.toneMappingExposure = 1.05
        gl.setClearColor(0x000000, 0)
      }}
    >
      <ambientLight intensity={0.15} />
      <Suspense fallback={null}>
        {pale && <GlassStudioEnv />}
        <Fit margin={margin}>
          <group rotation={rotation}>{shape === 'thirty' ? <GlassThirty pale={pale} /> : <PrismObject name={shape} pale={pale} />}</group>
        </Fit>
        <Ready onReady={onReady} />
      </Suspense>
    </Canvas>
  )
}
