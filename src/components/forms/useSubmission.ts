'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'

export type SubmissionState = {
  ok?: boolean
  firstName?: string
  reference?: string
  error?: string
  fieldErrors?: Partial<Record<string, string>>
}

const OFFLINE = 'We couldn’t reach the website. Please check your connection and try again. Everything you typed is still here.'

/** Choices that are never restored: consent must be given fresh, and these fields aren't typed. */
const NOT_SAVED = new Set(['consent', 'leave_empty', 'cf-turnstile-response'])

/**
 * Shared behaviour for the public forms: the submitting state, a clear error when the connection
 * drops, jumping to the first problem, clearing a field's error as it's corrected, and a saved draft
 * so a long testimony survives an accidental reload.
 */
export function useSubmission(draftKey: string, onRestore?: (values: Record<string, string>) => void) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, setState] = useState<SubmissionState>({})
  const [busy, setBusy] = useState(false)
  const saveTimer = useRef(0)
  const storageKey = `dunamis-draft-${draftKey}`

  // Restore a draft once, after the page has loaded.
  useEffect(() => {
    const form = formRef.current
    if (!form) return
    let saved: Record<string, string> = {}
    try {
      saved = JSON.parse(sessionStorage.getItem(storageKey) ?? '{}')
    } catch {
      return
    }
    for (const [name, value] of Object.entries(saved)) {
      const field = form.elements.namedItem(name)
      if (field instanceof RadioNodeList) {
        for (const option of field) if (option instanceof HTMLInputElement) option.checked = option.value === value
      } else if (field instanceof HTMLInputElement && field.type === 'checkbox') {
        field.checked = value === 'on'
      } else if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
        field.value = value
      }
    }
    onRestore?.(saved)
    // Runs once on mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveDraft = useCallback(() => {
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      const form = formRef.current
      if (!form) return
      const values: Record<string, string> = {}
      for (const element of Array.from(form.elements)) {
        if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) continue
        if (!element.name || NOT_SAVED.has(element.name) || element.type === 'file' || element.type === 'hidden') continue
        if (element instanceof HTMLInputElement && element.type === 'radio') {
          if (element.checked) values[element.name] = element.value
        } else if (element instanceof HTMLInputElement && element.type === 'checkbox') {
          values[element.name] = element.checked ? 'on' : 'off'
        } else if (element.value) {
          values[element.name] = element.value
        }
      }
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(values))
      } catch {
        // Private browsing can refuse storage. The form still works without a draft.
      }
    }, 400)
  }, [storageKey])

  useEffect(() => () => window.clearTimeout(saveTimer.current), [])

  /** Wire to the form's onChange: saves the draft and clears that field's error as it's corrected. */
  const onFormChange = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      saveDraft()
      const name = (event.target as HTMLInputElement).name
      setState((current) => {
        if (!name || !current.fieldErrors?.[name]) return current
        const fieldErrors = { ...current.fieldErrors }
        delete fieldErrors[name]
        return { ...current, fieldErrors }
      })
    },
    [saveDraft],
  )

  const show = useCallback(
    (next: SubmissionState) => {
      setState(next)
      if (next.ok) {
        window.clearTimeout(saveTimer.current)
        try {
          sessionStorage.removeItem(storageKey)
        } catch {
          // Nothing to clear.
        }
      }
      if (next.fieldErrors && Object.keys(next.fieldErrors).length) {
        // After React has marked the fields, move to the first one with a problem.
        requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')?.focus())
      }
    },
    [storageKey],
  )

  /** Runs a submission step and turns a dropped connection into a clear message. */
  const attempt = useCallback(
    async <T extends SubmissionState>(step: () => Promise<T>): Promise<T | null> => {
      try {
        return await step()
      } catch (error) {
        console.error('[form] submission failed', error)
        show({ error: OFFLINE })
        return null
      }
    },
    [show],
  )

  return { formRef, state, show, busy, setBusy, onFormChange, attempt }
}

/** The line beside the submit button when something needs fixing. */
export const needsFixing = (state: SubmissionState) => Boolean(state.fieldErrors && Object.keys(state.fieldErrors).length)
