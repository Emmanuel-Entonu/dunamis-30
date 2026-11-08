import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** A YouTube link, by the same rule the site uses for links pasted into a testimony (findYouTubeLink). */
const YOUTUBE_LINK = String.raw`https?://(www\.|m\.)?(youtube\.com|youtu\.be)/[^[:space:]<>"'()]`

/**
 * Counts visits to the testimonies page, so the order there can hand out turns at the top fairly. It's
 * just a number, and holds nothing about anyone.
 *
 * Also marks testimonies with a YouTube link pasted into their words as having a video. Saving one does
 * that now, but some were saved before it did, and they should take their turns with the other videos.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS "payload"."testimony_rotation";`)
  await db.execute(sql`
   UPDATE "payload"."testimonies" SET "has_video" = true
   WHERE "has_video" IS NOT TRUE
     AND (coalesce("summary", '') ~* ${YOUTUBE_LINK} OR coalesce("body", '') ~* ${YOUTUBE_LINK});`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP SEQUENCE IF EXISTS "payload"."testimony_rotation";`)
}
