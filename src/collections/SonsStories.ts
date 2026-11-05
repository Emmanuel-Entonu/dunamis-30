import type { CollectionConfig } from 'payload'

import { approvedOrEditor, isEditor, nameIfShown } from '@/access/roles'
import { afterSubmissionChange, afterSubmissionDelete, moderationFields, prepareSubmission, showNameField, slugField, submitterFields, uploadedVideoFields, videoTicketEndpoint } from '@/fields/shared'

const mediaFields = ['beforePhoto', 'afterPhoto', 'videoPoster']

export const SonsStories: CollectionConfig = {
  slug: 'sons-stories',
  labels: { singular: 'Sons of the Prophet story', plural: 'Sons of the Prophet stories' },
  disableDuplicate: true,
  disableBulkEdit: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'headline', 'location', 'hasVideo', 'status', 'createdAt'],
    group: 'Submissions',
    hideAPIURL: true,
    description: 'Stories people send from the website. Open one to read it, then approve or reject it.',
    components: { beforeListTable: ['/components/admin/ListTabs#StoryTabs'] },
  },
  defaultSort: '-createdAt',
  access: {
    read: approvedOrEditor,
    // Stories only ever come from the public form, whose server action always saves them as "pending".
    create: () => false,
    update: isEditor,
    delete: isEditor,
  },
  hooks: {
    beforeChange: [prepareSubmission],
    afterChange: [afterSubmissionChange({ mediaFields, basePath: '/sons-of-the-prophet', tag: 'sons-stories' })],
    afterDelete: [afterSubmissionDelete(mediaFields)],
  },
  endpoints: [videoTicketEndpoint],
  fields: [
    {
      name: 'reviewPanel',
      type: 'ui',
      admin: { components: { Field: '/components/admin/ReviewPanels#StoryPanel' } },
    },
    {
      type: 'collapsible',
      label: 'Fix a spelling mistake or change the wording',
      admin: { initCollapsed: true, description: 'Make your change, then press Save, Approve or Reject.' },
      fields: [
        { name: 'name', type: 'text', required: true, label: 'From', access: { read: nameIfShown } },
        { name: 'headline', type: 'text', label: 'Headline' },
        { name: 'location', type: 'text', label: 'Location' },
        { name: 'currentRole', type: 'text', label: 'Where they are today, in one line' },
        {
          name: 'story',
          type: 'group',
          label: 'Their story',
          fields: [
            { name: 'before', type: 'textarea', label: 'Who they were before Dunamis' },
            { name: 'encounter', type: 'textarea', label: 'Their journey and encounter' },
            { name: 'transformation', type: 'textarea', label: 'How they were transformed' },
            { name: 'today', type: 'textarea', label: 'Where they are today' },
            { name: 'meaning', type: 'textarea', label: 'What Dunamis means to them' },
          ],
        },
        {
          name: 'milestones',
          type: 'array',
          label: 'Milestones',
          fields: [
            { name: 'year', type: 'text', label: 'Year' },
            { name: 'text', type: 'text', required: true, label: 'What happened' },
          ],
        },
        { name: 'appreciation', type: 'textarea', label: 'Their message of appreciation' },
        showNameField,
        submitterFields,
      ],
    },
    ...uploadedVideoFields,
    { name: 'beforePhoto', type: 'upload', relationTo: 'media', admin: { hidden: true } },
    { name: 'afterPhoto', type: 'upload', relationTo: 'media', admin: { hidden: true } },
    { name: 'videoUrl', type: 'text', admin: { hidden: true } },
    slugField('name'),
    ...moderationFields,
  ],
}
