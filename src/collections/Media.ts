import type { CollectionConfig } from 'payload'

import { anyone, isEditor } from '@/access/roles'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Media & Archive' },
  access: {
    read: anyone,
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
  ],
  upload: {
    mimeTypes: ['image/*', 'video/mp4', 'video/webm'],
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
