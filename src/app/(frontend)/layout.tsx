import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import React from 'react'

import { PageSkeleton } from '@/components/PageSkeleton'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { PerformanceWatch } from '@/components/PerformanceWatch'
import { VisitCount } from '@/components/VisitCount'
import { liteScript } from '@/lib/lite'
import { defaultDescription, shareImage, siteName, siteUrl } from '@/lib/site'
import './styles.css'

// Self-hosted Onest (OFL) variable font: no Google request at build or run time.
const onest = localFont({ src: '../../fonts/onest-variable.woff2', weight: '100 900', variable: '--font-onest' })

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Dunamis at 30: 30 Years of God’s Faithfulness',
    template: '%s | Dunamis at 30',
  },
  description: defaultDescription,
  keywords: [
    'Dunamis at 30',
    'Dunamis International Gospel Centre',
    'Dunamis testimonies',
    'Dr. Paul Enenche',
    'Dunamis anniversary',
    'Dunamis 30 years',
  ],
  openGraph: { type: 'website', siteName, locale: 'en_NG', images: [shareImage] },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  themeColor: '#080808',
  colorScheme: 'dark',
}

// Footer contacts/socials come from the CMS; refresh every few minutes.
export const revalidate = 300

const gaId = process.env.NEXT_PUBLIC_GA_ID

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={onest.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: liteScript }} />
      </head>
      <body>
        <noscript>
          <style>{'.reveal-wait{opacity:1}'}</style>
        </noscript>
        <a
          href="#main"
          className="sr-only z-[60] rounded-lg bg-gold px-4 py-2 font-medium text-black focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <PageSkeleton />
        <PerformanceWatch />
        <VisitCount />
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
