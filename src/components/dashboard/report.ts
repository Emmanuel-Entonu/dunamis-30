'use client'

import type { Report, ReportDay } from '@/lib/dashboardReport'
import { api } from './store'

/*
 * The statistics report, laid out like a statistical bulletin: the site's own typeface (Onest), a plain cover,
 * the main points in words, charts labelled directly instead of read off gridlines, and quiet tables.
 */

type RGB = [number, number, number]
const TEXT: RGB = [20, 20, 20]
const MUTED: RGB = [110, 110, 115]
const FAINT: RGB = [230, 230, 230]
const GOLD: RGB = [184, 134, 43]
const GOLD_LIGHT: RGB = [233, 212, 168]
const BLUE: RGB = [31, 58, 95]
const GREY: RGB = [160, 160, 165]
const TEAL: RGB = [29, 107, 95]
const ROSE: RGB = [168, 64, 104]

const PAGE_W = 210
const PAGE_H = 297
const M = 18
const WIDTH = PAGE_W - M * 2
const BOTTOM = PAGE_H - 20

/**
 * Onest has Western letters and typographic punctuation, so curly quotes and dashes stay; they read better.
 * Anything the font can't draw goes. Written as escapes so the regex survives any script encoding.
 */
const clean = (text: string) =>
  text
    .replace(/'/g, '\u2019')
    .replace(/[^\x20-\x7E\xA0-\xFF\u2010-\u2027\u2030-\u205E]/g, '')

const num = (value: number) => value.toLocaleString('en-GB')
const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : '0%')
const noon = (day: string) => new Date(`${day}T12:00:00Z`)
const fmt = (day: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(noon(day))
const short = (day: string) => fmt(day, { day: 'numeric', month: 'short' })
const weekday = (day: string) => fmt(day, { weekday: 'long', day: 'numeric', month: 'long' })
const tableDay = (day: string) => fmt(day, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

async function base64(url: string) {
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer())
  let text = ''
  for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(text)
}

type Series = { label: string; color: RGB; values: number[] }

export async function downloadReport() {
  const [report, { jsPDF }, { autoTable }, regular, medium, semibold, emblem] = await Promise.all([
    api<Report>('/dashboard/report'),
    import('jspdf'),
    import('jspdf-autotable'),
    base64('/fonts/report/onest-400.ttf'),
    base64('/fonts/report/onest-500.ttf'),
    base64('/fonts/report/onest-600.ttf'),
    base64('/fonts/report/emblem.jpg'),
  ])
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.addFileToVFS('onest-400.ttf', regular)
  doc.addFont('onest-400.ttf', 'Onest', 'normal')
  // Each weight is its own family, so the tables can use them too.
  doc.addFileToVFS('onest-500.ttf', medium)
  doc.addFont('onest-500.ttf', 'OnestMedium', 'normal')
  doc.addFileToVFS('onest-600.ttf', semibold)
  doc.addFont('onest-600.ttf', 'OnestSemibold', 'normal')
  const FAMILY = { normal: 'Onest', medium: 'OnestMedium', bold: 'OnestSemibold' } as const

  const type = (style: 'normal' | 'medium' | 'bold', size: number, color: RGB = TEXT) => {
    doc.setFont(FAMILY[style], 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...color)
  }
  let y = M
  const room = (needed: number) => {
    if (y + needed > BOTTOM) {
      doc.addPage()
      y = M
    }
  }
  /** A section: its title, a line saying what it shows, and the space it needs kept on one page. */
  const section = (title: string, note: string | null, keep: number) => {
    room(keep + (note ? 16 : 11))
    y += 4
    type('bold', 13)
    doc.text(clean(title), M, y + 4)
    y += 7
    if (note) {
      type('normal', 9, MUTED)
      const lines = doc.splitTextToSize(clean(note), WIDTH)
      doc.text(lines, M, y + 3)
      y += lines.length * 4.2 + 1.5
    }
    y += 2
  }
  const key = (items: { label: string; color: RGB }[], at: number) => {
    let kx = M
    type('normal', 8, MUTED)
    for (const item of items) {
      doc.setFillColor(...item.color)
      doc.rect(kx, at - 2.3, 2.6, 2.6, 'F')
      doc.text(clean(item.label), kx + 4, at)
      kx += doc.getTextWidth(clean(item.label)) + 10
    }
  }

  /**
   * Bars for every day, labelled directly: each bar carries its number when there's room, and the scale is
   * left implied. "overlay" puts the second series inside the first; "stacked" piles them; "grouped" sets
   * them side by side.
   */
  const bars = (days: ReportDay[], series: Series[], mode: 'overlay' | 'stacked' | 'grouped', height: number) => {
    const totals = days.map((_, i) => (mode === 'stacked' ? series.reduce((s, item) => s + item.values[i], 0) : Math.max(...series.map((item) => item.values[i]))))
    const top = Math.max(...totals, 1) * 1.12
    const slot = WIDTH / Math.max(days.length, 1)
    const bw = Math.min(slot * 0.62, 14)
    const labels = mode !== 'grouped' && slot >= 9
    const base = y + height
    days.forEach((_, i) => {
      const bx = M + i * slot + (slot - bw) / 2
      let stack = base
      series.forEach((item, k) => {
        const value = item.values[i]
        if (!value) return
        const bh = (value / top) * height
        doc.setFillColor(...item.color)
        if (mode === 'grouped') {
          const gw = bw / series.length
          doc.rect(bx + k * gw, base - bh, gw * 0.86, bh, 'F')
        } else if (mode === 'stacked') {
          doc.rect(bx, stack - bh, bw, bh, 'F')
          stack -= bh
        } else if (k > 0) {
          doc.rect(bx + bw * 0.2, base - bh, bw * 0.6, bh, 'F')
        } else {
          doc.rect(bx, base - bh, bw, bh, 'F')
        }
      })
      if (labels && totals[i]) {
        type('medium', 7, TEXT)
        doc.text(num(totals[i]), bx + bw / 2, base - (totals[i] / top) * height - 1.5, { align: 'center' })
      }
    })
    doc.setDrawColor(...TEXT)
    doc.setLineWidth(0.3)
    doc.line(M, base, M + WIDTH, base)
    const every = Math.max(1, Math.ceil(days.length / Math.floor(WIDTH / 13)))
    type('normal', 7, MUTED)
    days.forEach((day, i) => {
      if (i % every && i !== days.length - 1) return
      doc.text(short(day.day), M + i * slot + slot / 2, base + 4, { align: 'center' })
    })
    y = base + 7
  }

  const table = (head: string[], body: (string | number)[][], foot?: (string | number)[]) => {
    if (!body.length) body = [['None yet', ...head.slice(1).map(() => '')]]
    const cell = (value: string | number) => (typeof value === 'number' ? num(value) : clean(value))
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M, bottom: 22 },
      head: [head.map(clean)],
      body: body.map((row) => row.map(cell)),
      foot: foot ? [foot.map(cell)] : undefined,
      showFoot: 'lastPage',
      theme: 'plain',
      styles: { font: 'Onest', fontStyle: 'normal', fontSize: 9, textColor: TEXT, cellPadding: { top: 2.2, bottom: 2.2, left: 0, right: 0 }, lineColor: FAINT, lineWidth: { bottom: 0.2 } },
      headStyles: { font: FAMILY.medium, fontSize: 8, textColor: MUTED, lineColor: TEXT, lineWidth: { bottom: 0.3 } },
      footStyles: { font: FAMILY.bold, textColor: TEXT, lineColor: TEXT, lineWidth: { top: 0.3 } },
      didParseCell: (data) => {
        data.cell.styles.halign = data.column.index === 0 ? 'left' : 'right'
        if (data.column.index > 0) data.cell.styles.cellPadding = { top: 2.2, bottom: 2.2, left: 4, right: 0 }
      },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  }

  const { totals, days } = report
  const busiest = days.reduce((best, day) => (day.visits > best.visits ? day : best), days[0])
  const countryVisits = report.countries.reduce((s, c) => s + c.visits, 0)
  const devices = totals.phones + totals.computers
  const sent = (rows: { count: number }[]) => rows.reduce((s, r) => s + r.count, 0)
  const period =
    report.firstDay === report.lastDay
      ? fmt(report.lastDay, { day: 'numeric', month: 'long', year: 'numeric' })
      : `${fmt(report.firstDay, { day: 'numeric', month: 'long' })} to ${fmt(report.lastDay, { day: 'numeric', month: 'long', year: 'numeric' })}`
  const prepared = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' }).format(new Date(report.generatedAt))

  // Cover: the church, the title, the period. Nothing else.
  const ew = 11 * (211 / 160)
  doc.addImage(emblem, 'JPEG', M, y, ew, 11)
  type('medium', 9)
  doc.text('Dunamis International Gospel Centre', M + ew + 4, y + 4.5)
  type('normal', 9, MUTED)
  doc.text('Glory Dome, Abuja', M + ew + 4, y + 9)
  type('normal', 8, MUTED)
  doc.text('Report period', PAGE_W - M, y + 4.5, { align: 'right' })
  type('medium', 9)
  doc.text(clean(period), PAGE_W - M, y + 9, { align: 'right' })
  y += 26
  type('bold', 26)
  doc.text('Dunamis at 30 website', M, y)
  y += 8
  type('normal', 11, MUTED)
  doc.text(clean(`How the anniversary website has been used over ${days.length} ${days.length === 1 ? 'day' : 'days'}.`), M, y)
  y += 5
  type('normal', 8, MUTED)
  doc.text(clean(`Prepared ${prepared}, Lagos time.`), M, y + 1)
  y += 9

  // Main points, in words.
  section('Main points', null, 30)
  const points = [
    `${num(totals.visitors)} people visited the site, ${num(totals.visits)} times in all: ${num(Math.round(totals.visits / Math.max(days.length, 1)))} visits a day on average.`,
    busiest?.visits ? `The busiest day was ${weekday(busiest.day)}, with ${num(busiest.visits)} visits.` : '',
    report.countries.length ? `Visitors came from ${num(report.countries.length)} countries. ${report.countries[0].name} accounted for ${pct(report.countries[0].visits, countryVisits)} of visits.` : '',
    devices ? `${pct(totals.phones, devices)} of visits were on a phone.` : '',
    `${num(totals.cards)} social cards were made. They were downloaded ${num(totals.downloads)} times and shared ${num(totals.shares)} times.`,
    report.testimonies
      ? `${num(sent(report.testimonies.status))} testimonies were sent in${report.stories ? `, with ${num(sent(report.stories.status))} Sons of the Prophet stories` : ''}${report.guests ? ` and ${num(sent(report.guests.status))} international guest registrations` : ''}.`
      : '',
  ].filter(Boolean)
  for (const point of points) {
    type('normal', 10)
    const lines = doc.splitTextToSize(clean(point), WIDTH - 6)
    room(lines.length * 5 + 2)
    doc.setFillColor(...GOLD)
    doc.circle(M + 1.2, y + 1.6, 0.9, 'F')
    type('normal', 10)
    doc.text(lines, M + 6, y + 2.6)
    y += lines.length * 5 + 2
  }

  // The figures, in a plain grid.
  section('Totals', null, 60)
  const figures: [string, string][] = [
    ['People who visited', num(totals.visitors)],
    ['Visits', num(totals.visits)],
    ['Visits a day, on average', num(Math.round(totals.visits / Math.max(days.length, 1)))],
    ['Countries', num(report.countries.length)],
    ['Social cards made', num(totals.cards)],
    ['Cards downloaded', num(totals.downloads)],
    ['Cards shared', num(totals.shares)],
    ['Visits on a phone', pct(totals.phones, devices)],
  ]
  if (report.testimonies) figures.push(['Testimonies', num(sent(report.testimonies.status))])
  if (report.stories) figures.push(['Sons of the Prophet stories', num(sent(report.stories.status))])
  if (report.guests) figures.push(['International guests', num(sent(report.guests.status))])
  const colW = WIDTH / 4
  figures.forEach(([label, value], i) => {
    const fx = M + (i % 4) * colW
    const fy = y + Math.floor(i / 4) * 17
    type('bold', 17)
    doc.text(clean(value), fx, fy + 7)
    type('normal', 8, MUTED)
    doc.text(clean(label), fx, fy + 12)
  })
  y += Math.ceil(figures.length / 4) * 17
  type('normal', 7.5, MUTED)
  doc.text(doc.splitTextToSize(clean('A person is a phone or computer, counted once, the first time it opens the site. A visit is a person on a day: someone who comes on three days makes three visits.'), WIDTH), M, y + 1)
  y += 8

  // Charts.
  section('Visits each day', 'Lagos time. The darker part of each bar is people visiting for the first time.', 70)
  key([{ label: 'Visits', color: GOLD_LIGHT }, { label: 'First-time visitors', color: GOLD }], y)
  y += 5
  bars(days, [{ label: 'Visits', color: GOLD_LIGHT, values: days.map((d) => d.visits) }, { label: 'First-time visitors', color: GOLD, values: days.map((d) => d.newVisitors) }], 'overlay', 52)

  section('Social cards each day', 'A card can be downloaded or shared more than once, so those can outnumber the cards made.', 60)
  key([{ label: 'Made', color: GOLD }, { label: 'Downloaded', color: BLUE }, { label: 'Shared', color: GREY }], y)
  y += 5
  bars(days, [{ label: 'Made', color: GOLD, values: days.map((d) => d.cards) }, { label: 'Downloaded', color: BLUE, values: days.map((d) => d.downloads) }, { label: 'Shared', color: GREY, values: days.map((d) => d.shares) }], 'grouped', 42)

  const sentIn: Series[] = []
  if (report.testimonies) sentIn.push({ label: 'Testimonies', color: TEAL, values: days.map((d) => d.testimonies ?? 0) })
  if (report.stories) sentIn.push({ label: 'Sons of the Prophet stories', color: GOLD, values: days.map((d) => d.stories ?? 0) })
  if (report.guests) sentIn.push({ label: 'International guests', color: ROSE, values: days.map((d) => d.guests ?? 0) })
  if (sentIn.length) {
    section('Sent in each day', null, 55)
    key(sentIn, y)
    y += 5
    bars(days, sentIn, 'stacked', 38)
  }

  // Countries: a ranked list with bars, then the rest compactly.
  section('Where visitors came from', `${num(report.countries.length)} countries.${totals.unknownCountry ? ` ${num(totals.unknownCountry)} visits could not be placed.` : ''}`, 40)
  const ranked = report.countries.slice(0, 15)
  const most = Math.max(...ranked.map((c) => c.visits), 1)
  ranked.forEach((country, i) => {
    room(6.5)
    type('normal', 7.5, MUTED)
    doc.text(String(i + 1), M + 4, y + 3.4, { align: 'right' })
    type('normal', 9)
    doc.text(clean(country.name).slice(0, 32), M + 7, y + 3.4)
    doc.setFillColor(...(i === 0 ? GOLD : GOLD_LIGHT))
    doc.rect(M + 62, y + 0.9, Math.max(0.6, (country.visits / most) * (WIDTH - 62 - 34)), 3.2, 'F')
    type('medium', 9)
    doc.text(num(country.visits), PAGE_W - M - 12, y + 3.4, { align: 'right' })
    type('normal', 8, MUTED)
    doc.text(pct(country.visits, countryVisits), PAGE_W - M, y + 3.4, { align: 'right' })
    y += 6.2
  })
  const rest = report.countries.slice(15)
  if (rest.length) {
    y += 3
    room(10)
    type('medium', 8, MUTED)
    doc.text('The other countries, by visits', M, y + 3)
    y += 6
    const cols = 3
    const cw = WIDTH / cols
    const rows = Math.ceil(rest.length / cols)
    for (let r = 0; r < rows; r++) {
      room(5)
      for (let c = 0; c < cols; c++) {
        const country = rest[c * rows + r]
        if (!country) continue
        type('normal', 8)
        doc.text(clean(country.name).slice(0, 26), M + c * cw, y + 3)
        type('normal', 8, MUTED)
        doc.text(num(country.visits), M + c * cw + cw - 5, y + 3, { align: 'right' })
      }
      y += 4.8
    }
  }

  // Devices.
  if (devices) {
    section('Phones and computers', null, 16)
    doc.setFillColor(...GOLD)
    doc.rect(M, y, (WIDTH * totals.phones) / devices, 4, 'F')
    doc.setFillColor(...BLUE)
    doc.rect(M + (WIDTH * totals.phones) / devices, y, (WIDTH * totals.computers) / devices, 4, 'F')
    type('normal', 9)
    doc.text(`Phones ${pct(totals.phones, devices)}  (${num(totals.phones)} visits)`, M, y + 9)
    doc.text(`Computers ${pct(totals.computers, devices)}  (${num(totals.computers)} visits)`, PAGE_W - M, y + 9, { align: 'right' })
    y += 14
  }

  // Tables.
  if (report.cardDesigns.length) {
    section('Social cards by design', null, 30)
    table(['Design', 'Downloaded', 'Shared'], report.cardDesigns.map((d) => [d.name, d.downloads, d.shares]))
  }
  if (report.testimonies) {
    section('Testimonies', `${num(report.testimonies.videos)} include a video.`, 30)
    table(['Status', 'Testimonies'], report.testimonies.status.map((r) => [r.name, r.count]))
    table(['Type', 'Testimonies'], report.testimonies.categories.map((r) => [r.name, r.count]))
  }
  if (report.stories) {
    section('Sons of the Prophet stories', `${num(report.stories.videos)} include a video.`, 24)
    table(['Status', 'Stories'], report.stories.status.map((r) => [r.name, r.count]))
  }
  if (report.guests) {
    section(
      'International guests',
      `Leaving out anyone we can't accommodate: ${num(report.guests.pickup)} need an airport pickup and ${num(report.guests.accommodation)} need accommodation. ${num(report.guests.travelling)} people are travelling, companions included.`,
      30,
    )
    table(['Status', 'Guests'], report.guests.status.map((r) => [r.name, r.count]))
    table(['Coming from', 'Guests'], report.guests.countries.map((r) => [r.name, r.count]))
  }

  section('Every day', 'Newest first.', 30)
  const head = ['Day', 'Visits', 'First-time', 'Cards made', 'Downloaded', 'Shared']
  if (report.testimonies) head.push('Testimonies')
  if (report.stories) head.push('Stories')
  if (report.guests) head.push('Guests')
  const row = (d: ReportDay) => {
    const cells: (string | number)[] = [tableDay(d.day), d.visits, d.newVisitors, d.cards, d.downloads, d.shares]
    if (report.testimonies) cells.push(d.testimonies ?? 0)
    if (report.stories) cells.push(d.stories ?? 0)
    if (report.guests) cells.push(d.guests ?? 0)
    return cells
  }
  const all = (pick: (d: ReportDay) => number | null) => days.reduce((s, d) => s + (pick(d) ?? 0), 0)
  const foot: (string | number)[] = ['Total', totals.visits, totals.visitors, totals.cards, totals.downloads, totals.shares]
  if (report.testimonies) foot.push(all((d) => d.testimonies))
  if (report.stories) foot.push(all((d) => d.stories))
  if (report.guests) foot.push(all((d) => d.guests))
  table(head, [...days].reverse().map(row), foot)

  // Running footer.
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    doc.setDrawColor(...FAINT)
    doc.setLineWidth(0.2)
    doc.line(M, PAGE_H - 14, PAGE_W - M, PAGE_H - 14)
    type('normal', 7.5, MUTED)
    doc.text(clean(`Dunamis at 30 website  -  ${period}`), M, PAGE_H - 9.5)
    doc.text(`${page} / ${pages}`, PAGE_W - M, PAGE_H - 9.5, { align: 'right' })
  }

  doc.save(`Dunamis-at-30-website-report-${report.lastDay}.pdf`)
}
