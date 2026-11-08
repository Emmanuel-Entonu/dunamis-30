'use client'

import { Button, useDocumentInfo, useField } from '@payloadcms/ui'
import { useEffect, useRef, useState } from 'react'

import { inspectVideo, MAX_DASHBOARD_VIDEO_SECONDS, prepareVideo, uploadVideo } from '@/lib/videoPipeline'
import type { VideoTicket } from '@/lib/videoStorage'

const length = (seconds?: number | null) =>
  seconds
    ? `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`
    : null
const size = (bytes?: number | null) =>
  bytes ? `${Math.max(1, Math.round(bytes / (1024 * 1024)))} MB` : null

/**
 * In a testimony or story: watch the video before approving it. Changing it is tucked away underneath.
 * A saved video plays from a temporary link the page asks for itself. Pointing the player at the protected
 * address would rely on the browser sending the login along with the video, which not every phone does.
 */
export function VideoReview({
  kind,
  startOpen = false,
}: {
  kind: 'testimony' | 'story'
  startOpen?: boolean
}) {
  const { id, collectionSlug } = useDocumentInfo()
  const path = useField<string | null>({ path: 'videoFile.path' })
  const sizeBytes = useField<number | null>({ path: 'videoFile.sizeBytes' })
  const durationSec = useField<number | null>({ path: 'videoFile.durationSec' })
  const width = useField<number | null>({ path: 'videoFile.width' })
  const height = useField<number | null>({ path: 'videoFile.height' })
  const poster = useField<number | null>({ path: 'videoPoster' })
  const input = useRef<HTMLInputElement>(null)
  const [savedPath] = useState(path.value)
  const [localUrl, setLocalUrl] = useState('')
  const [status, setStatus] = useState('')
  const [problem, setProblem] = useState('')
  const [playable, setPlayable] = useState(true)
  const [signedUrl, setSignedUrl] = useState('')
  const [linkFailed, setLinkFailed] = useState(false)

  useEffect(() => () => void (localUrl && URL.revokeObjectURL(localUrl)), [localUrl])

  useEffect(() => {
    if (!id || !savedPath) return
    let live = true
    fetch(`/watch/${kind}/${id}?link=1`, { credentials: 'include', cache: 'no-store' })
      .then((res) =>
        res.ok
          ? (res.json() as Promise<{ url: string }>)
          : Promise.reject(new Error(String(res.status))),
      )
      .then(({ url }) => {
        if (live) setSignedUrl(url)
      })
      .catch(() => {
        if (live) setLinkFailed(true)
      })
    return () => {
      live = false
    }
  }, [id, kind, savedPath])

  const upload = async (file?: File) => {
    if (!file) return
    setProblem('')
    setPlayable(true)
    const controller = new AbortController()
    try {
      setStatus('Reading the video…')
      const details = await inspectVideo(file)
      if (details.durationSec > MAX_DASHBOARD_VIDEO_SECONDS)
        throw new Error(
          `That video is too long. Please use one under ${MAX_DASHBOARD_VIDEO_SECONDS / 60} minutes.`,
        )

      const res = await fetch(`/api/${collectionSlug}/video-ticket`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('You don’t have permission to upload videos.')
      const ticket = (await res.json()) as VideoTicket

      const prepared = await prepareVideo(
        file,
        details,
        ticket.maxBytes,
        (share) => setStatus(`Getting it ready… ${Math.round(share * 100)}%`),
        controller.signal,
      )
      await uploadVideo(
        prepared,
        ticket,
        (share) => setStatus(`Uploading… ${Math.round(share * 100)}%`),
        controller.signal,
        {},
      )

      if (details.poster) {
        const form = new FormData()
        form.set(
          'file',
          new File([details.poster], `${ticket.path.split('/').pop()}.jpg`, { type: 'image/jpeg' }),
        )
        form.set(
          '_payload',
          JSON.stringify({
            alt: 'Cover of a video testimony',
            pendingReview: true,
            fromSubmission: true,
          }),
        )
        const saved = await fetch('/api/media', {
          method: 'POST',
          credentials: 'include',
          body: form,
        })
        if (saved.ok) poster.setValue(((await saved.json()) as { doc: { id: number } }).doc.id)
      }

      path.setValue(ticket.path)
      sizeBytes.setValue(prepared.blob.size)
      durationSec.setValue(Math.round(prepared.durationSec))
      width.setValue(prepared.width)
      height.setValue(prepared.height)
      setLocalUrl(URL.createObjectURL(prepared.blob))
      setStatus('Uploaded. Press Save to keep it.')
    } catch (error) {
      setStatus('')
      setProblem(
        error instanceof Error
          ? error.message
          : 'The video couldn’t be uploaded. Please try again.',
      )
    }
  }

  const remove = () => {
    path.setValue(null)
    sizeBytes.setValue(null)
    durationSec.setValue(null)
    width.setValue(null)
    height.setValue(null)
    poster.setValue(null)
    setLocalUrl('')
    setProblem('')
    setStatus('Removed. Press Save to delete it for good.')
  }

  // A new video plays from this computer until it's saved.
  const saved = Boolean(path.value && path.value === savedPath && id)
  const source = localUrl || (saved ? signedUrl : '')
  const facts = [length(durationSec.value), size(sizeBytes.value)].filter(Boolean).join(' · ')

  return (
    <section className="review-block">
      {path.value ? <h3>{startOpen ? 'The video' : 'Their video'}</h3> : null}
      {source ? (
        <>
          {/* Reviewers watch the original recording. Captions don't exist at this stage. */}
          <video
            key={source}
            src={source}
            controls
            playsInline
            preload="metadata"
            onError={() => setPlayable(false)}
            onLoadedMetadata={() => setPlayable(true)}
            style={{
              display: 'block',
              width: '100%',
              maxWidth: 560,
              maxHeight: 460,
              borderRadius: 12,
              background: '#000',
            }}
          />
          {facts && <p style={{ margin: '8px 0 0', fontSize: 13, opacity: 0.75 }}>{facts}</p>}
          {!playable && (
            <p className="review-problem">
              This video won’t play here.{' '}
              <a href={source} target="_blank" rel="noopener noreferrer">
                Try opening it on its own
              </a>
              . If that doesn’t work either, ask the person to send it again before approving it.
            </p>
          )}
        </>
      ) : saved && linkFailed ? (
        <p className="review-problem">
          The video couldn’t be loaded just now. Please check your connection and reload this page.
        </p>
      ) : saved ? (
        <p className="review-muted">Loading the video…</p>
      ) : null}
      {!saved && (
        <details className="review-tools" open={startOpen}>
          <summary>
            {path.value
              ? 'Change or remove this video'
              : startOpen
                ? 'A video (optional)'
                : 'Add a video someone sent you'}
          </summary>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <Button
              buttonStyle="secondary"
              size="small"
              margin={false}
              disabled={Boolean(status) && /…/.test(status)}
              onClick={() => input.current?.click()}
            >
              {path.value ? 'Replace video' : 'Choose a video'}
            </Button>
            {path.value && (
              <Button
                buttonStyle="secondary"
                size="small"
                margin={false}
                disabled={Boolean(status) && /…/.test(status)}
                onClick={remove}
              >
                Remove video
              </Button>
            )}
          </div>
        </details>
      )}
      <input
        ref={input}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={(event) => {
          void upload(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      {status && <p style={{ margin: '8px 0 0', fontSize: 13 }}>{status}</p>}
      {problem && <p className="review-problem">{problem}</p>}
    </section>
  )
}
