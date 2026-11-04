'use client'

import { useEffect, useState } from 'react'

import { Reveal } from './Reveal'

type Parts = { days: number; hours: number; minutes: number; seconds: number }

const diff = (target: number): Parts | null => {
  const ms = target - Date.now()
  if (ms <= 0) return null
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor(ms / 3_600_000) % 24,
    minutes: Math.floor(ms / 60_000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
  }
}

const units: { key: keyof Parts; label: string }[] = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Seconds' },
]

function useCountdown(startsAt: string) {
  const target = new Date(startsAt).getTime()
  // undefined until mounted, so server and client markup match.
  const [parts, setParts] = useState<Parts | null | undefined>(undefined)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock can only be read after hydration, see above.
    setParts(diff(target))
    const id = window.setInterval(() => setParts(diff(target)), 1000)
    return () => window.clearInterval(id)
  }, [target])
  return parts
}

const pad = (n: number | undefined) => (n === undefined ? '--' : String(n).padStart(2, '0'))

/** One number on a flip clock: a paper leaf folds down over the old number to show the new one. */
function FlipUnit({ value, label }: { value: string; label: string }) {
  const [previous, setPrevious] = useState(value)
  useEffect(() => {
    if (previous === value) return
    const id = window.setTimeout(() => setPrevious(value), 680)
    return () => window.clearTimeout(id)
  }, [value, previous])

  return (
    <div>
      <div className="flip" aria-hidden>
        <span className="flip-half flip-top">
          <span>{value}</span>
        </span>
        <span className="flip-half flip-bottom">
          <span>{previous}</span>
        </span>
        {previous !== value && (
          <>
            <span key={`down-${value}`} className="flip-half flip-top flip-leaf-down">
              <span>{previous}</span>
            </span>
            <span key={`up-${value}`} className="flip-half flip-bottom flip-leaf-up">
              <span>{value}</span>
            </span>
          </>
        )}
      </div>
      <p className="mt-3 text-[13px] text-muted sm:text-base">{label}</p>
    </div>
  )
}

/** The flip clock. Each number fades in, one after another. */
export function FlipCountdown({ startsAt, label, endedText }: { startsAt: string; label: string; endedText: string }) {
  const parts = useCountdown(startsAt)
  if (parts === null) return <p className="text-3xl font-medium text-gold-light sm:text-5xl">{endedText}</p>
  return (
    <div role="timer" aria-label={label} className="grid grid-cols-4 gap-2.5 sm:gap-5">
      {units.map(({ key, label }, i) => (
        <Reveal key={key} delay={i * 120}>
          <FlipUnit value={pad(parts?.[key])} label={label} />
        </Reveal>
      ))}
    </div>
  )
}
