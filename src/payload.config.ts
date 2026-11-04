import { resendAdapter } from '@payloadcms/email-resend'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { CardEvents, GalleryItems, Milestones } from './collections/Archive'
import { InternationalRegistrations } from './collections/InternationalRegistrations'
import { Media } from './collections/Media'
import { SonsStories } from './collections/SonsStories'
import { Testimonies } from './collections/Testimonies'
import { Users } from './collections/Users'
import { globals } from './globals'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Supabase Storage speaks S3. Without these env vars, uploads fall back to local disk (dev only).
const useSupabaseStorage = Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID)

const databaseUrl = process.env.DATABASE_URL || ''
const isLocalDatabase = /@(localhost|127\.0\.0\.1)[:/]/.test(databaseUrl)

const database = postgresAdapter({
  // Not "public": Supabase publishes that schema through its Data API, where the public anon key
  // could reach it. Nothing outside this site can see the "payload" schema.
  schemaName: 'payload',
  // Schema changes go through src/migrations (npm run migrate), never an automatic push.
  push: false,
  pool: {
    connectionString: databaseUrl,
    ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false },
    // Each serverless instance keeps a few connections; the Supabase pooler shares them out.
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
  },
})

// When it can't connect, the adapter rejects an internal promise that nothing is listening to, as
// well as throwing the real error. Without this listener Node reports "unhandledRejection: undefined".
const startDatabase = database.init
database.init = (args) => {
  const adapter = startDatabase(args)
  ;(adapter as unknown as { initializing?: Promise<void> }).initializing?.catch(() => undefined)
  return adapter
}

export default buildConfig({
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
    InternationalRegistrations,
    CardEvents,
    Milestones,
    GalleryItems,
    Media,
    Users,
  ],
  globals,
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: database,
  // The site only uses Payload's REST API and Local API, so there's no reason to expose GraphQL.
  graphQL: { disable: true },
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
      // The admin uploads straight to storage, past the size limit on Vercel's functions.
      clientUploads: true,
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || 'eu-west-2',
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
          // Set when signing in to Supabase Storage with a project key instead of an S3 access key.
          ...(process.env.S3_SESSION_TOKEN ? { sessionToken: process.env.S3_SESSION_TOKEN } : {}),
        },
      },
    }),
  ],
})
