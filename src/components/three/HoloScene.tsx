'use client'

import { Bounds, Center, Environment, Lightformer, Text3D } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'

import { Crest } from './Crest'
import { GlassStudioEnv } from './GlassKit'
import { GlassObject, type GlassShape } from './GlassShapes'
import { GlassHand, type HandPose } from './GlassHand'

export type HoloShape = 'thirty' | 'cross' | 'globe' | 'spark' | 'ring' | 'capsule' | 'hand' | 'crest' | GlassShape
const isGlass = (s: HoloShape) => s === 'hand' || s.startsWith('g-') || s === 'gold-30'

const defaultPose: HandPose = { curl: 0.22, spread: 0.12, thumb: 0.2 }
export type HoloFinish = 'chrome' | 'gold'

const finishes: Record<HoloFinish, THREE.MeshPhysicalMaterialParameters> = {
  chrome: {
    color: '#e6e6ee',
    metalness: 1,
    roughness: 0.1,
    iridescence: 1,
    iridescenceIOR: 1.9,
    iridescenceThicknessMinimum: 180,
    iridescenceThicknessMaximum: 820,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.5,
  },
  gold: {
    color: '#ffc75a',
    metalness: 1,
    roughness: 0.14,
    iridescence: 0.55,
    iridescenceIOR: 1.6,
    iridescenceThicknessMinimum: 260,
    iridescenceThicknessMaximum: 640,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.6,
  },
}

const extrude = (shape: THREE.Shape, depth: number, bevel: number) =>
  new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.8,
    bevelSegments: 10,
    curveSegments: 48,
  })

/** Latin cross with softly rounded ends. */
function crossShape() {
  const s = new THREE.Shape()
  const w = 0.42 // half arm width
  const top = 2.1
  const bottom = -3.1
  const arm = 1.6
  const armY = 0.6
  const r = 0.18
  s.moveTo(-w + r, top)
  s.lineTo(w - r, top)
  s.quadraticCurveTo(w, top, w, top - r)
  s.lineTo(w, armY + w)
  s.lineTo(arm - r, armY + w)
  s.quadraticCurveTo(arm, armY + w, arm, armY + w - r)
  s.lineTo(arm, armY - w + r)
  s.quadraticCurveTo(arm, armY - w, arm - r, armY - w)
  s.lineTo(w, armY - w)
  s.lineTo(w, bottom + r)
  s.quadraticCurveTo(w, bottom, w - r, bottom)
  s.lineTo(-w + r, bottom)
  s.quadraticCurveTo(-w, bottom, -w, bottom + r)
  s.lineTo(-w, armY - w)
  s.lineTo(-arm + r, armY - w)
  s.quadraticCurveTo(-arm, armY - w, -arm, armY - w + r)
  s.lineTo(-arm, armY + w - r)
  s.quadraticCurveTo(-arm, armY + w, -arm + r, armY + w)
  s.lineTo(-w, armY + w)
  s.lineTo(-w, top - r)
  s.quadraticCurveTo(-w, top, -w + r, top)
  return s
}

/** Four-point sparkle (✦) with concave sides. */
function sparkShape() {
  const s = new THREE.Shape()
  const R = 2
  const k = 0.16
  s.moveTo(0, R)
  s.quadraticCurveTo(k, k, R, 0)
  s.quadraticCurveTo(k, -k, 0, -R)
  s.quadraticCurveTo(-k, -k, -R, 0)
  s.quadraticCurveTo(-k, k, 0, R)
  return s
}

function Shape({ shape, material, pose, inflate }: { shape: HoloShape; material: THREE.Material; pose: HandPose; inflate: number }) {
  const geometry = useMemo(() => {
    switch (shape) {
      case 'cross':
        return extrude(crossShape(), 0.55, 0.16)
      case 'spark':
        return extrude(sparkShape(), 0.35, 0.22)
      case 'ring':
        return new THREE.TorusGeometry(1.6, 0.55, 96, 220)
      case 'capsule':
        return new THREE.CapsuleGeometry(0.9, 3.2, 24, 96)
      default:
        return null
    }
  }, [shape])

  if (shape === 'hand') return <GlassHand pose={pose} inflate={inflate} debug={material.name === 'debug'} />
  if (shape.startsWith('g-') || shape === 'gold-30') return <GlassObject shape={shape as GlassShape} />
  if (shape === 'crest') return <Crest />

  if (shape === 'thirty') {
    return (
      <Center>
        <Text3D
          font="/fonts/onest-700.typeface.json"
          size={2.6}
          height={0.7}
          curveSegments={24}
          bevelEnabled
          bevelThickness={0.12}
          bevelSize={0.07}
          bevelSegments={10}
          letterSpacing={-0.06}
          material={material}
        >
          30
        </Text3D>
      </Center>
    )
  }

  if (shape === 'globe') {
    return (
      <group>
        <mesh material={material}>
          <sphereGeometry args={[1.7, 128, 128]} />
        </mesh>
        <mesh material={material} rotation={[Math.PI / 2.3, 0.25, 0]}>
          <torusGeometry args={[2.55, 0.07, 32, 260]} />
        </mesh>
      </group>
    )
  }

  return (
    <Center>
      <mesh geometry={geometry!} material={material} />
    </Center>
  )
}

