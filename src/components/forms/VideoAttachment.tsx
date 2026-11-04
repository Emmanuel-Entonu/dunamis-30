'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { inspectVideo, MAX_VIDEO_SECONDS, prepareVideo, uploadVideo, VideoProblem, type PreparedVideo, type VideoDetails } from '@/lib/videoPipeline'
import type { VideoTicket } from '@/lib/videoStorage'
import { Play } from '../icons'
import { Field } from './Field'

type Stage = { kind: 'idle' } | { kind: 'preparing'; share: number } | { kind: 'uploading'; share: number } | { kind: 'failed'; message: string }

export type SentVideo = { path: string; proof: string; width: number; height: number; durationSec: number }

const formatLength = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`
const formatSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${Math.round(bytes / (1024 * 1024))} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

/** Holds one picked video through compressing and uploading, so a retry never repeats finished work. */
export function useVideoAttachment() {
  const [file, setFile] = useState<File | null>(null)
  const [details, setDetails] = useState<VideoDetails | null>(null)
  const [cover, setCover] = useState('')
  const [note, setNote] = useState('')
  const [reading, setReading] = useState(false)
  const [stage, setStage] = useState<Stage>({ kind: 'idle' })
  const work = useRef<{ prepared?: PreparedVideo; ticket?: VideoTicket; sent?: SentVideo; resume: { url?: string | null } }>({ resume: {} })
  const abort = useRef<AbortController | null>(null)

  useEffect(() => () => void (cover && URL.revokeObjectURL(cover)), [cover])
  useEffect(() => () => abort.current?.abort(), [])

  const clear = useCallback(() => {
    abort.current?.abort()
    work.current = { resume: {} }
    setFile(null)
    setDetails(null)
    setCover('')
    setNote('')
    setStage({ kind: 'idle' })
  }, [])

  const pick = useCallback(
    async (picked?: File) => {
      if (!picked) return
      clear()
      if (picked.type && !picked.type.startsWith('video/')) {
        setNote('Please choose a video file.')
        return
      }
      setReading(true)
      try {
        const info = await inspectVideo(picked)
        if (info.durationSec > MAX_VIDEO_SECONDS) {
          setNote(`That video is ${formatLength(info.durationSec)} long. Please choose one under ${MAX_VIDEO_SECONDS / 60} minutes.`)
          return
        }
        setFile(picked)
        setDetails(info)
        if (info.poster) setCover(URL.createObjectURL(info.poster))
      } catch (error) {
        setNote(error instanceof VideoProblem ? error.message : 'We couldn’t open that video. Please try an MP4 or MOV file.')
      } finally {
        setReading(false)
      }
    },
    [clear],
  )

  /** Compresses and uploads. Returns the stored video, or null if it failed or was cancelled. */
  const send = useCallback(
    async (ticket?: VideoTicket): Promise<SentVideo | null> => {
      if (work.current.sent) return work.current.sent
      if (!file || !details) return null
      if (ticket) work.current.ticket = ticket
      const activeTicket = work.current.ticket
      if (!activeTicket) return null
      const controller = new AbortController()
      abort.current = controller
      try {
        if (!work.current.prepared) {
          setStage({ kind: 'preparing', share: 0 })
          work.current.prepared = await prepareVideo(file, details, activeTicket.maxBytes, (share) => setStage({ kind: 'preparing', share }), controller.signal)
        }
        const prepared = work.current.prepared
        setStage({ kind: 'uploading', share: 0 })
        await uploadVideo(prepared, activeTicket, (share) => setStage({ kind: 'uploading', share }), controller.signal, work.current.resume)
        work.current.sent = { path: activeTicket.path, proof: activeTicket.proof, width: prepared.width, height: prepared.height, durationSec: prepared.durationSec }
        setStage({ kind: 'idle' })
        return work.current.sent
      } catch (error) {
        if (error instanceof VideoProblem && error.cancelled) {
          setStage({ kind: 'idle' })
          return null
        }
        setStage({
          kind: 'failed',
          message: error instanceof VideoProblem ? error.message : 'Your video didn’t finish uploading. This is usually a weak connection. Try again and it will pick up where it stopped.',
        })
        return null
      }
    },
    [file, details],
  )

  const cancel = useCallback(() => abort.current?.abort(), [])

  return {
    file,
    details,
    cover,
    note,
    reading,
    stage,
    pick,
    clear,
    send,
    cancel,
    /** True once this video has a ticket, so a retry doesn't need another. */
    hasTicket: () => Boolean(work.current.ticket),
    poster: details?.poster ?? null,
    working: stage.kind === 'preparing' || stage.kind === 'uploading',
  }
}

export type VideoAttachment = ReturnType<typeof useVideoAttachment>

/** Adds a stored video's details to a form submission. */
export function addVideoToForm(data: FormData, video: VideoAttachment, sent: SentVideo) {
  data.set('videoPath', sent.path)
  data.set('videoProof', sent.proof)
  data.set('videoWidth', String(sent.width))
  data.set('videoHeight', String(sent.height))
  data.set('videoDuration', String(sent.durationSec))
  if (video.poster) data.set('poster', new File([video.poster], 'cover.jpg', { type: 'image/jpeg' }))
}

/** The picker: a small cover from the video, its length and size, and buttons to change or remove it. */
export function VideoField({ video, label, hint, error }: { video: VideoAttachment; label: string; hint: string; error?: string }) {
  const input = useRef<HTMLInputElement>(null)
  const { file, details, cover, note, reading, working } = video
  return (
    <Field name="video" label={label} error={error ?? note} hint={file ? undefined : hint}>
      <div className="flex items-center gap-4">
        <div className="relative grid size-[64px] shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-hair">
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
          {cover && <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          {file ? <Play width={18} height={18} className="relative text-fg" /> : <span className="text-xs">None</span>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {file && details && (
            <p className="truncate text-sm text-fg">
              {formatLength(details.durationSec)} · {formatSize(file.size)}
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" disabled={reading || working} onClick={() => input.current?.click()} className="btn btn-outline !min-h-[44px] flex-1 disabled:opacity-60">
              {reading ? 'Reading your video…' : file ? 'Change' : 'Add a video'}
            </button>
            {file && (
              <button type="button" disabled={working} onClick={video.clear} className="btn btn-outline !min-h-[44px] flex-1 disabled:opacity-60">
                Remove
              </button>
            )}
          </div>
        </div>
        <input
          id="video"
          ref={input}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event) => {
            void video.pick(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>
    </Field>
  )
}

/** Shows the video's progress beside the submit button, and what to do if it fails. */
export function VideoProgress({ video, onRetry, onSendWithout, withoutLabel }: { video: VideoAttachment; onRetry: () => void; onSendWithout: () => void; withoutLabel: string }) {
  const { stage } = video
  if (stage.kind === 'idle') return null

  if (stage.kind === 'failed') {
    return (
      <div role="alert" className="mt-6 rounded-lg border border-[#ff8a7a]/40 bg-[#ff8a7a]/10 p-4 text-[15px] text-[#ffb3a8]">
        <p>{stage.message}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={onRetry} className="btn btn-primary !min-h-[44px]">
            Try again
          </button>
          <button type="button" onClick={onSendWithout} className="btn btn-outline !min-h-[44px]">
            {withoutLabel}
          </button>
        </div>
      </div>
    )
  }

  const percent = Math.round(stage.share * 100)
  return (
    <div role="status" aria-live="polite" className="mt-6 rounded-lg border border-line bg-hair p-4">
      <div className="flex items-baseline justify-between gap-3 text-[15px] text-fg">
        <span>{stage.kind === 'preparing' ? 'Getting your video ready' : 'Uploading your video'}</span>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-sm bg-line">
        <div className="h-full rounded-sm bg-gold transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm">Please keep this page open{stage.kind === 'preparing' ? ' while we make it smaller.' : '. If your signal drops, it will carry on when it returns.'}</p>
        <button type="button" onClick={video.cancel} className="shrink-0 text-sm text-fg underline underline-offset-2">
          Cancel
        </button>
      </div>
    </div>
  )
}
