'use client'

import { Button, useDocumentInfo, useForm, useFormFields, useFormProcessing } from '@payloadcms/ui'
import { useEffect, useRef, useState } from 'react'

/**
 * The decision on a submission: one click sets the status and saves, keeping any corrections the
 * reviewer has just made to the words. Shown above and below the content, so a long testimony
 * doesn't mean scrolling back up.
 */
export function ReviewActions({ basePath }: { basePath: string }) {
  const { id, savedDocumentData } = useDocumentInfo()
  const { dispatchFields, submit } = useForm()
  const processing = useFormProcessing()
  const status = useFormFields(([fields]) => fields.status?.value as string | undefined)
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined)
  const [target, setTarget] = useState<string | null>(null)
  // What's really stored, not what the form holds: a reviewer must never be told it's live before it is.
  const saved = (savedDocumentData?.status as string | undefined) ?? status

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
  const busy = Boolean(target) || processing

  return (
    <div className={`review-decision review-decision--${saved}`}>
      <div>
        <p className="review-decision__state">
          {target ? 'Saving…' : saved === 'approved' ? 'On the website' : saved === 'rejected' ? 'Rejected' : 'Waiting for your review'}
        </p>
        <p className="review-decision__text">
          {saved === 'approved' ? (
            slug ? (
              <a href={`${basePath}/${slug}`} target="_blank" rel="noopener noreferrer">
                See it on the website
              </a>
            ) : (
              'Anyone can see this on the website.'
            )
          ) : saved === 'rejected' ? (
            'This is not on the website. You can still approve it.'
          ) : (
            'Approve puts it on the website straight away. Reject keeps it off.'
          )}
        </p>
      </div>
      <div className="review-decision__buttons">
        {saved !== 'approved' && (
          <Button buttonStyle="primary" margin={false} disabled={busy} onClick={() => choose('approved')}>
            Approve
          </Button>
        )}
        {saved !== 'rejected' && (
          <Button buttonStyle="secondary" margin={false} disabled={busy} onClick={() => choose('rejected')}>
            {saved === 'approved' ? 'Take it off the website' : 'Reject'}
          </Button>
        )}
      </div>
    </div>
  )
}
