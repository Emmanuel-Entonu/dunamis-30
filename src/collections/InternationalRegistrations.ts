import type { CollectionConfig } from 'payload'

import { isAdmin, isLogistics } from '@/access/roles'
import { exportGuestsCsv } from './exportGuests'

export const InternationalRegistrations: CollectionConfig = {
  slug: 'international-registrations',
  labels: { singular: 'International guest', plural: 'International guests' },
  disableDuplicate: true,
  disableBulkEdit: true,
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'country', 'arrivalDate', 'needsPickup', 'needsAccommodation', 'logisticsStatus'],
    group: 'Submissions',
    listSearchableFields: ['reference', 'fullName', 'email', 'whatsapp', 'flightNumber'],
    hideAPIURL: true,
    description: 'People travelling in for the anniversary, from the website’s form for guests outside Nigeria. Contact them, then update where things stand. None of this appears on the website.',
    components: { beforeListTable: ['/components/admin/ListTabs#GuestTabs', '/components/admin/ExportGuests#ExportGuests'] },
  },
  endpoints: [{ path: '/export.csv', method: 'get', handler: exportGuestsCsv }],
  defaultSort: '-createdAt',
  access: {
    read: isLogistics,
    // Guests only ever come from the public form.
    create: () => false,
    update: isLogistics,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'guestPanel',
      type: 'ui',
      admin: { components: { Field: '/components/admin/ReviewPanels#GuestPanel' } },
    },
    {
      name: 'logisticsStatus',
      type: 'select',
      label: 'Where things stand',
      defaultValue: 'new',
      options: [
        { label: 'New request', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Arrangements confirmed', value: 'confirmed' },
        { label: 'Cannot accommodate', value: 'declined' },
      ],
      admin: { isClearable: false },
    },
    {
      name: 'logisticsNotes',
      type: 'textarea',
      label: 'Your notes',
      admin: { description: 'For the team only. Press Save when you’ve changed this or the box above.' },
    },
    {
      type: 'collapsible',
      label: 'Correct their details',
      admin: { initCollapsed: true },
      fields: [
        { name: 'fullName', type: 'text', required: true, label: 'Full name' },
        { type: 'row', fields: [
          { name: 'country', type: 'text', required: true, label: 'Comes from' },
          { name: 'nationality', type: 'text', label: 'Nationality' },
        ] },
        { type: 'row', fields: [
          { name: 'email', type: 'email', required: true, label: 'Email' },
          { name: 'whatsapp', type: 'text', required: true, label: 'WhatsApp number' },
        ] },
        { type: 'row', fields: [
          { name: 'arrivalDate', type: 'date', required: true, label: 'Arrives', admin: { date: { pickerAppearance: 'dayOnly' } } },
          { name: 'arrivalTime', type: 'text', label: 'Arrival time' },
        ] },
        { type: 'row', fields: [
          { name: 'airline', type: 'text', label: 'Airline' },
          { name: 'flightNumber', type: 'text', label: 'Flight number' },
        ] },
        { type: 'row', fields: [
          { name: 'airport', type: 'text', label: 'Airport' },
          { name: 'departureDate', type: 'date', label: 'Leaves', admin: { date: { pickerAppearance: 'dayOnly' } } },
        ] },
        { type: 'row', fields: [
          { name: 'needsPickup', type: 'checkbox', label: 'Airport pickup', admin: { components: { Cell: '/components/admin/Cells#YesNo' } } },
          { name: 'needsAccommodation', type: 'checkbox', label: 'Accommodation', admin: { components: { Cell: '/components/admin/Cells#YesNo' } } },
        ] },
        { name: 'travellingWith', type: 'number', min: 0, max: 50, defaultValue: 0, label: 'People travelling with them' },
        { name: 'specialRequests', type: 'textarea', label: 'Special requests' },
      ],
    },
    { name: 'reference', type: 'text', unique: true, index: true, label: 'Reference', admin: { readOnly: true, hidden: true } },
    { name: 'confirmationSent', type: 'checkbox', admin: { readOnly: true, hidden: true } },
  ],
}
