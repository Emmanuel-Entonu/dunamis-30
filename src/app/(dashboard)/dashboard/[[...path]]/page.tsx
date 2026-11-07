import { App } from '@/components/dashboard/App'

/**
 * One static page that holds the whole dashboard. Moving between sections happens in the browser, with
 * no trip to the server, and only the numbers and words are fetched. It knows nothing until signed in.
 */
export const dynamic = 'force-static'

export const generateStaticParams = () => [{ path: [] }]

export default function DashboardPage() {
  return <App />
}
