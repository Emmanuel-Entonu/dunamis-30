import type { PayloadHandler } from 'payload'

import { hasRole } from '@/access/roles'
import type { InternationalRegistration } from '@/payload-types'

const columns: [string, (g: InternationalRegistration) => unknown][] = [
  ['Reference', (g) => g.reference],
  ['Status', (g) => g.logisticsStatus],
  ['Full name', (g) => g.fullName],
  ['Country of residence', (g) => g.country],
  ['Nationality', (g) => g.nationality],
  ['Email', (g) => g.email],
  ['WhatsApp', (g) => g.whatsapp],
  ['Arrival date', (g) => g.arrivalDate?.slice(0, 10)],
  ['Arrival time', (g) => g.arrivalTime],
  ['Airline', (g) => g.airline],
  ['Flight number', (g) => g.flightNumber],
  ['Airport', (g) => g.airport],
  ['Departure date', (g) => g.departureDate?.slice(0, 10)],
  ['Needs pickup', (g) => (g.needsPickup ? 'Yes' : 'No')],
  ['Needs accommodation', (g) => (g.needsAccommodation ? 'Yes' : 'No')],
  ['Travelling with', (g) => g.travellingWith],
  ['Special requests', (g) => g.specialRequests],
  ['Logistics notes', (g) => g.logisticsNotes],
  ['Submitted', (g) => g.createdAt],
]

/** Quotes a CSV cell, and stops guest-typed text being run as a spreadsheet formula. */
export const csvCell = (value: unknown) => {
  const text = String(value ?? '')
  const isPhone = /^\+?[\d\s()-]+$/.test(text)
  const safe = /^[=+\-@\t\r]/.test(text) && !isPhone ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

/** GET /api/international-registrations/export.csv, for admin and logistics users. */
export const exportGuestsCsv: PayloadHandler = async (req) => {
  if (!hasRole(req.user as never, 'admin', 'logistics')) return Response.json({ error: 'Not allowed' }, { status: 403 })

  const { docs } = await req.payload.find({
    collection: 'international-registrations',
    sort: '-createdAt',
    depth: 0,
    pagination: false,
    overrideAccess: false,
    user: req.user,
  })

  const rows = [columns.map(([title]) => csvCell(title)).join(','), ...docs.map((g) => columns.map(([, read]) => csvCell(read(g))).join(','))]
  // The BOM makes Excel read names with accents correctly.
  return new Response(`﻿${rows.join('\r\n')}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="dunamis30-international-guests-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
