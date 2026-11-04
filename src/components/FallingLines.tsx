const columns = [
  { left: '12.5%', delay: '0s', only: '' },
  { left: '37.5%', delay: '-1.6s', only: 'hidden sm:block' },
  { left: '62.5%', delay: '-2.7s', only: '' },
  { left: '87.5%', delay: '-0.8s', only: 'hidden sm:block' },
]

/** Thin streaks of light falling down four columns, over the tick pattern. */
export function FallingLines({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {columns.map((c) => (
        <span key={c.left} className={`falling-line ${c.only}`} style={{ left: c.left, animationDelay: c.delay }} />
      ))}
    </div>
  )
}
