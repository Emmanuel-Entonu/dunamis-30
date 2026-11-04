'use client'

import { useEffect, useState } from 'react'

import { Facebook, Link2, Share, WhatsApp, XLogo } from './icons'

export function ShareButtons({
  url,
  text,
  className = '',
  compact = false,
}: {
  /** Absolute URL or a path on this site. */
  url: string
  text: string
  className?: string
  compact?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)
  useEffect(() => setCanNativeShare('share' in navigator), [])
  const absolute = () => new URL(url, window.location.origin).toString()

  const open = (target: (u: string, t: string) => string) => {
    window.open(target(encodeURIComponent(absolute()), encodeURIComponent(text)), '_blank', 'noopener,noreferrer,width=640,height=560')
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title: 'Dunamis at 30', text, url: absolute() })
    } catch {
      /* dismissed */
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(absolute())
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const btn = `grid place-items-center rounded-lg border border-line bg-surface text-fg transition-colors hover:border-gold hover:text-gold-light ${
    compact ? 'size-9' : 'size-11'
  }`
  const icon = compact ? 16 : 18

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!compact && <span className="mr-1 text-sm font-medium text-muted">Share</span>}
      <button type="button" className={btn} onClick={() => open((u, t) => `https://wa.me/?text=${t}%20${u}`)}>
        <WhatsApp width={icon} height={icon} />
        <span className="sr-only">Share on WhatsApp</span>
      </button>
      <button type="button" className={btn} onClick={() => open((u) => `https://www.facebook.com/sharer/sharer.php?u=${u}`)}>
        <Facebook width={icon} height={icon} />
        <span className="sr-only">Share on Facebook</span>
      </button>
      <button type="button" className={btn} onClick={() => open((u, t) => `https://twitter.com/intent/tweet?url=${u}&text=${t}`)}>
        <XLogo width={icon} height={icon} />
        <span className="sr-only">Share on X</span>
      </button>
      <button type="button" className={btn} onClick={copy}>
        <Link2 width={icon} height={icon} />
        <span className="sr-only">{copied ? 'Link copied' : 'Copy link'}</span>
      </button>
      {canNativeShare && (
        <button type="button" className={`${btn} sm:hidden`} onClick={nativeShare}>
          <Share width={icon} height={icon} />
          <span className="sr-only">More sharing options</span>
        </button>
      )}
      <span aria-live="polite" className={`text-sm text-gold-light transition-opacity ${copied ? 'opacity-100' : 'opacity-0'}`}>
        Copied
      </span>
    </div>
  )
}
