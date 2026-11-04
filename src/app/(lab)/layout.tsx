import type { ReactNode } from 'react'

// Development-only tooling (3D render capture). Not linked anywhere and 404s in production.
export default function LabLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: 'transparent' }}>{children}</body>
    </html>
  )
}
