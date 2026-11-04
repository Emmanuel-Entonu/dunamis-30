import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE SCHEMA IF NOT EXISTS "payload";
   CREATE TYPE "payload"."enum_testimonies_category" AS ENUM('healing', 'family', 'financial', 'destiny', 'deliverance', 'career', 'academic', 'spiritual', 'other');
  CREATE TYPE "payload"."enum_testimonies_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "payload"."enum_sons_stories_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "payload"."enum_international_registrations_logistics_status" AS ENUM('new', 'contacted', 'confirmed', 'declined');
  CREATE TYPE "payload"."enum_card_events_action" AS ENUM('download', 'share');
  CREATE TYPE "payload"."enum_milestones_category" AS ENUM('beginnings', 'growth', 'expansion', 'conventions', 'international', 'facilities', 'breakthroughs');
  CREATE TYPE "payload"."enum_gallery_category" AS ENUM('historical', 'old-church', 'conventions', 'events', 'pastor', 'expansion', 'international', 'promo', 'documentaries');
  CREATE TYPE "payload"."enum_users_roles" AS ENUM('admin', 'editor', 'logistics');
  CREATE TYPE "payload"."enum_pastor_page_videos_kind" AS ENUM('sermon', 'interview', 'documentary', 'moment');
  CREATE TYPE "payload"."enum_site_socials_platform" AS ENUM('facebook', 'instagram', 'youtube', 'x', 'tiktok', 'whatsapp');
  CREATE TABLE "payload"."testimonies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"has_video" boolean DEFAULT false,
  	"video_file_path" varchar,
  	"video_file_size_bytes" numeric,
  	"video_file_duration_sec" numeric,
  	"video_file_width" numeric,
  	"video_file_height" numeric,
  	"video_poster_id" integer,
  	"title" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"location" varchar,
  	"category" "payload"."enum_testimonies_category" NOT NULL,
  	"summary" varchar NOT NULL,
  	"body" varchar,
  	"photo_id" integer,
  	"video_url" varchar,
  	"views" numeric DEFAULT 0,
  	"slug" varchar,
  	"status" "payload"."enum_testimonies_status" DEFAULT 'pending' NOT NULL,
  	"featured" boolean DEFAULT false,
  	"published_at" timestamp(3) with time zone,
  	"consent_to_publish" boolean DEFAULT false NOT NULL,
  	"show_name" boolean DEFAULT true,
  	"submitter_email" varchar,
  	"submitter_phone" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."sons_stories_milestones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"year" varchar,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."sons_stories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"has_video" boolean DEFAULT false,
  	"video_file_path" varchar,
  	"video_file_size_bytes" numeric,
  	"video_file_duration_sec" numeric,
  	"video_file_width" numeric,
  	"video_file_height" numeric,
  	"video_poster_id" integer,
  	"name" varchar NOT NULL,
  	"headline" varchar,
  	"location" varchar,
  	"current_role" varchar,
  	"before_photo_id" integer,
  	"after_photo_id" integer,
  	"video_url" varchar,
  	"story_before" varchar,
  	"story_encounter" varchar,
  	"story_transformation" varchar,
  	"story_today" varchar,
  	"story_meaning" varchar,
  	"appreciation" varchar,
  	"slug" varchar,
  	"status" "payload"."enum_sons_stories_status" DEFAULT 'pending' NOT NULL,
  	"featured" boolean DEFAULT false,
  	"published_at" timestamp(3) with time zone,
  	"consent_to_publish" boolean DEFAULT false NOT NULL,
  	"show_name" boolean DEFAULT true,
  	"submitter_email" varchar,
  	"submitter_phone" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."international_registrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar,
  	"logistics_status" "payload"."enum_international_registrations_logistics_status" DEFAULT 'new',
  	"logistics_notes" varchar,
  	"full_name" varchar NOT NULL,
  	"country" varchar NOT NULL,
  	"nationality" varchar,
  	"email" varchar NOT NULL,
  	"whatsapp" varchar NOT NULL,
  	"arrival_date" timestamp(3) with time zone NOT NULL,
  	"arrival_time" varchar,
  	"airline" varchar,
  	"flight_number" varchar,
  	"airport" varchar,
  	"departure_date" timestamp(3) with time zone,
  	"needs_pickup" boolean,
  	"needs_accommodation" boolean,
  	"travelling_with" numeric DEFAULT 0,
  	"special_requests" varchar,
  	"confirmation_sent" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."card_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"template" varchar,
  	"format" varchar,
  	"action" "payload"."enum_card_events_action",
  	"country" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."milestones" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"year" numeric NOT NULL,
  	"date_label" varchar,
  	"title" varchar NOT NULL,
  	"category" "payload"."enum_milestones_category",
  	"description" varchar,
  	"image_id" integer,
  	"video_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."gallery" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"year" numeric,
  	"event" varchar,
  	"category" "payload"."enum_gallery_category",
  	"image_id" integer,
  	"video_url" varchar,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"pending_review" boolean DEFAULT false,
  	"from_submission" boolean DEFAULT false,
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "payload"."users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "payload"."enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"testimonies_id" integer,
  	"sons_stories_id" integer,
  	"international_registrations_id" integer,
  	"card_events_id" integer,
  	"milestones_id" integer,
  	"gallery_id" integer,
  	"media_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."event" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT '30th Anniversary Service',
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"date_confirmed" boolean,
  	"venue" varchar,
  	"venue_confirmed" boolean,
  	"city" varchar DEFAULT 'Lord’s Garden, Airport Road, Abuja',
  	"online_attendance" boolean DEFAULT true,
  	"livestream_url" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."homepage_journey_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_headline" varchar,
  	"hero_message" varchar,
  	"hero_banner_id" integer,
  	"welcome" varchar,
  	"journey_heading" varchar,
  	"journey_body" varchar,
  	"journey_image_id" integer,
  	"sons_heading" varchar,
  	"sons_body" varchar,
  	"sons_image_id" integer,
  	"join_heading" varchar,
  	"join_body" varchar,
  	"join_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."story_page_vision_core_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."story_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"beginning_heading" varchar,
  	"beginning_body" varchar,
  	"beginning_image_id" integer,
  	"vision_heading" varchar,
  	"vision_body" varchar,
  	"vision_image_id" integer,
  	"global_impact_heading" varchar,
  	"global_impact_body" varchar,
  	"global_impact_image_id" integer,
  	"legacy_heading" varchar,
  	"legacy_body" varchar,
  	"legacy_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."pastor_page_achievements_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"year" varchar,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."pastor_page_videos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"kind" "payload"."enum_pastor_page_videos_kind"
  );
  
  CREATE TABLE "payload"."pastor_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"portrait_id" integer,
  	"full_name" varchar DEFAULT 'Dr. Paul Enenche',
  	"biography_heading" varchar,
  	"biography_body" varchar,
  	"biography_image_id" integer,
  	"calling_heading" varchar,
  	"calling_body" varchar,
  	"calling_image_id" integer,
  	"leadership_heading" varchar,
  	"leadership_body" varchar,
  	"leadership_image_id" integer,
  	"achievements_heading" varchar,
  	"achievements_body" varchar,
  	"achievements_image_id" integer,
  	"family_heading" varchar,
  	"family_body" varchar,
  	"family_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."impact_page_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" numeric NOT NULL,
  	"suffix" varchar,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."impact_page_stories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar,
  	"image_id" integer,
  	"video_url" varchar
  );
  
  CREATE TABLE "payload"."impact_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"intro" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."site_contacts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"email" varchar,
  	"phone" varchar,
  	"whatsapp" varchar
  );
  
  CREATE TABLE "payload"."site_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "payload"."enum_site_socials_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"official_website" varchar DEFAULT 'https://dunamisgospel.org',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload"."testimonies" ADD CONSTRAINT "testimonies_video_poster_id_media_id_fk" FOREIGN KEY ("video_poster_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."testimonies" ADD CONSTRAINT "testimonies_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."sons_stories_milestones" ADD CONSTRAINT "sons_stories_milestones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."sons_stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."sons_stories" ADD CONSTRAINT "sons_stories_video_poster_id_media_id_fk" FOREIGN KEY ("video_poster_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."sons_stories" ADD CONSTRAINT "sons_stories_before_photo_id_media_id_fk" FOREIGN KEY ("before_photo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."sons_stories" ADD CONSTRAINT "sons_stories_after_photo_id_media_id_fk" FOREIGN KEY ("after_photo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."milestones" ADD CONSTRAINT "milestones_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."gallery" ADD CONSTRAINT "gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonies_fk" FOREIGN KEY ("testimonies_id") REFERENCES "payload"."testimonies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sons_stories_fk" FOREIGN KEY ("sons_stories_id") REFERENCES "payload"."sons_stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_international_registrations_fk" FOREIGN KEY ("international_registrations_id") REFERENCES "payload"."international_registrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_card_events_fk" FOREIGN KEY ("card_events_id") REFERENCES "payload"."card_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_milestones_fk" FOREIGN KEY ("milestones_id") REFERENCES "payload"."milestones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gallery_fk" FOREIGN KEY ("gallery_id") REFERENCES "payload"."gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_journey_stats" ADD CONSTRAINT "homepage_journey_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage" ADD CONSTRAINT "homepage_hero_banner_id_media_id_fk" FOREIGN KEY ("hero_banner_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."homepage" ADD CONSTRAINT "homepage_journey_image_id_media_id_fk" FOREIGN KEY ("journey_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."homepage" ADD CONSTRAINT "homepage_sons_image_id_media_id_fk" FOREIGN KEY ("sons_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."homepage" ADD CONSTRAINT "homepage_join_image_id_media_id_fk" FOREIGN KEY ("join_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."story_page_vision_core_values" ADD CONSTRAINT "story_page_vision_core_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."story_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."story_page" ADD CONSTRAINT "story_page_beginning_image_id_media_id_fk" FOREIGN KEY ("beginning_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."story_page" ADD CONSTRAINT "story_page_vision_image_id_media_id_fk" FOREIGN KEY ("vision_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."story_page" ADD CONSTRAINT "story_page_global_impact_image_id_media_id_fk" FOREIGN KEY ("global_impact_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."story_page" ADD CONSTRAINT "story_page_legacy_image_id_media_id_fk" FOREIGN KEY ("legacy_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pastor_page_achievements_items" ADD CONSTRAINT "pastor_page_achievements_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pastor_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pastor_page_videos" ADD CONSTRAINT "pastor_page_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pastor_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pastor_page" ADD CONSTRAINT "pastor_page_portrait_id_media_id_fk" FOREIGN KEY ("portrait_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pastor_page" ADD CONSTRAINT "pastor_page_biography_image_id_media_id_fk" FOREIGN KEY ("biography_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pastor_page" ADD CONSTRAINT "pastor_page_calling_image_id_media_id_fk" FOREIGN KEY ("calling_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pastor_page" ADD CONSTRAINT "pastor_page_leadership_image_id_media_id_fk" FOREIGN KEY ("leadership_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pastor_page" ADD CONSTRAINT "pastor_page_achievements_image_id_media_id_fk" FOREIGN KEY ("achievements_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pastor_page" ADD CONSTRAINT "pastor_page_family_image_id_media_id_fk" FOREIGN KEY ("family_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."impact_page_stats" ADD CONSTRAINT "impact_page_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."impact_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."impact_page_stories" ADD CONSTRAINT "impact_page_stories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."impact_page_stories" ADD CONSTRAINT "impact_page_stories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."impact_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_contacts" ADD CONSTRAINT "site_contacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_socials" ADD CONSTRAINT "site_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_faqs" ADD CONSTRAINT "site_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "testimonies_has_video_idx" ON "payload"."testimonies" USING btree ("has_video");
  CREATE INDEX "testimonies_video_poster_idx" ON "payload"."testimonies" USING btree ("video_poster_id");
  CREATE INDEX "testimonies_category_idx" ON "payload"."testimonies" USING btree ("category");
  CREATE INDEX "testimonies_photo_idx" ON "payload"."testimonies" USING btree ("photo_id");
  CREATE UNIQUE INDEX "testimonies_slug_idx" ON "payload"."testimonies" USING btree ("slug");
  CREATE INDEX "testimonies_status_idx" ON "payload"."testimonies" USING btree ("status");
  CREATE INDEX "testimonies_published_at_idx" ON "payload"."testimonies" USING btree ("published_at");
  CREATE INDEX "testimonies_updated_at_idx" ON "payload"."testimonies" USING btree ("updated_at");
  CREATE INDEX "testimonies_created_at_idx" ON "payload"."testimonies" USING btree ("created_at");
  CREATE INDEX "sons_stories_milestones_order_idx" ON "payload"."sons_stories_milestones" USING btree ("_order");
  CREATE INDEX "sons_stories_milestones_parent_id_idx" ON "payload"."sons_stories_milestones" USING btree ("_parent_id");
  CREATE INDEX "sons_stories_has_video_idx" ON "payload"."sons_stories" USING btree ("has_video");
  CREATE INDEX "sons_stories_video_poster_idx" ON "payload"."sons_stories" USING btree ("video_poster_id");
  CREATE INDEX "sons_stories_before_photo_idx" ON "payload"."sons_stories" USING btree ("before_photo_id");
  CREATE INDEX "sons_stories_after_photo_idx" ON "payload"."sons_stories" USING btree ("after_photo_id");
  CREATE UNIQUE INDEX "sons_stories_slug_idx" ON "payload"."sons_stories" USING btree ("slug");
  CREATE INDEX "sons_stories_status_idx" ON "payload"."sons_stories" USING btree ("status");
  CREATE INDEX "sons_stories_published_at_idx" ON "payload"."sons_stories" USING btree ("published_at");
  CREATE INDEX "sons_stories_updated_at_idx" ON "payload"."sons_stories" USING btree ("updated_at");
  CREATE INDEX "sons_stories_created_at_idx" ON "payload"."sons_stories" USING btree ("created_at");
  CREATE UNIQUE INDEX "international_registrations_reference_idx" ON "payload"."international_registrations" USING btree ("reference");
  CREATE INDEX "international_registrations_updated_at_idx" ON "payload"."international_registrations" USING btree ("updated_at");
  CREATE INDEX "international_registrations_created_at_idx" ON "payload"."international_registrations" USING btree ("created_at");
  CREATE INDEX "card_events_template_idx" ON "payload"."card_events" USING btree ("template");
  CREATE INDEX "card_events_action_idx" ON "payload"."card_events" USING btree ("action");
  CREATE INDEX "card_events_updated_at_idx" ON "payload"."card_events" USING btree ("updated_at");
  CREATE INDEX "card_events_created_at_idx" ON "payload"."card_events" USING btree ("created_at");
  CREATE INDEX "milestones_image_idx" ON "payload"."milestones" USING btree ("image_id");
  CREATE INDEX "milestones_updated_at_idx" ON "payload"."milestones" USING btree ("updated_at");
  CREATE INDEX "milestones_created_at_idx" ON "payload"."milestones" USING btree ("created_at");
  CREATE INDEX "gallery_year_idx" ON "payload"."gallery" USING btree ("year");
  CREATE INDEX "gallery_event_idx" ON "payload"."gallery" USING btree ("event");
  CREATE INDEX "gallery_category_idx" ON "payload"."gallery" USING btree ("category");
  CREATE INDEX "gallery_image_idx" ON "payload"."gallery" USING btree ("image_id");
  CREATE INDEX "gallery_updated_at_idx" ON "payload"."gallery" USING btree ("updated_at");
  CREATE INDEX "gallery_created_at_idx" ON "payload"."gallery" USING btree ("created_at");
  CREATE INDEX "media_pending_review_idx" ON "payload"."media" USING btree ("pending_review");
  CREATE INDEX "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "payload"."media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "payload"."media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "payload"."media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "payload"."media" USING btree ("sizes_og_filename");
  CREATE INDEX "users_roles_order_idx" ON "payload"."users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "payload"."users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_testimonies_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("testimonies_id");
  CREATE INDEX "payload_locked_documents_rels_sons_stories_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("sons_stories_id");
  CREATE INDEX "payload_locked_documents_rels_international_registration_idx" ON "payload"."payload_locked_documents_rels" USING btree ("international_registrations_id");
  CREATE INDEX "payload_locked_documents_rels_card_events_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("card_events_id");
  CREATE INDEX "payload_locked_documents_rels_milestones_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("milestones_id");
  CREATE INDEX "payload_locked_documents_rels_gallery_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("gallery_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");
  CREATE INDEX "homepage_journey_stats_order_idx" ON "payload"."homepage_journey_stats" USING btree ("_order");
  CREATE INDEX "homepage_journey_stats_parent_id_idx" ON "payload"."homepage_journey_stats" USING btree ("_parent_id");
  CREATE INDEX "homepage_hero_hero_banner_idx" ON "payload"."homepage" USING btree ("hero_banner_id");
  CREATE INDEX "homepage_journey_journey_image_idx" ON "payload"."homepage" USING btree ("journey_image_id");
  CREATE INDEX "homepage_sons_sons_image_idx" ON "payload"."homepage" USING btree ("sons_image_id");
  CREATE INDEX "homepage_join_join_image_idx" ON "payload"."homepage" USING btree ("join_image_id");
  CREATE INDEX "story_page_vision_core_values_order_idx" ON "payload"."story_page_vision_core_values" USING btree ("_order");
  CREATE INDEX "story_page_vision_core_values_parent_id_idx" ON "payload"."story_page_vision_core_values" USING btree ("_parent_id");
  CREATE INDEX "story_page_beginning_beginning_image_idx" ON "payload"."story_page" USING btree ("beginning_image_id");
  CREATE INDEX "story_page_vision_vision_image_idx" ON "payload"."story_page" USING btree ("vision_image_id");
  CREATE INDEX "story_page_global_impact_global_impact_image_idx" ON "payload"."story_page" USING btree ("global_impact_image_id");
  CREATE INDEX "story_page_legacy_legacy_image_idx" ON "payload"."story_page" USING btree ("legacy_image_id");
  CREATE INDEX "pastor_page_achievements_items_order_idx" ON "payload"."pastor_page_achievements_items" USING btree ("_order");
  CREATE INDEX "pastor_page_achievements_items_parent_id_idx" ON "payload"."pastor_page_achievements_items" USING btree ("_parent_id");
  CREATE INDEX "pastor_page_videos_order_idx" ON "payload"."pastor_page_videos" USING btree ("_order");
  CREATE INDEX "pastor_page_videos_parent_id_idx" ON "payload"."pastor_page_videos" USING btree ("_parent_id");
  CREATE INDEX "pastor_page_portrait_idx" ON "payload"."pastor_page" USING btree ("portrait_id");
  CREATE INDEX "pastor_page_biography_biography_image_idx" ON "payload"."pastor_page" USING btree ("biography_image_id");
  CREATE INDEX "pastor_page_calling_calling_image_idx" ON "payload"."pastor_page" USING btree ("calling_image_id");
  CREATE INDEX "pastor_page_leadership_leadership_image_idx" ON "payload"."pastor_page" USING btree ("leadership_image_id");
  CREATE INDEX "pastor_page_achievements_achievements_image_idx" ON "payload"."pastor_page" USING btree ("achievements_image_id");
  CREATE INDEX "pastor_page_family_family_image_idx" ON "payload"."pastor_page" USING btree ("family_image_id");
  CREATE INDEX "impact_page_stats_order_idx" ON "payload"."impact_page_stats" USING btree ("_order");
  CREATE INDEX "impact_page_stats_parent_id_idx" ON "payload"."impact_page_stats" USING btree ("_parent_id");
  CREATE INDEX "impact_page_stories_order_idx" ON "payload"."impact_page_stories" USING btree ("_order");
  CREATE INDEX "impact_page_stories_parent_id_idx" ON "payload"."impact_page_stories" USING btree ("_parent_id");
  CREATE INDEX "impact_page_stories_image_idx" ON "payload"."impact_page_stories" USING btree ("image_id");
  CREATE INDEX "site_contacts_order_idx" ON "payload"."site_contacts" USING btree ("_order");
  CREATE INDEX "site_contacts_parent_id_idx" ON "payload"."site_contacts" USING btree ("_parent_id");
  CREATE INDEX "site_socials_order_idx" ON "payload"."site_socials" USING btree ("_order");
  CREATE INDEX "site_socials_parent_id_idx" ON "payload"."site_socials" USING btree ("_parent_id");
  CREATE INDEX "site_faqs_order_idx" ON "payload"."site_faqs" USING btree ("_order");
  CREATE INDEX "site_faqs_parent_id_idx" ON "payload"."site_faqs" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."testimonies" CASCADE;
  DROP TABLE "payload"."sons_stories_milestones" CASCADE;
  DROP TABLE "payload"."sons_stories" CASCADE;
  DROP TABLE "payload"."international_registrations" CASCADE;
  DROP TABLE "payload"."card_events" CASCADE;
  DROP TABLE "payload"."milestones" CASCADE;
  DROP TABLE "payload"."gallery" CASCADE;
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."users_roles" CASCADE;
  DROP TABLE "payload"."users_sessions" CASCADE;
  DROP TABLE "payload"."users" CASCADE;
  DROP TABLE "payload"."payload_kv" CASCADE;
  DROP TABLE "payload"."payload_locked_documents" CASCADE;
  DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload"."payload_preferences" CASCADE;
  DROP TABLE "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload"."payload_migrations" CASCADE;
  DROP TABLE "payload"."event" CASCADE;
  DROP TABLE "payload"."homepage_journey_stats" CASCADE;
  DROP TABLE "payload"."homepage" CASCADE;
  DROP TABLE "payload"."story_page_vision_core_values" CASCADE;
  DROP TABLE "payload"."story_page" CASCADE;
  DROP TABLE "payload"."pastor_page_achievements_items" CASCADE;
  DROP TABLE "payload"."pastor_page_videos" CASCADE;
  DROP TABLE "payload"."pastor_page" CASCADE;
  DROP TABLE "payload"."impact_page_stats" CASCADE;
  DROP TABLE "payload"."impact_page_stories" CASCADE;
  DROP TABLE "payload"."impact_page" CASCADE;
  DROP TABLE "payload"."site_contacts" CASCADE;
  DROP TABLE "payload"."site_socials" CASCADE;
  DROP TABLE "payload"."site_faqs" CASCADE;
  DROP TABLE "payload"."site" CASCADE;
  DROP TYPE "payload"."enum_testimonies_category";
  DROP TYPE "payload"."enum_testimonies_status";
  DROP TYPE "payload"."enum_sons_stories_status";
  DROP TYPE "payload"."enum_international_registrations_logistics_status";
  DROP TYPE "payload"."enum_card_events_action";
  DROP TYPE "payload"."enum_milestones_category";
  DROP TYPE "payload"."enum_gallery_category";
  DROP TYPE "payload"."enum_users_roles";
  DROP TYPE "payload"."enum_pastor_page_videos_kind";
  DROP TYPE "payload"."enum_site_socials_platform";`)
}
