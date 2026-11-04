'use client'

import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js'

import { GlassMaterial } from './GlassKit'

// Rigged hand from @webxr-input-profiles/assets (MIT, © Amazon) — see public/models/LICENSE-webxr-generic-hand.md.
// Left hand: palm up with fingers to the right puts the thumb behind the palm, framing what it holds.
const HAND_URL = '/models/hand-left.glb'

export type HandPose = {
  /** Finger flex toward the palm, radians per joint. */
  curl: number
  /** Fan the fingers apart, radians between neighbours. */
  spread: number
  /** Thumb flex, radians. */
  thumb: number
}

const fingers = ['index-finger', 'middle-finger', 'ring-finger', 'pinky-finger'] as const

/**
 * Taubin (λ|μ) smoothing: irons out the base mesh's knuckle ridges, which read as lumps
 * in glass, without the shrinkage plain Laplacian smoothing causes.
 */
function taubinSmooth(geometry: THREE.BufferGeometry, iterations: number, lambda = 0.5, mu = -0.53) {
  const pos = geometry.attributes.position as THREE.BufferAttribute
  const index = geometry.index!
  const neighbours: Set<number>[] = Array.from({ length: pos.count }, () => new Set())
  for (let i = 0; i < index.count; i += 3) {
    const [a, b, c] = [index.getX(i), index.getX(i + 1), index.getX(i + 2)]
    neighbours[a].add(b).add(c)
    neighbours[b].add(a).add(c)
    neighbours[c].add(a).add(b)
  }
  const step = (factor: number) => {
    const next = new Float32Array(pos.array as Float32Array)
    for (let v = 0; v < pos.count; v++) {
      const n = neighbours[v]
      if (!n.size) continue
      let x = 0
      let y = 0
      let z = 0
      for (const j of n) {
        x += pos.getX(j)
        y += pos.getY(j)
        z += pos.getZ(j)
      }
      next[v * 3] += factor * (x / n.size - pos.getX(v))
      next[v * 3 + 1] += factor * (y / n.size - pos.getY(v))
      next[v * 3 + 2] += factor * (z / n.size - pos.getZ(v))
    }
    ;(pos.array as Float32Array).set(next)
  }
  for (let i = 0; i < iterations; i++) {
    step(lambda)
    step(mu)
  }
  pos.needsUpdate = true
}

/**
 * Poses the rigged hand and bakes the skinning into a static, welded mesh.
 * (Loop subdivision was tried and made the glass lumpy — averaged normals on the
 * original topology read much smoother.)
 */
function bakeHand(scene: THREE.Object3D, pose: HandPose, inflate: number) {
  const root = cloneSkinned(scene)
  const bone = (name: string) => root.getObjectByName(name)

  fingers.forEach((finger, i) => {
    // WebXR joint space: -Z runs along the bone, X is the flex axis, Y the spread axis.
    bone(`${finger}-phalanx-proximal`)?.rotateY((i - 1.2) * pose.spread).rotateX(-pose.curl * (0.7 + i * 0.12))
    bone(`${finger}-phalanx-intermediate`)?.rotateX(-pose.curl * (1 + i * 0.15))
    bone(`${finger}-phalanx-distal`)?.rotateX(-pose.curl * 0.8)
  })
  bone('thumb-metacarpal')?.rotateY(0.25)
  bone('thumb-phalanx-proximal')?.rotateX(-pose.thumb * 0.6)
  bone('thumb-phalanx-distal')?.rotateX(-pose.thumb)
  root.updateMatrixWorld(true)

  let skinned: THREE.SkinnedMesh | undefined
  root.traverse((o) => {
    if ((o as THREE.SkinnedMesh).isSkinnedMesh) skinned = o as THREE.SkinnedMesh
  })
  if (!skinned) throw new Error('hand model has no skinned mesh')

  const source = skinned.geometry
  const positions = source.attributes.position
  const baked = new Float32Array(positions.count * 3)
  const v = new THREE.Vector3()
  for (let i = 0; i < positions.count; i++) {
    v.fromBufferAttribute(positions, i)
    skinned.applyBoneTransform(i, v)
    v.applyMatrix4(skinned.matrixWorld)
    baked.set([v.x, v.y, v.z], i * 3)
  }

  let geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(baked, 3))
  geometry.setIndex(source.index!.clone())
  // Weld UV-seam duplicates so normals average across them.
  geometry = mergeVertices(geometry, 1e-5)
  taubinSmooth(geometry, 12)
  geometry.computeVertexNormals()
  geometry.center()
  if (inflate > 0) {
    // Puff the hand along its normals: thick, liquid-glass fingers rather than an anatomical hand.
    geometry.computeBoundingSphere()
    const k = inflate * geometry.boundingSphere!.radius
    const p = geometry.attributes.position as THREE.BufferAttribute
    const n = geometry.attributes.normal as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + n.getX(i) * k, p.getY(i) + n.getY(i) * k, p.getZ(i) + n.getZ(i) * k)
    taubinSmooth(geometry, 14)
    geometry.computeVertexNormals()
  }
  geometry.computeBoundingSphere()
  const s = 2.6 / geometry.boundingSphere!.radius
  geometry.scale(s, s, s)
  return geometry
}

/**
 * Open hand, palm up, offering toward the viewer.
 * The left hand's rest pose has the palm facing -Z and fingers along -Y; the nested groups
 * turn the palm up, swing the fingers to the right (slightly toward camera), then tilt the
 * palm toward the camera so we look into it.
 */
export function GlassHand({ pose, inflate = 0, debug = false }: { pose: HandPose; inflate?: number; debug?: boolean }) {
  const { scene } = useGLTF(HAND_URL)
  const geometry = useMemo(() => bakeHand(scene, pose, inflate), [scene, pose, inflate])

  const mesh = debug ? (
    <mesh geometry={geometry}>
      <meshNormalMaterial />
    </mesh>
  ) : (
    <mesh geometry={geometry}>
      <GlassMaterial thickness={2.6} />
    </mesh>
  )

  return (
    <group rotation={[0.5, 0, 0]}>
      <group rotation={[0, -1.95, 0]}>
        <group rotation={[Math.PI / 2, 0, 0]}>{mesh}</group>
      </group>
      {debug && <axesHelper args={[3]} />}
    </group>
  )
}

useGLTF.preload(HAND_URL)
