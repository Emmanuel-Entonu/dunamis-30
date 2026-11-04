'use server'

import { getPayloadClient } from '@/lib/content'

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
