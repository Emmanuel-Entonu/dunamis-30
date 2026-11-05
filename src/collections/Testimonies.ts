import type { CollectionConfig } from 'payload'

import { approvedOrEditor, isEditor, nameIfShown } from '@/access/roles'
import { afterSubmissionChange, afterSubmissionDelete, moderationFields, prepareSubmission, showNameField, slugField, submitterFields, uploadedVideoFields, videoTicketEndpoint } from '@/fields/shared'

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
  labels: { singular: 'Testimony', plural: 'Testimonies' },
  disableDuplicate: true,
  disableBulkEdit: true,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'name', 'category', 'hasVideo', 'status', 'createdAt'],
    group: 'Submissions',
    listSearchableFields: ['title', 'name', 'summary'],
    hideAPIURL: true,
    description: 'Testimonies people send from the website. Open one to read it or watch the video, then approve or reject it.',
    components: { beforeListTable: ['/components/admin/TestimonySwitch#TestimonyFormSwitch', '/components/admin/ListTabs#TestimonyTabs'] },
  },
  defaultSort: '-createdAt',
  access: {
    read: approvedOrEditor,
    // Testimonies only ever come from the public form, whose server action always saves them as "pending".
    create: () => false,
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
      name: 'reviewPanel',
      type: 'ui',
      admin: { components: { Field: '/components/admin/ReviewPanels#TestimonyPanel' } },
    },
    {
      type: 'collapsible',
      label: 'Fix a spelling mistake or change the wording',
      admin: { initCollapsed: true, description: 'Make your change, then press Save, Approve or Reject.' },
      fields: [
        { name: 'title', type: 'text', required: true, label: 'Title' },
        { name: 'name', type: 'text', required: true, label: 'From', access: { read: nameIfShown } },
        { name: 'location', type: 'text', label: 'Location' },
        {
          name: 'category',
          type: 'select',
          required: true,
          index: true,
          label: 'Type',
          options: testimonyCategories.map((c) => ({ ...c })),
        },
        {
          name: 'summary',
          type: 'textarea',
          required: true,
          maxLength: 320,
          label: 'In short',
          admin: { description: 'Shown on the testimony’s card on the website.' },
        },
        { name: 'body', type: 'textarea', label: 'Their testimony' },
        showNameField,
        submitterFields,
      ],
    },
    ...uploadedVideoFields,
    { name: 'photo', type: 'upload', relationTo: 'media', admin: { hidden: true } },
    { name: 'videoUrl', type: 'text', admin: { hidden: true } },
    { name: 'views', type: 'number', defaultValue: 0, admin: { readOnly: true, hidden: true } },
    slugField('title'),
    ...moderationFields,
  ],
}
