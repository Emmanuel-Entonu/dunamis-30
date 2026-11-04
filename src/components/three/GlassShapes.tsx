'use client'

import { Center, Text3D } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

import { GlassMaterial } from './GlassKit'

export type GlassShape = 'g-cross' | 'g-flame' | 'g-crown' | 'g-book' | 'g-bubble' | 'g-tube' | 'g-coin-cross' | 'g-coin-flame' | 'g-coin-crown' | 'gold-30'

/** Heavy rounded bevel: what makes extruded icons read as poured glass. */
const glassExtrude = (shape: THREE.Shape, depth = 0.3, bevel = 0.42) =>
  new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.78,
    bevelSegments: 20,
    curveSegments: 72,
  })

function crossShape(s = 1) {
  const w = 0.5 * s
  const top = 2.2 * s
  const bottom = -3 * s
  const arm = 1.65 * s
  const armY = 0.65 * s
  const sh = new THREE.Shape()
  sh.moveTo(-w, top)
  sh.lineTo(w, top)
  sh.lineTo(w, armY + w)
  sh.lineTo(arm, armY + w)
  sh.lineTo(arm, armY - w)
  sh.lineTo(w, armY - w)
  sh.lineTo(w, bottom)
  sh.lineTo(-w, bottom)
  sh.lineTo(-w, armY - w)
  sh.lineTo(-arm, armY - w)
  sh.lineTo(-arm, armY + w)
  sh.lineTo(-w, armY + w)
  sh.closePath()
  return sh
}

/** Tongue of fire — Dunamis (power) / the Holy Ghost. */
function flameShape(s = 1) {
  const sh = new THREE.Shape()
  sh.moveTo(0, 3 * s)
  sh.bezierCurveTo(0.6 * s, 2 * s, 2.2 * s, 1.1 * s, 2 * s, -0.6 * s)
  sh.bezierCurveTo(1.85 * s, -2 * s, 0.9 * s, -2.8 * s, 0, -2.8 * s)
  sh.bezierCurveTo(-1 * s, -2.8 * s, -2 * s, -2 * s, -2 * s, -0.7 * s)
  sh.bezierCurveTo(-2 * s, 0.4 * s, -1.4 * s, 0.9 * s, -1.1 * s, 1.6 * s)
  sh.bezierCurveTo(-0.7 * s, 0.9 * s, -0.4 * s, 0.6 * s, -0.25 * s, 0.4 * s)
  sh.bezierCurveTo(-0.5 * s, 1.4 * s, -0.4 * s, 2.3 * s, 0, 3 * s)
  return sh
}

function crownShape(s = 1) {
  const sh = new THREE.Shape()
  sh.moveTo(-2.2 * s, -1.4 * s)
  sh.lineTo(2.2 * s, -1.4 * s)
  sh.lineTo(2.5 * s, 1.5 * s)
  sh.lineTo(1.25 * s, 0.25 * s)
  sh.lineTo(0, 2 * s)
  sh.lineTo(-1.25 * s, 0.25 * s)
  sh.lineTo(-2.5 * s, 1.5 * s)
  sh.closePath()
  return sh
}

/** Open Bible silhouette. */
function bookShape(s = 1) {
  const sh = new THREE.Shape()
  sh.moveTo(0, -1.2 * s)
  sh.bezierCurveTo(-1 * s, -0.6 * s, -2.2 * s, -0.7 * s, -3 * s, -0.9 * s)
  sh.lineTo(-3 * s, 1.6 * s)
  sh.bezierCurveTo(-2.2 * s, 1.9 * s, -0.9 * s, 1.8 * s, 0, 1.1 * s)
  sh.bezierCurveTo(0.9 * s, 1.8 * s, 2.2 * s, 1.9 * s, 3 * s, 1.6 * s)
  sh.lineTo(3 * s, -0.9 * s)
  sh.bezierCurveTo(2.2 * s, -0.7 * s, 1 * s, -0.6 * s, 0, -1.2 * s)
  return sh
}

