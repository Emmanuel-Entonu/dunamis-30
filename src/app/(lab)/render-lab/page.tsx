import { notFound } from 'next/navigation'

import { RenderLab } from './RenderLab'

export const metadata = { robots: { index: false } }

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === 'production') notFound()
  const p = await searchParams
  const n = (key: string, fallback: number) => (p[key] === undefined ? fallback : Number(p[key]))
  return (
    <RenderLab
      shape={p.shape ?? 'thirty'}
      finish={p.finish ?? 'chrome'}
      rotation={[n('rx', 0), n('ry', 0), n('rz', 0)]}
      pose={{ curl: n('curl', 0.22), spread: n('spread', 0.12), thumb: n('thumb', 0.2) }}
      inflate={n('inflate', 0)}
    />
  )
}
