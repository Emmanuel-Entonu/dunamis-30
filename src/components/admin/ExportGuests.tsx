/** Download link above the international guests list. */
export function ExportGuests() {
  return (
    <div style={{ marginBottom: 'var(--base)' }}>
      <a
        href="/api/international-registrations/export.csv"
        style={{ display: 'inline-block', padding: '8px 14px', borderRadius: 6, background: 'var(--theme-elevation-150)', color: 'var(--theme-text)', fontSize: 14, textDecoration: 'none' }}
      >
        Download the guest list as a spreadsheet
      </a>
    </div>
  )
}
