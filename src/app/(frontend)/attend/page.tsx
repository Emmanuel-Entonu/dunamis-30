import { permanentRedirect } from 'next/navigation'

// No attendance registration: "I Am Attending" is the personalised card generator.
export default function AttendPage() {
  permanentRedirect('/social-card')
}
