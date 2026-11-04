import type { CollectionConfig } from 'payload'

import { isAdmin, isLogistics } from '@/access/roles'
import { exportGuestsCsv } from './exportGuests'

export const InternationalRegistrations: CollectionConfig = {
  slug: 'international-registrations',
  labels: { singular: 'International participant', plural: 'International participants' },
  admin: {
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'fullName', 'country', 'arrivalDate', 'needsPickup', 'needsAccommodation', 'logisticsStatus'],
    group: 'Registrations',
    listSearchableFields: ['reference', 'fullName', 'email', 'whatsapp', 'flightNumber'],
    description: 'Applications from guests travelling from outside Nigeria. Contact the guest, then update the logistics status and notes.',
    components: { beforeListTable: ['/components/admin/ExportGuests#ExportGuests'] },
  },
  endpoints: [{ path: '/export.csv', method: 'get', handler: exportGuestsCsv }],
  defaultSort: '-createdAt',
  access: {
    read: isLogistics,
    create: isLogistics,
    update: isLogistics,
    delete: isAdmin,
  },
  fields: [
    { name: 'reference', type: 'text', unique: true, index: true, admin: { readOnly: true } },
    {
      name: 'logisticsStatus',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New request', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Arrangements confirmed', value: 'confirmed' },
        { label: 'Cannot accommodate', value: 'declined' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'logisticsNotes', type: 'textarea', admin: { position: 'sidebar' } },
    {
      type: 'collapsible',
      label: 'Personal details',
      fields: [
        { name: 'fullName', type: 'text', required: true },
        { type: 'row', fields: [
          { name: 'country', type: 'text', required: true, label: 'Country of residence' },
          { name: 'nationality', type: 'text' },
        ] },
        { type: 'row', fields: [
          { name: 'email', type: 'email', required: true },
          { name: 'whatsapp', type: 'text', required: true, label: 'WhatsApp number' },
        ] },
      ],
    },
    {
      type: 'collapsible',
      label: 'Travel information',
      fields: [
        { type: 'row', fields: [
          { name: 'arrivalDate', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
          { name: 'arrivalTime', type: 'text' },
        ] },
        { type: 'row', fields: [
          { name: 'airline', type: 'text' },
          { name: 'flightNumber', type: 'text' },
        ] },
        { type: 'row', fields: [
          { name: 'airport', type: 'text', label: 'Airport of arrival' },
          { name: 'departureDate', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
        ] },
      ],
    },
    {
      type: 'collapsible',
      label: 'Logistical assistance',
      fields: [
        { type: 'row', fields: [
          { name: 'needsPickup', type: 'checkbox', label: 'Requires airport pickup' },
          { name: 'needsAccommodation', type: 'checkbox', label: 'Requires accommodation assistance' },
        ] },
        { name: 'travellingWith', type: 'number', min: 0, max: 50, defaultValue: 0, label: 'People travelling with them' },
        { name: 'specialRequests', type: 'textarea' },
      ],
    },
    { name: 'confirmationSent', type: 'checkbox', admin: { readOnly: true, position: 'sidebar' } },
  ],
}
