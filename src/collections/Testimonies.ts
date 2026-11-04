import type { CollectionConfig } from 'payload'

import { approvedOrEditor, isEditor } from '@/access/roles'
import { moderationFields, slugField, stampPublishedAt, submitterFields } from '@/fields/shared'

export const testimonyCategories = [
  { label: 'Healing and Miracles', value: 'healing' },
  { label: 'Fruitfulness and Family', value: 'family' },
  { label: 'Financial Breakthrough and Prosperity', value: 'financial' },
  { label: 'Destiny Encounters', value: 'destiny' },
  { label: 'Deliverance and Freedom', value: 'deliverance' },
  { label: 'Career and Business Breakthroughs', value: 'career' },
  { label: 'Academic Excellence', value: 'academic' },
  { label: 'Spiritual Transformation', value: 'spiritual' },
  { label: 'Other Testimonies', value: 'other' },
] as const

export type TestimonyCategory = (typeof testimonyCategories)[number]['value']

export const Testimonies: CollectionConfig = {
  slug: 'testimonies',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'name', 'category', 'status', 'updatedAt'],
    group: 'Stories',
    listSearchableFields: ['title', 'name', 'summary'],
    description: 'Testimonies shared on the website arrive as “Pending review”. Open one, read it, then set Status to Approved (it goes live) or Rejected.',
  },
  defaultSort: '-createdAt',
  access: {
    read: approvedOrEditor,
    // Public submissions go through /api/submit (captcha + validation) and always land as "pending".
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  hooks: { beforeChange: [stampPublishedAt] },
  fields: [
    {
      name: 'reviewActions',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: { path: '/components/admin/ReviewActions#ReviewActions', clientProps: { basePath: '/testimonies' } } } },
    },
    { name: 'title', type: 'text', required: true },
    { name: 'name', type: 'text', required: true, label: 'Full name' },
    { name: 'location', type: 'text' },
    {
      name: 'category',
      type: 'select',
      required: true,
      index: true,
      options: testimonyCategories.map((c) => ({ ...c })),
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      maxLength: 320,
      admin: { description: 'Short introduction shown on cards.' },
    },
    { name: 'body', type: 'textarea', label: 'Full testimony' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    {
      name: 'videoUrl',
      type: 'text',
      admin: { description: 'YouTube, Facebook or Vimeo link.' },
    },
    { name: 'video', type: 'upload', relationTo: 'media', admin: { description: 'Or upload the video file.' } },
    { name: 'views', type: 'number', defaultValue: 0, admin: { readOnly: true, position: 'sidebar' } },
    slugField('title'),
    ...moderationFields,
    submitterFields,
  ],
}
