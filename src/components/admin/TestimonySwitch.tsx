import type { Payload } from 'payload'

import { SwitchControl } from './SwitchControl'

/** The off switch for the public testimony form, on the first screen and above the Testimonies list. */
export async function TestimonyFormSwitch({ payload }: { payload: Payload }) {
  let open: boolean | null = null
  try {
    open = (await payload.findGlobal({ slug: 'testimony-settings', depth: 0 })).formOpen !== false
  } catch {
    // The database doesn't have the switch yet: an update has been made but hasn't gone live.
  }
  return <SwitchControl initialOpen={open} />
}
