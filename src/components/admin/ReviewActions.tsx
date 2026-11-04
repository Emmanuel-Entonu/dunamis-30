'use client'

import { Button, useDocumentInfo, useForm, useFormFields } from '@payloadcms/ui'
import { useEffect, useRef, useState } from 'react'

/**
 * Sidebar shortcut on a submission: one click sets the status and saves, keeping any edits
 * the reviewer has just made to the text.
 */
export function ReviewActions({ basePath }: { basePath: string }) {
  const { id } = useDocumentInfo()
  const { dispatchFields, submit } = useForm()
  const status = useFormFields(([fields]) => fields.status?.value as string | undefined)
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined)
  const [target, setTarget] = useState<string | null>(null)

  // Submit only once the form state holds the new status, and only once. The buttons stay disabled until it's saved.
  const saving = useRef(false)
  useEffect(() => {
    if (!target || status !== target || saving.current) return
    saving.current = true
    void Promise.resolve(submit()).finally(() => {
      saving.current = false
      setTarget(null)
    })
  }, [status, target, submit])

  if (!id) return null

  const choose = (value: 'approved' | 'rejected') => {
    setTarget(value)
    dispatchFields({ type: 'UPDATE', path: 'status', value })
  }

  return (
    <div style={{ marginBottom: 'calc(var(--base) * 1.5)' }}>
      <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Review</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button buttonStyle="primary" size="small" margin={false} disabled={status === 'approved' || Boolean(target)} onClick={() => choose('approved')}>
          Approve
        </Button>
        <Button buttonStyle="secondary" size="small" margin={false} disabled={status === 'rejected' || Boolean(target)} onClick={() => choose('rejected')}>
          Reject
        </Button>
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 13, opacity: 0.75 }}>
        {status === 'approved' ? (
          slug ? (
            <a href={`${basePath}/${slug}`} target="_blank" rel="noopener noreferrer">
              Live on the website. View it
            </a>
          ) : (
            'Live on the website.'
          )
        ) : status === 'rejected' ? (
          'Rejected. Not shown on the website.'
        ) : (
          'Pending. Approving publishes it straight away.'
        )}
      </p>
    </div>
  )
}
