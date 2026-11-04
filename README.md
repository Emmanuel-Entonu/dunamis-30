# Dunamis at 30

The official website for the 30th anniversary of Dunamis International Gospel Centre, Abuja.

Built with Next.js and Payload CMS, on Supabase (Postgres and Storage) and Vercel.

## Run it locally

1. Copy `.env.example` to `.env` and fill it in.
2. `npm install`
3. `npm run dev`, then open http://localhost:3000. The admin is at `/admin`.

Without a database connection the public pages still load, using the default content in `src/lib`. The admin needs the database.

## Deploy to Vercel

1. Import this repository into Vercel.
2. Add every variable from `.env.example` under Settings > Environment Variables, using the production values. Set `NEXT_PUBLIC_SITE_URL` to the live domain.
3. Deploy. The `vercel-build` script applies any new database migrations, then builds the site.
4. Open `/admin` straight away and create the first account. It becomes the administrator, and that screen closes for good.

## Supabase

Two private storage buckets are needed:

| Bucket | Holds | Allowed types | Size limit |
| --- | --- | --- | --- |
| `media` | Photos, including those sent with public forms | `image/*` | 50 MB |
| `testimony-videos` | Videos sent with testimonies and stories | `video/mp4`, `video/webm`, `video/quicktime` | 50 MB |

All of Payload's tables live in a private `payload` schema, which Supabase's public Data API can't see. Keep them out of `public`.

The service role key has full access to the project. It must only ever be used on the server, and it must never be committed or given a `NEXT_PUBLIC_` name.

## Changing the content model

Payload does not change the live database by itself. After editing a collection or global:

```
npm run payload migrate:create short-description
npm run migrate
```

Commit the new file in `src/migrations`. Vercel applies it on the next deploy.

## How submissions work

Testimonies and Sons of the Prophet stories arrive as Pending review. Their photos and videos stay private until an editor approves them from the admin.

Videos are compressed in the visitor's browser to 720p H.264 (`src/lib/videoPipeline.ts`), then uploaded straight to Supabase with resumable uploads, using a signed ticket from the server (`src/lib/videoStorage.ts`). Visitors watch through `/watch/[kind]/[id]`, which checks approval and redirects to a temporary link.

The testimony library is shuffled by `src/lib/testimonyMix.ts`.

## Checks

```
npm test        # unit tests
npm run lint
npx tsc --noEmit
```

## Glass images

The glass objects in `src/assets/glass` and `src/assets/renders` are rendered from `src/components/three` by `scripts/capture-glass.mjs` and `scripts/capture-renders.mjs`, with the development server running.
