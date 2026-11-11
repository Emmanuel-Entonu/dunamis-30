'use client'

import type { jsPDF as PDF } from 'jspdf'

import type { Report, ReportDay } from '@/lib/dashboardReport'
import { api } from './store'

type RGB = [number, number, number]
const INK: RGB = [23, 19, 12]
const SOFT: RGB = [110, 100, 85]
const LINE: RGB = [228, 221, 208]
const GOLD: RGB = [192, 144, 42]
const PALE_GOLD: RGB = [238, 216, 160]
const PURPLE: RGB = [90, 26, 150]
const TEAL: RGB = [29, 107, 95]
const PINK: RGB = [168, 64, 104]

const PAGE_W = 210
const PAGE_H = 297
const M = 16
const BOTTOM = PAGE_H - 18

/** The built-in PDF fonts only know Western letters: curly quotes and dashes become plain ones, anything else goes. */
const clean = (text: string) =>
  text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')

const num = (value: number) => value.toLocaleString('en-GB')
const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : '0%')
const noon = (day: string) => new Date(`${day}T12:00:00Z`)
const short = (day: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(noon(day))
const long = (day: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(noon(day))
const full = (day: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(noon(day))

/** A round number a little above the highest bar, and the step between its grid lines. */
function scale(max: number) {
  if (max <= 4) return { top: 4, step: 1 }
  const rough = max / 4
  const power = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((k) => k * power).find((s) => s >= rough) ?? 10 * power
  return { top: Math.ceil(max / step) * step, step }
}

type Series = { label: string; color: RGB; values: number[] }

/**
 * Bars for every day. "overlay" draws the second series inside the first (new visitors within visits);
 * "stacked" piles them up (testimonies, stories, guests).
 */
function bars(doc: PDF, x: number, y: number, w: number, h: number, days: ReportDay[], series: Series[], mode: 'single' | 'overlay' | 'stacked') {
  const left = x + 12
  const width = w - 12
  const totals = days.map((_, i) => (mode === 'stacked' ? series.reduce((s, item) => s + item.values[i], 0) : Math.max(...series.map((item) => item.values[i]))))
  const { top, step } = scale(Math.max(...totals, 0))
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  for (let v = 0; v <= top; v += step) {
    const gy = y + h - (v / top) * h
    doc.setDrawColor(...LINE)
    doc.setLineWidth(0.2)
    doc.line(left, gy, left + width, gy)
    doc.setTextColor(...SOFT)
    doc.text(num(v), left - 2, gy + 1, { align: 'right' })
  }
  const slot = width / Math.max(days.length, 1)
  const bw = Math.max(0.6, Math.min(slot * 0.72, 9))
  days.forEach((_, i) => {
    const bx = left + i * slot + (slot - bw) / 2
    let base = y + h
    series.forEach((item, k) => {
      const value = item.values[i]
      if (!value) return
      const bh = (value / top) * h
      doc.setFillColor(...item.color)
      if (mode === 'stacked') {
        doc.rect(bx, base - bh, bw, bh, 'F')
        base -= bh
      } else if (mode === 'overlay' && k > 0) {
        doc.rect(bx + bw * 0.18, y + h - bh, bw * 0.64, bh, 'F')
      } else {
        doc.rect(bx, y + h - bh, bw, bh, 'F')
      }
    })
  })
  // Dates under the bars, spaced so they never run into each other.
  const every = Math.max(1, Math.ceil(days.length / Math.floor(width / 13)))
  doc.setTextColor(...SOFT)
  days.forEach((day, i) => {
    if (i % every && i !== days.length - 1) return
    doc.text(short(day.day), left + i * slot + slot / 2, y + h + 4, { align: 'center' })
  })
  // Key.
  let kx = left
  series.forEach((item) => {
    doc.setFillColor(...item.color)
    doc.rect(kx, y + h + 7.5, 3, 3, 'F')
    doc.setTextColor(...INK)
    doc.text(clean(item.label), kx + 4.5, y + h + 10)
    kx += doc.getTextWidth(clean(item.label)) + 12
  })
}

export async function downloadReport() {
  const report = await api<Report>('/dashboard/report')
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 0
  const tableY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  const room = (needed: number) => {
    if (y + needed > BOTTOM) {
      doc.addPage()
      y = M
    }
  }
  const heading = (text: string, note?: string) => {
    room(note ? 26 : 20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...INK)
    doc.text(clean(text), M, y + 6)
    y += 9
    if (note) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...SOFT)
      const lines = doc.splitTextToSize(clean(note), PAGE_W - M * 2)
      doc.text(lines, M, y + 3)
      y += lines.length * 4 + 2
    }
  }
  const table = (head: string[], body: (string | number)[][], foot?: (string | number)[]) => {
    if (!body.length) body = [['None yet', ...head.slice(1).map(() => '')]]
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M, bottom: 20 },
      head: [head.map(clean)],
      body: body.map((row) => row.map((cell) => (typeof cell === 'number' ? num(cell) : clean(cell)))),
      foot: foot ? [foot.map((cell) => (typeof cell === 'number' ? num(cell) : clean(cell)))] : undefined,
      theme: 'plain',
      showFoot: 'lastPage',
      styles: { font: 'helvetica', fontSize: 9, textColor: INK, cellPadding: { top: 1.8, bottom: 1.8, left: 2, right: 2 }, lineColor: LINE, lineWidth: { bottom: 0.2 } },
      headStyles: { fontStyle: 'bold', fillColor: [245, 239, 226], textColor: INK },
      footStyles: { fontStyle: 'bold', fillColor: [245, 239, 226], textColor: INK },
      columnStyles: Object.fromEntries(head.map((_, i) => [i, { halign: i === 0 ? 'left' : 'right' }])),
      // Headings and totals line up with their numbers.
      didParseCell: (cell) => {
        cell.cell.styles.halign = cell.column.index === 0 ? 'left' : 'right'
      },
    })
    y = tableY() + 8
  }

  const { totals, days } = report
  const span = `${full(report.firstDay)} to ${full(report.lastDay)} (${days.length} ${days.length === 1 ? 'day' : 'days'})`
  const madeAt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' }).format(new Date(report.generatedAt))

  // Title band.
  doc.setFillColor(...INK)
  doc.rect(0, 0, PAGE_W, 38, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...GOLD)
  doc.text('Dunamis at 30', M, 17)
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text('Website statistics', M, 25)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(220, 210, 190)
  doc.text(clean(`Covers ${span}`), M, 32)
  doc.text(clean(`Downloaded ${madeAt}, Lagos time`), PAGE_W - M, 32, { align: 'right' })
  y = 48

  // The headline numbers.
  const busiest = days.reduce((best, day) => (day.visits > best.visits ? day : best), days[0])
  const tiles: [string, string][] = [
    ['People who visited', num(totals.visitors)],
    ['Visits', num(totals.visits)],
    ['Average visits a day', num(Math.round(totals.visits / Math.max(days.length, 1)))],
    ['Busiest day', busiest && busiest.visits ? `${short(busiest.day)}: ${num(busiest.visits)}` : '-'],
    ['Social cards made', num(totals.cards)],
    ['Cards downloaded', num(totals.downloads)],
    ['Cards shared', num(totals.shares)],
    ['Countries', num(report.countries.length)],
  ]
  if (report.testimonies) tiles.push(['Testimonies received', num(report.testimonies.status.reduce((s, row) => s + row.count, 0))])
  if (report.stories) tiles.push(['Sons of the Prophet stories', num(report.stories.status.reduce((s, row) => s + row.count, 0))])
  if (report.guests) tiles.push(['International guests', num(report.guests.status.reduce((s, row) => s + row.count, 0))])
  const tileW = (PAGE_W - M * 2 - 3 * 4) / 4
  tiles.forEach(([label, value], i) => {
    const tx = M + (i % 4) * (tileW + 4)
    const ty = y + Math.floor(i / 4) * 24
    doc.setDrawColor(...LINE)
    doc.setFillColor(251, 248, 241)
    doc.roundedRect(tx, ty, tileW, 20, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(value.length > 9 ? 11 : 16)
    doc.setTextColor(...INK)
    doc.text(clean(value), tx + 4, ty + 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...SOFT)
    doc.text(clean(label), tx + 4, ty + 16)
  })
  y += Math.ceil(tiles.length / 4) * 24 + 2
  doc.setFontSize(8)
  doc.setTextColor(...SOFT)
  doc.text(
    doc.splitTextToSize('"People who visited" counts each phone or computer once, the first time it opens the site. "Visits" counts each of them once a day they come.', PAGE_W - M * 2),
    M,
    y,
  )
  y += 10

  // Charts.
  heading('Visits per day')
  bars(doc, M, y, PAGE_W - M * 2, 52, days, [
    { label: 'Visits', color: PALE_GOLD, values: days.map((d) => d.visits) },
    { label: 'First-time visitors', color: GOLD, values: days.map((d) => d.newVisitors) },
  ], 'overlay')
  y += 66
  heading('Social cards per day')
  bars(doc, M, y, PAGE_W - M * 2, 40, days, [
    { label: 'Cards made', color: PURPLE, values: days.map((d) => d.cards) },
    { label: 'Downloaded', color: [181, 140, 222], values: days.map((d) => d.downloads) },
  ], 'overlay')
  y += 54
  const submissions: Series[] = []
  if (report.testimonies) submissions.push({ label: 'Testimonies', color: TEAL, values: days.map((d) => d.testimonies ?? 0) })
  if (report.stories) submissions.push({ label: 'Sons of the Prophet stories', color: GOLD, values: days.map((d) => d.stories ?? 0) })
  if (report.guests) submissions.push({ label: 'International guests', color: PINK, values: days.map((d) => d.guests ?? 0) })
  if (submissions.length) {
    heading('What people sent in, per day')
    room(54)
    bars(doc, M, y, PAGE_W - M * 2, 40, days, submissions, 'stacked')
    y += 54
  }

  // Countries.
  heading(
    'Where visitors came from',
    `${num(report.countries.length)} countries.${totals.unknownCountry ? ` ${num(totals.unknownCountry)} visits had no country recorded.` : ''}`,
  )
  const top = report.countries.slice(0, 12)
  const most = Math.max(...top.map((c) => c.visits), 1)
  const countryVisits = report.countries.reduce((s, c) => s + c.visits, 0)
  top.forEach((country) => {
    room(7)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...INK)
    doc.text(clean(country.name).slice(0, 34), M, y + 3.5)
    doc.setFillColor(...GOLD)
    doc.rect(M + 58, y, Math.max(0.8, (country.visits / most) * 92), 4.5, 'F')
    doc.setTextColor(...SOFT)
    doc.text(`${num(country.visits)}  (${pct(country.visits, countryVisits)})`, PAGE_W - M, y + 3.5, { align: 'right' })
    y += 6.5
  })
  y += 4
  if (report.countries.length) {
    room(30)
    table(
      ['Country', 'Visits', 'People', 'Share of visits'],
      report.countries.map((c) => [c.name, c.visits, c.visitors, pct(c.visits, countryVisits)]),
      ['All countries', countryVisits, report.countries.reduce((s, c) => s + c.visitors, 0), '100%'],
    )
  }

  // Devices.
  const devices = totals.phones + totals.computers
  heading('Phones and computers')
  room(20)
  doc.setFillColor(...GOLD)
  doc.rect(M, y, ((PAGE_W - M * 2) * totals.phones) / Math.max(devices, 1), 7, 'F')
  doc.setFillColor(...INK)
  doc.rect(M + ((PAGE_W - M * 2) * totals.phones) / Math.max(devices, 1), y, ((PAGE_W - M * 2) * totals.computers) / Math.max(devices, 1), 7, 'F')
  doc.setFontSize(9)
  doc.setTextColor(...INK)
  doc.text(`Phones: ${num(totals.phones)} visits (${pct(totals.phones, devices)})`, M, y + 12)
  doc.text(`Computers: ${num(totals.computers)} visits (${pct(totals.computers, devices)})`, PAGE_W - M, y + 12, { align: 'right' })
  y += 22

  // Social cards by design.
  if (report.cardDesigns.length) {
    heading('Social cards by design', 'Which designs people downloaded and shared.')
    table(
      ['Design', 'Downloaded', 'Shared', 'Total'],
      report.cardDesigns.map((d) => [d.name, d.downloads, d.shares, d.downloads + d.shares]),
    )
  }

  // Submissions.
  if (report.testimonies) {
    heading('Testimonies', `${num(report.testimonies.videos)} of them have a video.`)
    table(['Where they stand', 'Testimonies'], report.testimonies.status.map((row) => [row.name, row.count]))
    room(30)
    table(['Type', 'Testimonies'], report.testimonies.categories.map((row) => [row.name, row.count]))
  }
  if (report.stories) {
    heading('Sons of the Prophet stories', `${num(report.stories.videos)} of them have a video.`)
    table(['Where they stand', 'Stories'], report.stories.status.map((row) => [row.name, row.count]))
  }
  if (report.guests) {
    heading(
      'International guests',
      `Not counting anyone we can't accommodate: ${num(report.guests.pickup)} need an airport pickup, ${num(report.guests.accommodation)} need accommodation, and ${num(report.guests.travelling)} people are travelling in all, companions included.`,
    )
    table(['Where things stand', 'Guests'], report.guests.status.map((row) => [row.name, row.count]))
    if (report.guests.countries.length) {
      room(30)
      table(['Comes from', 'Guests'], report.guests.countries.map((row) => [row.name, row.count]))
    }
  }

  // Every day.
  heading('Day by day', 'Every day since the first visit, newest first.')
  const head = ['Day', 'Visits', 'First-time', 'Cards made', 'Downloaded', 'Shared']
  if (report.testimonies) head.push('Testimonies')
  if (report.stories) head.push('Stories')
  if (report.guests) head.push('Guests')
  const row = (d: ReportDay) => {
    const cells: (string | number)[] = [long(d.day), d.visits, d.newVisitors, d.cards, d.downloads, d.shares]
    if (report.testimonies) cells.push(d.testimonies ?? 0)
    if (report.stories) cells.push(d.stories ?? 0)
    if (report.guests) cells.push(d.guests ?? 0)
    return cells
  }
  const all = (pick: (d: ReportDay) => number | null) => days.reduce((s, d) => s + (pick(d) ?? 0), 0)
  const foot: (string | number)[] = ['All days', totals.visits, totals.visitors, totals.cards, totals.downloads, totals.shares]
  if (report.testimonies) foot.push(all((d) => d.testimonies))
  if (report.stories) foot.push(all((d) => d.stories))
  if (report.guests) foot.push(all((d) => d.guests))
  table(head, [...days].reverse().map(row), foot)

  // Page numbers.
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...SOFT)
    doc.text('Dunamis at 30 website statistics', M, PAGE_H - 9)
    doc.text(`Page ${page} of ${pages}`, PAGE_W - M, PAGE_H - 9, { align: 'right' })
  }

  doc.save(`Dunamis-at-30-statistics-${report.lastDay}.pdf`)
}
