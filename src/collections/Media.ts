import type { CollectionConfig } from 'payload'

import { hasRole, isEditor } from '@/access/roles'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { hidden: true, group: 'Media & Archive' },
  access: {
    read: ({ req: { user } }) => (hasRole(user, 'admin', 'editor') ? true : { pendingReview: { not_equals: true } }),
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Describe the image for screen readers and search engines.' },
    },
    { name: 'caption', type: 'text' },
    // Set on photos that arrive with a public form. Approving the submission clears pendingReview.
    { name: 'pendingReview', type: 'checkbox', defaultValue: false, index: true, admin: { hidden: true } },
    { name: 'fromSubmission', type: 'checkbox', defaultValue: false, admin: { hidden: true } },
  ],
  upload: {
    mimeTypes: ['image/*'],
    focalPoint: true,
    imageSizes: [
      { name: 'thumb', width: 480, height: 480, position: 'centre', formatOptions: { format: 'webp' } },
      { name: 'card', width: 960, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'hero', width: 1920, formatOptions: { format: 'webp', options: { quality: 82 } } },
      // Open Graph previews for WhatsApp / Facebook link sharing.
      { name: 'og', width: 1200, height: 630, position: 'centre', formatOptions: { format: 'jpeg' } },
    ],
  },
}
