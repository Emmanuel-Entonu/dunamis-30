import type { CollectionConfig } from 'payload'

import { approvedOrEditor, isEditor, nameIfShown } from '@/access/roles'
import { afterSubmissionChange, afterSubmissionDelete, moderationFields, prepareSubmission, slugField, submitterFields, uploadedVideoFields, videoTicketEndpoint } from '@/fields/shared'

const mediaFields = ['photo', 'videoPoster']

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
    defaultColumns: ['title', 'name', 'category', 'hasVideo', 'status', 'updatedAt'],
    group: 'Stories',
    listSearchableFields: ['title', 'name', 'summary'],
    description: 'Testimonies shared on the website arrive as “Pending review”. Open one, read it or watch the video, then Approve (it goes live) or Reject.',
  },
  defaultSort: '-createdAt',
  access: {
    read: approvedOrEditor,
    // Public submissions go through the form's server action and always land as "pending".
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  hooks: {
    beforeChange: [prepareSubmission],
    afterChange: [afterSubmissionChange({ mediaFields, basePath: '/testimonies', tag: 'testimonies' })],
    afterDelete: [afterSubmissionDelete(mediaFields)],
  },
  endpoints: [videoTicketEndpoint],
  fields: [
    {
      name: 'reviewActions',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: { path: '/components/admin/ReviewActions#ReviewActions', clientProps: { basePath: '/testimonies' } } } },
    },
    ...uploadedVideoFields('testimony'),
    { name: 'title', type: 'text', required: true },
    { name: 'name', type: 'text', required: true, label: 'Full name', access: { read: nameIfShown } },
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
      label: 'Video link',
      admin: { description: 'Only for a video that lives on YouTube or Vimeo. Uploaded videos appear at the top of this page.' },
    },
    { name: 'views', type: 'number', defaultValue: 0, admin: { readOnly: true, position: 'sidebar' } },
    slugField('title'),
    ...moderationFields,
    submitterFields,
  ],
}
