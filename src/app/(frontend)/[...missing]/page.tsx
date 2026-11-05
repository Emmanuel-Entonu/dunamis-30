import { notFound } from 'next/navigation'

/**
 * The site has several root layouts, so an unknown address would otherwise get the framework's bare 404,
 * with no menu and no way back. This sends it to the site's own page instead.
 */
export default function Missing() {
  notFound()
}
