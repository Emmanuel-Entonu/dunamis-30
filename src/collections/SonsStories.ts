import type { CollectionConfig } from 'payload'

import { approvedOrEditor, isEditor, nameIfShown } from '@/access/roles'
import { afterSubmissionChange, afterSubmissionDelete, moderationFields, prepareSubmission, slugField, submitterFields, uploadedVideoFields, videoTicketEndpoint } from '@/fields/shared'

const mediaFields = ['beforePhoto', 'afterPhoto', 'videoPoster']

export const SonsStories: CollectionConfig = {
  slug: 'sons-stories',
  labels: { singular: 'Sons of the Prophet story', plural: 'Sons of the Prophet' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'headline', 'location', 'hasVideo', 'status', 'updatedAt'],
    group: 'Stories',
    description: 'Stories shared on the website arrive as “Pending review”. Approve to publish on Sons of the Prophet.',
  },
  defaultSort: '-createdAt',
  access: {
    read: approvedOrEditor,
    create: isEditor,
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
      name: 'reviewActions',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: { path: '/components/admin/ReviewActions#ReviewActions', clientProps: { basePath: '/sons-of-the-prophet' } } } },
    },
    ...uploadedVideoFields('story'),
    { name: 'name', type: 'text', required: true, access: { read: nameIfShown } },
    { name: 'headline', type: 'text', admin: { description: 'e.g. "From the back row to the pulpit".' } },
    { name: 'location', type: 'text' },
    { name: 'currentRole', type: 'text', label: 'Where I am today (one line)' },
    {
      type: 'row',
      fields: [
        { name: 'beforePhoto', type: 'upload', relationTo: 'media' },
        { name: 'afterPhoto', type: 'upload', relationTo: 'media' },
      ],
    },
    { name: 'videoUrl', type: 'text', label: 'Video link', admin: { description: 'Only for a video that lives on YouTube or Vimeo.' } },
    {
      name: 'story',
      type: 'group',
      fields: [
        { name: 'before', type: 'textarea', label: 'Who I was before encountering Dunamis' },
        { name: 'encounter', type: 'textarea', label: 'My journey and encounter' },
        { name: 'transformation', type: 'textarea', label: 'The transformation I experienced' },
        { name: 'today', type: 'textarea', label: 'Where I am today' },
        { name: 'meaning', type: 'textarea', label: 'What Dunamis means to me' },
      ],
    },
    {
      name: 'milestones',
      type: 'array',
      label: 'Ministry and career milestones',
      fields: [
        { name: 'year', type: 'text' },
        { name: 'text', type: 'text', required: true },
      ],
    },
    { name: 'appreciation', type: 'textarea', label: 'Personal message of appreciation' },
    slugField('name'),
    ...moderationFields,
    submitterFields,
  ],
}
