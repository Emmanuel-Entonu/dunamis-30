import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The dashboard's visitor and social card counts. A plain table, not a Payload collection: nothing
 * reads it through the API, so there's nothing for a stranger to reach, and it holds no one's name
 * or address. One row per device per day, and one per card made.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "payload"."site_events" (
    "id" bigserial PRIMARY KEY,
    "kind" varchar NOT NULL,
    "day" date NOT NULL,
    "first" boolean NOT NULL DEFAULT false,
    "country" varchar,
    "device" varchar,
    "created_at" timestamp(3) with time zone NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS "site_events_day_kind_idx" ON "payload"."site_events" ("day", "kind");
  CREATE INDEX IF NOT EXISTS "site_events_kind_first_idx" ON "payload"."site_events" ("kind", "first");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "payload"."site_events";`)
}
