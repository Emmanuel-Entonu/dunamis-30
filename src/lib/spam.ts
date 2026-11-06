import { headers } from 'next/headers'

/*
 * Light, layered protection for the public forms:
 * - a honeypot field real visitors and their browsers' autofill never see,
 * - a per-visitor rate limit (in memory, per server instance),
 * - Cloudflare Turnstile when TURNSTILE_SECRET_KEY is configured.
 */

const hits = new Map<string, number[]>()
const WINDOW_MS = 10 * 60 * 1000
// Generous on purpose: many people on Nigerian mobile networks, or on the church Wi-Fi, share one address.
const MAX_PER_WINDOW = 20

export async function clientIp() {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}

export type SpamVerdict = { ok: true } | { ok: false; silent: boolean; message?: string }

export async function checkSubmission(formData: FormData, bucket: string): Promise<SpamVerdict> {
  if (String(formData.get('leave_empty') ?? '')) return { ok: false, silent: true }

  const ip = await clientIp()
  const key = `${bucket}:${ip}`
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW)
    return { ok: false, silent: false, message: 'You’ve sent several submissions in a short time. Please try again in a few minutes.' }
  hits.set(key, [...recent, now])
  if (hits.size > 5000) {
    for (const [k, times] of hits) if (!times.some((t) => now - t < WINDOW_MS)) hits.delete(k)
  }

  const secret = process.env.TURNSTILE_SECRET_KEY
  if (secret) {
    const token = String(formData.get('cf-turnstile-response') ?? '')
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    })
      .then((r) => r.json() as Promise<{ success: boolean }>)
      .catch(() => ({ success: false }))
    if (!res.success) return { ok: false, silent: false, message: 'Please complete the security check and try again.' }
  }
  return { ok: true }
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
export const esc = (v: string) => v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
