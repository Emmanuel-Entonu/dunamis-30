import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import type { ReactNode } from 'react'

import { Toaster } from '@/components/ui/sonner'
import './dashboard.css'

const onest = localFont({ src: '../../fonts/onest-variable.woff2', weight: '100 900', variable: '--font-onest' })

export const metadata: Metadata = {
  title: 'Dashboard | Dunamis at 30',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = { themeColor: '#f2f3f3' }

/** The review dashboard. It has its own root, so none of Payload's or the public site's weight loads here. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={onest.variable}>
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
