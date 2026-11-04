import type { CollectionConfig } from 'payload'

import { isAdmin, isLogistics } from '@/access/roles'

export const Registrations: CollectionConfig = {
  slug: 'registrations',
  labels: { singular: 'Attendance registration', plural: 'Attendance registrations' },
  admin: {
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'fullName', 'country', 'city', 'partySize', 'mode', 'createdAt'],
    group: 'Registrations',
    listSearchableFields: ['reference', 'fullName', 'email', 'phone'],
    // Attendance registration was dropped (the event is open); kept only for any legacy data.
    hidden: true,
  },
  access: {
    read: isLogistics,
    create: isLogistics,
    update: isLogistics,
    delete: isAdmin,
  },
  fields: [
    { name: 'reference', type: 'text', unique: true, index: true, admin: { readOnly: true } },
    { name: 'fullName', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text', required: true },
    { type: 'row', fields: [
      { name: 'country', type: 'text', required: true },
      { name: 'city', type: 'text', required: true },
    ] },
    { name: 'branch', type: 'text', label: 'Church branch / location' },
    { name: 'partySize', type: 'number', min: 1, max: 50, defaultValue: 1, required: true, label: 'Number attending' },
    {
      name: 'mode',
      type: 'select',
      defaultValue: 'physical',
      options: [
        { label: 'Attending physically', value: 'physical' },
        { label: 'Joining online', value: 'online' },
      ],
    },
    { name: 'confirmationSent', type: 'checkbox', admin: { readOnly: true, position: 'sidebar' } },
  ],
}
