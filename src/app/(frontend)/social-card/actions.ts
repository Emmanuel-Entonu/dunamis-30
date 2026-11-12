'use server'

import { headers } from 'next/headers'

import { getPayloadClient } from '@/lib/content'
import { TEMPLATE_ORDER } from '@/lib/cardFrames'
import { recordEvent } from '@/lib/siteEvents'
import { underLimit } from '@/lib/spam'

/** One more card made, for the dashboard. The local preview doesn't count, because it runs against the real database. */
export async function logCardMade() {
  if (process.env.NODE_ENV !== 'production') return
  if (!(await underLimit('card-made', 30))) return
  try {
    await recordEvent(await getPayloadClient(), 'card', await headers())
  } catch {
    // Analytics only: ignore when the database is unavailable.
  }
}

/** Anonymous usage counter for the admin's "social card activity" view. Never blocks the visitor. */
export async function logCardEvent(event: { template: string; format: string; action: 'download' | 'share' }) {
  // Anyone can call this, so only what the card maker really sends is counted, and only so often.
  if (!event || !TEMPLATE_ORDER.includes(event.template as never) || !['card', 'card-video'].includes(event.format) || !['download', 'share'].includes(event.action)) return
  if (!(await underLimit('card-event', 60))) return
  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'card-events',
      overrideAccess: true,
      data: { template: event.template.slice(0, 40), format: event.format.slice(0, 20), action: event.action },
    })
  } catch {
    // Analytics only — ignore when the database is unavailable.
  }
}
