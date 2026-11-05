import type { Payload, SanitizedPermissions } from 'payload'

import { SidebarNav } from './SidebarNav'

type Person = { name?: string | null; username?: string | null; email?: string | null; roles?: string[] | null } | null | undefined

/** The menu that stays on the left of every screen, with a count beside whatever is waiting. */
export async function Sidebar({ payload, user, permissions }: { payload: Payload; user?: Person; permissions?: SanitizedPermissions }) {
  const count = async (collection: 'testimonies' | 'sons-stories' | 'international-registrations', where: object) => {
    if (!permissions?.collections?.[collection]?.read) return null
    try {
      return (await payload.count({ collection, where: where as never })).totalDocs
    } catch {
      return 0
    }
  }
  const [testimonies, guests, stories] = await Promise.all([
    count('testimonies', { status: { equals: 'pending' } }),
    count('international-registrations', { logisticsStatus: { equals: 'new' } }),
    count('sons-stories', { status: { equals: 'pending' } }),
  ])

  return (
    <SidebarNav
      testimonies={testimonies}
      guests={guests}
      stories={stories}
      person={{
        name: user?.name || user?.username || user?.email || 'Your account',
        role: user?.roles?.includes('admin') ? 'Administrator' : 'Reviewer',
      }}
    />
  )
}
