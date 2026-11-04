'use client'

import { Environment, MeshTransmissionMaterial } from '@react-three/drei'
import type { ComponentProps } from 'react'
import * as THREE from 'three'

/*
 * Shared "liquid glass" look for every render: clear glass with heavy bevels whose
 * interiors refract a dark studio streaked with gold, cyan and magenta light, and
 * whose rims catch white softboxes.
 */

let studio: THREE.Texture | null = null

/** Equirectangular studio painted on a canvas: used both as the environment and as what the glass refracts. */
export function glassStudio() {
  if (studio) return studio
  const c = document.createElement('canvas')
  c.width = 2048
  c.height = 1024
  const g = c.getContext('2d')!
  const sky = g.createLinearGradient(0, 0, 0, c.height)
  sky.addColorStop(0, '#3a3a3a')
  sky.addColorStop(0.5, '#161616')
  sky.addColorStop(1, '#1c140c')
  g.fillStyle = sky
  g.fillRect(0, 0, c.width, c.height)

  const glow = (x: number, y: number, rx: number, ry: number, color: string, alpha: number) => {
    g.save()
    g.translate(x, y)
    g.scale(rx, ry)
    const r = g.createRadialGradient(0, 0, 0, 0, 0, 1)
    r.addColorStop(0, color)
    r.addColorStop(1, 'transparent')
    g.globalAlpha = alpha
    g.fillStyle = r
    g.beginPath()
    g.arc(0, 0, 1, 0, Math.PI * 2)
    g.fill()
    g.restore()
  }
  const box = (x: number, y: number, w: number, h: number, color: string, alpha: number, blur = 18) => {
    g.save()
    g.globalAlpha = alpha
    g.filter = `blur(${blur}px)`
    g.fillStyle = color
    g.fillRect(x, y, w, h)
    g.restore()
  }

  // three.js equirect: u=0.25 (x=512) is straight behind the object (-Z), u=0.75 (x=1536)
  // is behind the camera (+Z), u=0.5 is +X (right), u=0/1 is -X (left).
  // Behind: kept black so glass interiors read dark, crossed by a few thin light lines.
  box(440, 180, 10, 640, '#ffffff', 0.9, 2)
  box(585, 240, 6, 560, '#ffd27a', 0.9, 2)
  box(360, 520, 300, 5, '#ffffff', 0.5, 2)
  // Sides: cool blue left, gold right — these become the dispersion on the rims.
  glow(0, 470, 300, 360, '#2aa8ff', 1)
  glow(2048, 470, 300, 360, '#2aa8ff', 1)
  glow(1024, 470, 300, 360, '#ffa31f', 1)
  glow(760, 700, 160, 200, '#ff3d7a', 0.55)
  // Front (what camera-facing faces reflect): warm softbox, strongest on the upper half.
  box(1250, 160, 600, 380, '#fff0d4', 0.55, 40)
  glow(1536, 760, 360, 160, '#ffb347', 0.7)
  box(120, 200, 180, 520, '#ffffff', 0.9, 30)
  box(1760, 180, 200, 560, '#ffffff', 0.9, 30)
  box(900, 220, 140, 420, '#ffffff', 0.8, 26)
  // Top: white strip for rim highlights on upper edges. Bottom: warm glow (the gold horizon).
  box(0, 0, 2048, 170, '#ffffff', 1, 30)
  glow(1024, 1024, 1100, 220, '#ff9a1f', 0.6)

  const t = new THREE.CanvasTexture(c)
  t.mapping = THREE.EquirectangularReflectionMapping
  t.colorSpace = THREE.SRGBColorSpace
  studio = t
  return t
}

let backdrop: THREE.Texture | null = null

/**
 * What the glass refracts. MeshTransmissionMaterial samples a screen-space buffer, so this is
 * painted in screen space: dark centre (deep interiors), coloured light toward the edges that
 * refraction bends into the rims, and a few white streaks.
 */
export function glassBackdrop() {
  if (backdrop) return backdrop
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 1024
  const g = c.getContext('2d')!
  g.fillStyle = '#141414'
  g.fillRect(0, 0, 1024, 1024)
  const glow = (x: number, y: number, r: number, color: string, alpha: number) => {
    const grad = g.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, color)
    grad.addColorStop(1, 'transparent')
    g.globalAlpha = alpha
    g.fillStyle = grad
    g.fillRect(0, 0, 1024, 1024)
  }
  glow(880, 760, 420, '#ff9a1f', 1)
  glow(980, 360, 260, '#ffd27a', 0.8)
  glow(120, 260, 380, '#2aa8ff', 1)
  glow(180, 860, 280, '#ff3d8a', 0.75)
  glow(512, 40, 420, '#ffffff', 0.8)
  glow(560, 1000, 380, '#ffffff', 0.35)
  // Keep the middle dark.
  glow(512, 520, 300, '#0e0e0e', 1)
  g.globalAlpha = 1
  g.filter = 'blur(3px)'
  g.strokeStyle = '#ffffff'
  g.lineWidth = 7
  g.globalAlpha = 0.85
  for (const [x1, y1, x2, y2] of [
    [80, 980, 980, 120],
    [300, 1024, 1024, 330],
    [0, 600, 420, 0],
  ]) {
    g.beginPath()
    g.moveTo(x1, y1)
    g.lineTo(x2, y2)
    g.stroke()
  }
  g.filter = 'none'
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  backdrop = t
  return t
}

export function GlassStudioEnv() {
  return <Environment map={glassStudio()} environmentIntensity={1.6} />
}

type MTMProps = ComponentProps<typeof MeshTransmissionMaterial>

/** Clear dispersive glass. Thickness is in scene units (objects are ~5 units across). */
export function GlassMaterial(props: Partial<MTMProps>) {
  return (
    <MeshTransmissionMaterial
      samples={16}
      resolution={2048}
      transmission={1}
      roughness={0}
      thickness={2.2}
      ior={1.55}
      chromaticAberration={0.55}
      anisotropicBlur={0.08}
      distortion={0}
      temporalDistortion={0}
      clearcoat={1}
      clearcoatRoughness={0}
      iridescence={0.7}
      iridescenceIOR={1.35}
      iridescenceThicknessRange={[250, 900]}
      envMapIntensity={3.6}
      backside
      backsideThickness={0.8}
      color="#ffffff"
      background={glassBackdrop()}
      {...props}
    />
  )
}
