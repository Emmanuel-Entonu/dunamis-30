'use server'

import { headers } from 'next/headers'

import { getPayloadClient } from '@/lib/content'
import { recordEvent } from '@/lib/siteEvents'

/** One more card made, for the dashboard. The local preview doesn't count, because it runs against the real database. */
export async function logCardMade() {
  if (process.env.NODE_ENV !== 'production') return
  try {
    await recordEvent(await getPayloadClient(), 'card', await headers())
  } catch {
    // Analytics only: ignore when the database is unavailable.
  }
}

/** Anonymous usage counter for the admin's "social card activity" view. Never blocks the visitor. */
export async function logCardEvent(event: { template: string; format: string; action: 'download' | 'share' }) {
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
