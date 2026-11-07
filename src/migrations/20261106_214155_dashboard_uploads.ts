import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."testimonies" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "payload"."testimonies" ALTER COLUMN "category" SET DEFAULT 'other';
  ALTER TABLE "payload"."testimonies" ALTER COLUMN "summary" DROP NOT NULL;
  ALTER TABLE "payload"."testimonies" ALTER COLUMN "consent_to_publish" SET DEFAULT true;
  ALTER TABLE "payload"."sons_stories" ALTER COLUMN "name" DROP NOT NULL;
  UPDATE "payload"."sons_stories" SET "headline" = COALESCE("name", 'A Sons of the Prophet story') WHERE "headline" IS NULL;
  ALTER TABLE "payload"."sons_stories" ALTER COLUMN "headline" SET NOT NULL;
  ALTER TABLE "payload"."sons_stories" ALTER COLUMN "consent_to_publish" SET DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."testimonies" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "payload"."testimonies" ALTER COLUMN "category" DROP DEFAULT;
  ALTER TABLE "payload"."testimonies" ALTER COLUMN "summary" SET NOT NULL;
  ALTER TABLE "payload"."testimonies" ALTER COLUMN "consent_to_publish" SET DEFAULT false;
  ALTER TABLE "payload"."sons_stories" ALTER COLUMN "headline" DROP NOT NULL;
  ALTER TABLE "payload"."sons_stories" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "payload"."sons_stories" ALTER COLUMN "consent_to_publish" SET DEFAULT false;`)
}
