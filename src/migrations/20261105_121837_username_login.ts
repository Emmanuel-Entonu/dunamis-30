import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."users" ALTER COLUMN "email" DROP NOT NULL;
  ALTER TABLE "payload"."users" ADD COLUMN "username" varchar;
  CREATE UNIQUE INDEX "users_username_idx" ON "payload"."users" USING btree ("username");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "payload"."users_username_idx";
  ALTER TABLE "payload"."users" ALTER COLUMN "email" SET NOT NULL;
  ALTER TABLE "payload"."users" DROP COLUMN "username";`)
}
