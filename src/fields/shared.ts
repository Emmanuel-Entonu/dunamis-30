import type { Field } from 'payload'

import { editorFieldOnly } from '@/access/roles'

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)

/** URL slug generated from another field when left blank. */
export const slugField = (from: string): Field => ({
  name: 'slug',
  type: 'text',
  index: true,
  unique: true,
  admin: { position: 'sidebar', description: 'Generated automatically. Used in the shareable link.' },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (value) return slugify(value)
        const source = data?.[from]
        if (typeof source !== 'string') return value
        return `${slugify(source)}-${Math.random().toString(36).slice(2, 6)}`
      },
    ],
  },
})

export const moderationFields: Field[] = [
  {
    name: 'status',
    type: 'select',
    defaultValue: 'pending',
    required: true,
    index: true,
    options: [
      { label: 'Pending review', value: 'pending' },
      { label: 'Approved / published', value: 'approved' },
      { label: 'Rejected', value: 'rejected' },
    ],
    admin: { position: 'sidebar' },
  },
  {
    name: 'featured',
    type: 'checkbox',
    defaultValue: false,
    admin: { hidden: true },
  },
  {
    name: 'publishedAt',
    type: 'date',
    index: true,
    admin: { position: 'sidebar' },
  },
  {
    name: 'consentToPublish',
    type: 'checkbox',
    required: true,
    admin: { position: 'sidebar' },
  },
  {
    name: 'showName',
    type: 'checkbox',
    defaultValue: true,
    admin: { position: 'sidebar', description: 'Display the person’s name publicly.' },
  },
]

export const submitterFields: Field = {
  name: 'submitter',
  type: 'group',
  access: { read: editorFieldOnly, update: editorFieldOnly },
  admin: { description: 'Private — never shown on the website.' },
  fields: [
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
  ],
}

/** Stamps publishedAt the first time something is approved. */
export const stampPublishedAt = ({ data }: { data?: Record<string, unknown> }) => {
  if (data?.status === 'approved' && !data.publishedAt) data.publishedAt = new Date().toISOString()
  return data
}

export const registrationReference = (prefix: string) => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(7))
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
  return `${prefix}-${code}`
}
