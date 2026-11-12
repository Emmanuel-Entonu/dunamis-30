'use server'

import { headers } from 'next/headers'

import { getPayloadClient } from '@/lib/content'
import { INVITE_ACTIONS, recordEvent } from '@/lib/siteEvents'
import { underLimit } from '@/lib/spam'

const KINDS = ['invite', ...INVITE_ACTIONS] as const
export type InviteCount = (typeof KINDS)[number]

/**
 * One more invitation made, downloaded, shared or turned into a video, for the dashboard. Anonymous: no names,
 * only the day, the country and phone or computer. The local preview doesn't count, because it runs against the
 * real database. Anyone can call this, so only these four are accepted, and only so often from one address.
 */
export async function logInvite(kind: InviteCount) {
  if (process.env.NODE_ENV !== 'production') return
  if (!KINDS.includes(kind)) return
  if (!(await underLimit('invite-event', 40))) return
  try {
    await recordEvent(await getPayloadClient(), kind, await headers())
  } catch {
    // Analytics only: ignore when the database is unavailable.
  }
}
