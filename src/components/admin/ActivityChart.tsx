'use client'

import { useRef, useState, type KeyboardEvent } from 'react'

import type { ChartDay } from '@/lib/overview'

/** Round numbers for the scale. It never drops below four, so a single submission doesn't fill the whole chart. */
function scale(highest: number) {
  const value = Math.max(highest, 4)
  const size = 10 ** Math.floor(Math.log10(value))
  const step = [0.1, 0.2, 0.5, 1, 2, 5].map((n) => Math.max(1, n * size)).find((n) => value / n <= 4) ?? size * 2
  const top = Math.ceil(value / step) * step
  return { top, ticks: Array.from({ length: top / step + 1 }, (_, i) => i * step) }
}

const parts = (day: ChartDay) => [
  { label: 'Testimonies', value: day.testimonies },
  { label: 'International guests', value: day.guests },
  { label: 'Sons of the Prophet', value: day.stories },
]

const spoken = (day: ChartDay) =>
  `${day.label}: ${day.total} received${
    day.total
      ? `, ${parts(day)
          .filter((part) => part.value)
          .map((part) => `${part.value} ${part.label}`)
          .join(', ')}`
      : ''
  }`

/** One column for each day. Point at one, tap it, or use the arrow keys to see what came in. */
export function ActivityChart({ days }: { days: ChartDay[] }) {
  const { top, ticks } = scale(Math.max(...days.map((day) => day.total)))
  const [active, setActive] = useState<number | null>(null)
  const [cursor, setCursor] = useState(days.length - 1)
  const columns = useRef<(HTMLButtonElement | null)[]>([])
  const nothing = days.every((day) => day.total === 0)
  const shown = active === null ? null : days[active]

  const move = (event: KeyboardEvent, index: number) => {
    const next = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? days.length - 1 : null
    if (next === null || next < 0 || next >= days.length) return
    event.preventDefault()
    setCursor(next)
    columns.current[next]?.focus()
  }

  // Dates along the bottom: evenly spaced, always ending on today.
  const every = Math.ceil(days.length / 5)
  const marks = days.map((_, i) => i).filter((i) => (days.length - 1 - i) % every === 0)

  return (
    <div className="ac" onPointerLeave={() => setActive(null)}>
      <div aria-hidden className="ac-y">
        {ticks.map((tick) => (
          <span key={tick} style={{ bottom: `${(tick / top) * 100}%` }}>
            {tick}
          </span>
        ))}
      </div>

      <div className="ac-plot">
        {ticks.map((tick) => (
          <i key={tick} aria-hidden className="ac-line" style={{ bottom: `${(tick / top) * 100}%` }} />
        ))}

        <div role="group" aria-label="Submissions received each day" className="ac-columns">
          {days.map((day, i) => (
            <button
              key={day.key}
              ref={(node) => {
                columns.current[i] = node
              }}
              type="button"
              tabIndex={i === cursor ? 0 : -1}
              aria-label={spoken(day)}
              onPointerEnter={() => setActive(i)}
              onClick={() => setActive(i)}
              onFocus={() => {
                setCursor(i)
                setActive(i)
              }}
              onBlur={() => setActive(null)}
              onKeyDown={(event) => move(event, i)}
              className={`ac-col${active === i ? ' ac-col--on' : ''}`}
            >
              <span className={day.total ? 'ac-bar' : 'ac-bar ac-bar--none'} style={day.total ? { height: `${(day.total / top) * 100}%` } : undefined} />
            </button>
          ))}
        </div>

        {nothing && <p className="ac-empty">Nothing has come in during the last 30 days</p>}

        {shown && active !== null && (
          <div aria-hidden className={`ac-tip${active > days.length * 0.62 ? ' ac-tip--left' : ''}`} style={{ left: `${((active + 0.5) / days.length) * 100}%` }}>
            <p className="ac-tip__day">{shown.label}</p>
            <p className="ac-tip__total">
              <strong>{shown.total}</strong> received
            </p>
            {shown.total > 0 && (
              <ul>
                {parts(shown)
                  .filter((part) => part.value)
                  .map((part) => (
                    <li key={part.label}>
                      <strong>{part.value}</strong> {part.label}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div aria-hidden className="ac-x">
        {marks.map((i) => (
          <span key={days[i].key} className={i === days.length - 1 ? 'ac-x__end' : undefined} style={{ left: `${((i + 0.5) / days.length) * 100}%` }}>
            {i === days.length - 1 ? 'Today' : days[i].label}
          </span>
        ))}
      </div>
    </div>
  )
}