/** Spectrum light-formers: gives chrome its rainbow rim without fetching HDR files. */
function SpectrumStudio({ finish }: { finish: HoloFinish }) {
  const gold = finish === 'gold'
  return (
    <Environment resolution={512} frames={1}>
      {/* Chrome reflects a black room (dark glass look); gold reflects a warm one so faces read as metal. */}
      <color attach="background" args={[gold ? '#4a2c06' : '#000000']} />
      <Lightformer form="rect" color="#fff1d6" intensity={gold ? 2.2 : 0.25} position={[0, 2, 10]} scale={[26, 14, 1]} />
      <Lightformer form="rect" color="#ff3d9a" intensity={7} position={[-6, 1, -2]} rotation-y={Math.PI / 2.4} scale={[1.4, 12, 1]} />
      <Lightformer form="rect" color="#2fd5ff" intensity={7} position={[6, -1, -2]} rotation-y={-Math.PI / 2.4} scale={[1.4, 12, 1]} />
      <Lightformer form="rect" color="#ffc14d" intensity={6} position={[0, 6, -1]} rotation-x={Math.PI / 2} scale={[12, 1.6, 1]} />
      <Lightformer form="rect" color="#7a5cff" intensity={5} position={[0, -6, 1]} rotation-x={-Math.PI / 2} scale={[12, 1.4, 1]} />
      <Lightformer form="rect" color="#ffffff" intensity={3.5} position={[3, 3, 7]} scale={[3, 3, 1]} />
      <Lightformer form="ring" color="#ffe7b0" intensity={2.5} position={[-4, -2, 6]} scale={2} />
    </Environment>
  )
}

/** White softbox studio for clear glass: silver highlights with only a hint of spectrum. */
function GlassStudio() {
  return (
    <Environment resolution={512} frames={1}>
      <color attach="background" args={['#000000']} />
      <Lightformer form="rect" color="#ffffff" intensity={3.2} position={[0, 6, 1]} rotation-x={Math.PI / 2} scale={[12, 4, 1]} />
      <Lightformer form="rect" color="#ffffff" intensity={4.5} position={[-6, 1, 1]} rotation-y={Math.PI / 2} scale={[2, 10, 1]} />
      <Lightformer form="rect" color="#fff2dc" intensity={3} position={[6, 0.5, 1]} rotation-y={-Math.PI / 2} scale={[2.5, 10, 1]} />
      <Lightformer form="rect" color="#ffffff" intensity={2.2} position={[0, 0, -7]} scale={[10, 1.4, 1]} />
      <Lightformer form="rect" color="#ffffff" intensity={0.6} position={[0, -1, 9]} scale={[14, 6, 1]} />
      <Lightformer form="rect" color="#ff6fb5" intensity={1.4} position={[-4, -4, -3]} rotation-y={Math.PI / 4} scale={[0.6, 6, 1]} />
      <Lightformer form="rect" color="#6fe0ff" intensity={1.4} position={[4, -4, -3]} rotation-y={-Math.PI / 4} scale={[0.6, 6, 1]} />
    </Environment>
  )
}

/** Warm, low-key studio so the gold crest has real shading and a near-black panel. */
function CrestStudio() {
  return (
    <Environment resolution={512} frames={1}>
      <color attach="background" args={['#050302']} />
      <Lightformer form="rect" color="#fff0d0" intensity={3.2} position={[-5, 5, 6]} scale={[7, 5, 1]} />
      <Lightformer form="rect" color="#ffe1a6" intensity={0.25} position={[0, 0, 10]} scale={[16, 10, 1]} />
      {/* Bright softbox the front faces reflect: gives the gold its highlight-to-shadow sweep. */}
      <Lightformer form="rect" color="#fff4dc" intensity={3.6} position={[4.5, 2.5, 9]} scale={[7, 6, 1]} />
      <Lightformer form="rect" color="#ffffff" intensity={2.5} position={[3, -3, 8]} rotation-z={0.6} scale={[10, 0.8, 1]} />
      <Lightformer form="rect" color="#ffffff" intensity={5} position={[6, 1, 2]} rotation-y={-Math.PI / 2.2} scale={[1.2, 10, 1]} />
      <Lightformer form="rect" color="#ffd27a" intensity={4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 1.2, 1]} />
      <Lightformer form="rect" color="#ffb347" intensity={2} position={[-6, -3, 1]} rotation-y={Math.PI / 2.2} scale={[1, 8, 1]} />
    </Environment>
  )
}

function Spinner({ children, spin }: { children: React.ReactNode; spin: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state, delta) => {
    if (!spin || !ref.current) return
    ref.current.rotation.y += delta * 0.25
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.08
  })
  return <group ref={ref}>{children}</group>
}

export type HoloSceneProps = {
  shape: HoloShape
  finish?: HoloFinish
  rotation?: [number, number, number]
  spin?: boolean
  pose?: HandPose
  inflate?: number
  onReady?: () => void
}

export function HoloScene({ shape, finish = 'chrome', rotation = [0, 0, 0], spin = false, pose = defaultPose, inflate = 0, onReady }: HoloSceneProps) {
  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial(finishes[finish] ?? finishes.chrome)
    if (!finishes[finish]) m.name = 'debug'
    return m
  }, [finish])
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 12], fov: 28 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        gl.setClearColor(0x000000, 0)
      }}
    >
      <ambientLight intensity={0.15} />
      <Suspense fallback={null}>
        {isGlass(shape) ? <GlassStudioEnv /> : shape === 'crest' ? <CrestStudio /> : <SpectrumStudio finish={finish} />}
        <Bounds fit clip margin={1.08}>
          <Spinner spin={spin}>
            <group rotation={rotation}>
              <Shape shape={shape} material={material} pose={pose} inflate={inflate} />
            </group>
          </Spinner>
        </Bounds>
        <ReadySignal onReady={onReady} />
      </Suspense>
    </Canvas>
  )
}

function ReadySignal({ onReady }: { onReady?: () => void }) {
  const frames = useRef(0)
  useFrame(() => {
    frames.current += 1
    // Give Bounds + the environment a few frames to settle.
    if (frames.current === 12) onReady?.()
  })
  return null
}
