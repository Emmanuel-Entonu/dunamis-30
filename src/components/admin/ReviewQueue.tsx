import type { Payload } from 'payload'

/**
 * Admin dashboard: what needs attention. Each tile links to the filtered list, where an editor
 * opens a submission and sets its status (Approve → it goes live; Reject → it stays hidden).
 */
export async function ReviewQueue({ payload }: { payload: Payload }) {
  const count = async (collection: 'testimonies' | 'sons-stories' | 'international-registrations' | 'card-events', where: object) => {
    try {
      return (await payload.count({ collection, where: where as never })).totalDocs
    } catch {
      return 0
    }
  }
  const [testimonies, sons, guests, guestsNeedHelp, cards] = await Promise.all([
    count('testimonies', { status: { equals: 'pending' } }),
    count('sons-stories', { status: { equals: 'pending' } }),
    count('international-registrations', { logisticsStatus: { equals: 'new' } }),
    count('international-registrations', {
      and: [{ logisticsStatus: { equals: 'new' } }, { or: [{ needsPickup: { equals: true } }, { needsAccommodation: { equals: true } }] }],
    }),
    count('card-events', {}),
  ])

  const tiles = [
    {
      label: 'Testimonies to review',
      value: testimonies,
      href: '/admin/collections/testimonies?where[status][equals]=pending',
      note: 'Approve to publish on the Testimonies page.',
    },
    {
      label: 'Sons of the Prophet stories',
      value: sons,
      href: '/admin/collections/sons-stories?where[status][equals]=pending',
      note: 'Approve to publish on Sons of the Prophet.',
    },
    {
      label: 'New international guests',
      value: guests,
      href: '/admin/collections/international-registrations?where[logisticsStatus][equals]=new',
      note: `${guestsNeedHelp} asked for pickup or accommodation.`,
    },
    {
      label: 'Attendance cards saved or shared',
      value: cards,
      href: '/admin/collections/card-events',
      note: 'Downloads and shares from “I Am Attending”.',
      quiet: true,
    },
  ]

  return (
    <section style={{ marginBottom: 'calc(var(--base) * 2)' }}>
      <h2 style={{ margin: '0 0 calc(var(--base) * 0.75)', fontSize: 20 }}>Review queue</h2>
      <div style={{ display: 'grid', gap: 'calc(var(--base) * 0.75)', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {tiles.map((t) => {
          const highlight = t.value > 0 && !('quiet' in t)
          return (
          <a
            key={t.label}
            href={t.href}
            style={{
              display: 'block',
              padding: 'calc(var(--base) * 1)',
              borderRadius: 12,
              border: `1px solid ${highlight ? '#f0a92b' : 'var(--theme-elevation-150)'}`,
              background: highlight ? 'rgba(240,169,43,0.08)' : 'var(--theme-elevation-50)',
              color: 'var(--theme-text)',
              textDecoration: 'none',
            }}
          >
            <span style={{ display: 'block', fontSize: 34, fontWeight: 600, lineHeight: 1, color: highlight ? '#f0a92b' : 'inherit' }}>{t.value}</span>
            <span style={{ display: 'block', marginTop: 8, fontWeight: 600 }}>{t.label}</span>
            <span style={{ display: 'block', marginTop: 4, fontSize: 13, opacity: 0.7 }}>{t.note}</span>
          </a>
          )
        })}
      </div>
    </section>
  )
}
