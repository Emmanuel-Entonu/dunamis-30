'use client'

import { Center, Text3D } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

const SERIF = '/fonts/cinzel-800.typeface.json'

/** Shield outline: pointed roof, square shoulders, V base — after the official 30th-anniversary badge. */
function shieldPoints(scale: number) {
  const p: [number, number][] = [
    [0, 1.42],
    [1.22, 1.08],
    [1.22, -0.42],
    [0, -1.5],
    [-1.22, -0.42],
    [-1.22, 1.08],
  ]
  return p.map(([x, y]) => new THREE.Vector2(x * scale, y * scale))
}

const shape = (pts: THREE.Vector2[]) => new THREE.Shape(pts)

const extrude = (s: THREE.Shape, depth: number, bevel: number) =>
  new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.7, bevelSegments: 8, curveSegments: 24 })

export type CrestMaterials = { gold: THREE.Material; cream: THREE.Material; panel: THREE.Material }

export function useCrestMaterials(): CrestMaterials {
  return useMemo(
    () => ({
      gold: new THREE.MeshPhysicalMaterial({
        color: '#f7b84b',
        metalness: 1,
        roughness: 0.16,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        iridescence: 0.35,
        iridescenceIOR: 1.5,
        envMapIntensity: 1.7,
      }),
      cream: new THREE.MeshPhysicalMaterial({ color: '#fff3d8', metalness: 1, roughness: 0.22, clearcoat: 1, envMapIntensity: 1.3 }),
      panel: new THREE.MeshPhysicalMaterial({
        color: '#050507',
        metalness: 0.1,
        roughness: 0.45,
        envMapIntensity: 0.35,
      }),
    }),
    [],
  )
}

function Line({ text, y, z, size, depth, material, spacing = 0 }: { text: string; y: number; z: number; size: number; depth: number; material: THREE.Material; spacing?: number }) {
  return (
    <Center position={[0, y, z]} disableZ>
      <Text3D
        font={SERIF}
        size={size}
        height={depth}
        curveSegments={16}
        bevelEnabled
        bevelThickness={depth * 0.25}
        bevelSize={size * 0.025}
        bevelSegments={5}
        letterSpacing={spacing}
        material={material}
      >
        {text}
      </Text3D>
    </Center>
  )
}

export function Crest() {
  const m = useCrestMaterials()
  const { rim, panel } = useMemo(() => {
    const outer = shieldPoints(1)
    const inner = shieldPoints(0.9)
    const rimShape = shape(outer)
    rimShape.holes.push(new THREE.Path([...inner].reverse()))
    return { rim: extrude(rimShape, 0.34, 0.07), panel: extrude(shape(inner), 0.22, 0.04) }
  }, [])

  return (
    <group>
      <mesh geometry={rim} material={m.gold} />
      <mesh geometry={panel} material={m.panel} position={[0, 0, 0.02]} />
      <Line text="DUNAMIS INT'L GOSPEL" y={0.85} z={0.36} size={0.128} depth={0.05} material={m.cream} spacing={0.01} />
      <Line text="CENTRE" y={0.64} z={0.36} size={0.128} depth={0.05} material={m.cream} spacing={0.02} />
      <Line text="30" y={-0.12} z={0.42} size={1.55} depth={0.42} material={m.gold} spacing={-0.06} />
      <group position={[1.32, 0.52, 0.46]}>
        <Line text="TH" y={0} z={0} size={0.36} depth={0.14} material={m.gold} />
      </group>
      <Line text="ANNIVERSARY" y={-0.72} z={0.9} size={0.17} depth={0.06} material={m.cream} spacing={0.035} />
      <Line text="1996 – 2026" y={-1.0} z={0.38} size={0.15} depth={0.05} material={m.cream} spacing={0.03} />
    </group>
  )
}
