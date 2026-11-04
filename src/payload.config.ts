import { resendAdapter } from '@payloadcms/email-resend'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Announcements, CardEvents, GalleryItems, Milestones } from './collections/Archive'
import { InternationalRegistrations } from './collections/InternationalRegistrations'
import { Media } from './collections/Media'
import { Registrations } from './collections/Registrations'
import { SonsStories } from './collections/SonsStories'
import { Testimonies } from './collections/Testimonies'
import { Users } from './collections/Users'
import { globals } from './globals'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Supabase Storage speaks S3. Without these env vars, uploads fall back to local disk (dev only).
const useSupabaseStorage = Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL,
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' — Dunamis@30 Admin' },
    components: {
      // Pending testimonies / stories and new international guests, at a glance.
      beforeDashboard: ['/components/admin/ReviewQueue#ReviewQueue'],
      graphics: { Logo: '/components/admin/Brand#Logo', Icon: '/components/admin/Brand#Icon' },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Testimonies,
    SonsStories,
    Registrations,
    InternationalRegistrations,
    CardEvents,
    Milestones,
    GalleryItems,
    Media,
    Announcements,
    Users,
  ],
  globals,
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  email: process.env.RESEND_API_KEY
    ? resendAdapter({
        apiKey: process.env.RESEND_API_KEY,
        defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com',
        defaultFromName: 'Dunamis at 30',
      })
    : undefined,
  sharp,
  plugins: [
    s3Storage({
      enabled: useSupabaseStorage,
      collections: { media: true },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || 'eu-west-2',
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
})