/** Thick glass medallion with a raised emblem. */
function Coin({ emblem }: { emblem: THREE.Shape }) {
  const disc = useMemo(() => {
    // Lathe a rounded-rim profile into a coin.
    const pts: THREE.Vector2[] = []
    const R = 2.4
    const H = 0.55
    const r = 0.28
    pts.push(new THREE.Vector2(0, -H))
    for (let i = 0; i <= 12; i++) {
      const a = -Math.PI / 2 + (i / 12) * Math.PI
      pts.push(new THREE.Vector2(R - r + Math.cos(a) * r, Math.sin(a) * (H - 0.02) * 1))
    }
    pts.push(new THREE.Vector2(0, H))
    const g = new THREE.LatheGeometry(pts, 128)
    g.rotateX(Math.PI / 2)
    return g
  }, [])
  const relief = useMemo(() => {
    const g = glassExtrude(emblem, 0.12, 0.14)
    g.center()
    return g
  }, [emblem])
  return (
    <group>
      <mesh geometry={disc}>
        <GlassMaterial thickness={1.4} />
      </mesh>
      <mesh geometry={relief} position={[0, 0, 0.62]}>
        <GlassMaterial thickness={0.8} chromaticAberration={0.8} />
      </mesh>
    </group>
  )
}

/** Thick-walled open glass tube (hero edges). */
function Tube() {
  const g = useMemo(() => {
    const pts: THREE.Vector2[] = []
    const outer = 1.6
    const inner = 1.25
    const h = 2.2
    const r = 0.17
    // Rounded rectangle profile swept around the axis.
    const arc = (cx: number, cy: number, a0: number, a1: number) => {
      for (let i = 0; i <= 8; i++) {
        const a = a0 + ((a1 - a0) * i) / 8
        pts.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r))
      }
    }
    arc(inner + r, -h + r, Math.PI, Math.PI * 1.5)
    arc(outer - r, -h + r, -Math.PI / 2, 0)
    arc(outer - r, h - r, 0, Math.PI / 2)
    arc(inner + r, h - r, Math.PI / 2, Math.PI)
    pts.push(pts[0].clone())
    return new THREE.LatheGeometry(pts, 160)
  }, [])
  return (
    <mesh geometry={g}>
      <GlassMaterial thickness={1.2} chromaticAberration={0.7} iridescence={1} />
    </mesh>
  )
}

function Bubble() {
  return (
    <mesh>
      <sphereGeometry args={[2.4, 128, 128]} />
      <GlassMaterial thickness={0.25} chromaticAberration={1} iridescence={1} iridescenceThicknessRange={[150, 1200]} backside={false} />
    </mesh>
  )
}

const goldMaterial = new THREE.MeshPhysicalMaterial({
  color: '#ffc45c',
  metalness: 1,
  roughness: 0.12,
  clearcoat: 1,
  clearcoatRoughness: 0.04,
  envMapIntensity: 2.2,
})

/** "30 YEARS" in polished gold, in the anniversary crest's roman letterforms. */
function GoldThirty() {
  return (
    <group>
      <Center position={[0, 0.55, 0]} disableZ>
        <Text3D font="/fonts/cinzel-800.typeface.json" size={2.6} height={0.7} curveSegments={24} bevelEnabled bevelThickness={0.14} bevelSize={0.07} bevelSegments={10} letterSpacing={-0.12} material={goldMaterial}>
          30
        </Text3D>
      </Center>
      <Center position={[0, -1.55, 0.25]} disableZ>
        <Text3D font="/fonts/cinzel-800.typeface.json" size={0.62} height={0.22} curveSegments={16} bevelEnabled bevelThickness={0.05} bevelSize={0.025} bevelSegments={6} letterSpacing={0.32} material={goldMaterial}>
          YEARS
        </Text3D>
      </Center>
    </group>
  )
}

export function GlassObject({ shape }: { shape: GlassShape }) {
  const geometry = useMemo(() => {
    const g =
      shape === 'g-cross'
        ? glassExtrude(crossShape(0.9))
        : shape === 'g-flame'
          ? glassExtrude(flameShape(0.95))
          : shape === 'g-crown'
            ? glassExtrude(crownShape(0.95))
            : shape === 'g-book'
              ? glassExtrude(bookShape(0.85), 0.35, 0.3)
              : null
    g?.center()
    return g
  }, [shape])

  if (shape === 'gold-30') return <GoldThirty />
  if (shape === 'g-tube') return <Tube />
  if (shape === 'g-bubble') return <Bubble />
  if (shape === 'g-coin-cross') return <Coin emblem={crossShape(0.42)} />
  if (shape === 'g-coin-flame') return <Coin emblem={flameShape(0.45)} />
  if (shape === 'g-coin-crown') return <Coin emblem={crownShape(0.5)} />
  return (
    <mesh geometry={geometry!}>
      <GlassMaterial />
    </mesh>
  )
}
