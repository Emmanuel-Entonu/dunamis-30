'use client'

import { useState } from 'react'

export function SwitchControl({ initialOpen }: { initialOpen: boolean | null }) {
  const [open, setOpen] = useState(initialOpen)
  const [saving, setSaving] = useState(false)
  const [problem, setProblem] = useState('')

  if (open === null) {
    return (
      <section className="ov-switch">
        <h2>Testimony form</h2>
        <p>This switch will start working when the latest update goes live.</p>
      </section>
    )
  }

  const flip = async () => {
    const next = !open
    setSaving(true)
    setProblem('')
    try {
      const res = await fetch('/api/globals/testimony-settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ formOpen: next }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setOpen(next)
    } catch {
      setProblem('That didn’t save. Please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={`ov-switch${open ? ' ov-switch--on' : ''}`}>
      <div className="ov-switch__top">
        <div>
          <h2>Testimony form is {open ? 'on' : 'off'}</h2>
          <p className="ov-switch__state">
            <i aria-hidden />
            {open ? 'Taking new testimonies' : 'Not taking new testimonies'}
          </p>
        </div>
        <button type="button" role="switch" aria-checked={open} aria-label="Testimony form" disabled={saving} onClick={flip} className="ov-toggle">
          <span />
        </button>
      </div>
      <p>
        {open
          ? 'People can send testimonies from the website. Turn this off to hide the form and stop new ones coming in.'
          : 'The form is hidden and nobody can send a testimony. Testimonies already approved stay on the website.'}
      </p>
      {problem && <p className="ov-switch__problem">{problem}</p>}
    </section>
  )
}
