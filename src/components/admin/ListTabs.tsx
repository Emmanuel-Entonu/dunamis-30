import type { Payload } from 'payload'

type Search = Record<string, string | string[] | undefined>
type Props = { payload: Payload; searchParams?: Search }
type Tab = { label: string; value?: string }

/** Plain tabs above a list, in place of the filter builder: one click shows what's waiting, published or rejected. */
async function Tabs({ payload, searchParams, collection, field, tabs }: Props & { collection: 'testimonies' | 'sons-stories' | 'international-registrations'; field: string; tabs: Tab[] }) {
  const current = searchParams?.[`where[${field}][equals]`]
  const counts = await Promise.all(
    tabs.map(async (tab) => {
      try {
        const where = tab.value ? { [field]: { equals: tab.value } } : {}
        return (await payload.count({ collection, where: where as never })).totalDocs
      } catch {
        return 0
      }
    }),
  )
  return (
    <nav aria-label="Show" className="list-tabs">
      {tabs.map((tab, i) => {
        const active = (tab.value ?? undefined) === current
        const href = `/admin/collections/${collection}${tab.value ? `?where[${field}][equals]=${tab.value}` : ''}`
        return (
          <a key={tab.label} href={href} aria-current={active ? 'true' : undefined} className={`list-tabs__tab${active ? ' list-tabs__tab--active' : ''}`}>
            {tab.label} <span>{counts[i]}</span>
          </a>
        )
      })}
    </nav>
  )
}

const review: Tab[] = [
  { label: 'Waiting for review', value: 'pending' },
  { label: 'On the website', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Everything' },
]

export const TestimonyTabs = (props: Props) => <Tabs {...props} collection="testimonies" field="status" tabs={review} />

export const StoryTabs = (props: Props) => <Tabs {...props} collection="sons-stories" field="status" tabs={review} />

export const GuestTabs = (props: Props) => (
  <Tabs
    {...props}
    collection="international-registrations"
    field="logisticsStatus"
    tabs={[
      { label: 'New', value: 'new' },
      { label: 'Contacted', value: 'contacted' },
      { label: 'Confirmed', value: 'confirmed' },
      { label: 'Cannot accommodate', value: 'declined' },
      { label: 'Everyone' },
    ]}
  />
)
