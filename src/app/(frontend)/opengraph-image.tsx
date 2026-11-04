import { ImageResponse } from 'next/og'

export const alt = 'Dunamis at 30 — 30 Years of God’s Faithfulness'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Default link preview for WhatsApp, Facebook, X etc. Pages with their own artwork override it. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 84px',
          background: 'radial-gradient(120% 90% at 50% 120%, #b8730b 0%, #2a1a07 38%, #080808 70%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 640 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              alignSelf: 'flex-start',
              padding: '10px 22px',
              borderRadius: 999,
              border: '1px solid rgba(246,183,60,0.35)',
              background: '#1c1104',
              fontSize: 24,
              color: '#ffd27a',
            }}
          >
            {/* Drawn, not typed: the default OG font has no ✦ glyph. */}
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path
                fill="#ffd27a"
                d="M12 1.5c.5 5.6 4.9 10 10.5 10.5-5.6.5-10 4.9-10.5 10.5-.5-5.6-4.9-10-10.5-10.5C7.1 11.5 11.5 7.1 12 1.5Z"
              />
            </svg>
            Celebrating 30 Years of Impact
          </div>
          <div style={{ fontSize: 70, lineHeight: 1.08, marginTop: 30, fontWeight: 600, letterSpacing: -2 }}>
            30 Years of God’s Faithfulness
          </div>
          <div style={{ fontSize: 30, marginTop: 22, color: '#b6b6b6' }}>Dunamis International Gospel Centre</div>
        </div>
        <div
          style={{
            display: 'flex',
            width: 300,
            height: 400,
            borderRadius: 26,
            padding: 28,
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(140deg, #ffc65a 0%, #f2a227 45%, #d87d0d 100%)',
            color: '#1a0f02',
            boxShadow: '0 30px 80px rgba(227,154,23,0.45)',
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 700 }}>Dunamis@30</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 16, letterSpacing: 4, opacity: 0.7 }}>I AM ATTENDING</div>
            <div style={{ fontSize: 120, fontWeight: 700, lineHeight: 1, letterSpacing: -6 }}>30</div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
