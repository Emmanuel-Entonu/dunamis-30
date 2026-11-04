'use client'

import { HoloScene, type HoloFinish, type HoloShape } from '@/components/three/HoloScene'
import type { HandPose } from '@/components/three/GlassHand'
import { PrismScene } from '@/components/three/Prism'

export function RenderLab({
  shape,
  finish,
  rotation,
  pose,
  inflate,
}: {
  shape: string
  finish: string
  rotation: [number, number, number]
  pose: HandPose
  inflate: number
}) {
  const onReady = () => ((window as unknown as { __ready: boolean }).__ready = true)
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      {shape.startsWith('p-') ? (
        <PrismScene shape={shape.slice(2)} finish={finish} rotation={rotation} onReady={onReady} />
      ) : (
        <HoloScene shape={shape as HoloShape} finish={finish as HoloFinish} rotation={rotation} pose={pose} inflate={inflate} onReady={onReady} />
      )}
    </div>
  )
}
