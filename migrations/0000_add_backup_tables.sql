CREATE TABLE "ad_impressions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"ad_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"session_id" varchar(255),
	"device_id" varchar(255),
	"watched_duration" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"skipped" boolean DEFAULT false NOT NULL,
	"skipped_at" integer,
	"clicked_through" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role_id" integer NOT NULL,
	"token" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_by_id" varchar(255),
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "admin_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"precedence" integer NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"role_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"invited_by" varchar(255),
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "advertisements" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"video_url" text NOT NULL,
	"thumbnail_url" text,
	"duration" integer DEFAULT 30 NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"advertiser" varchar(255),
	"target_url" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance_revisions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"attendance_id" varchar(255) NOT NULL,
	"revision_number" integer NOT NULL,
	"previous_status" varchar(20),
	"new_status" varchar(20),
	"previous_hours" integer,
	"new_hours" integer,
	"remarks" text,
	"action" varchar(20) NOT NULL,
	"action_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backup_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"backup_id" integer NOT NULL,
	"action" varchar(20) NOT NULL,
	"admin_id" varchar(255),
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_share_members" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"share_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'viewer' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_shares" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"owner_id" varchar(255) NOT NULL,
	"local_business_id" varchar(255) NOT NULL,
	"business_name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"chat_id" varchar(255) NOT NULL,
	"sender_id" varchar(255) NOT NULL,
	"sender_mode" varchar(10) NOT NULL,
	"content" text NOT NULL,
	"status" varchar(20) DEFAULT 'sent' NOT NULL,
	"client_message_id" varchar(255),
	"reply_to_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"edited_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "chat_participants" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"chat_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"user_mode" varchar(10) NOT NULL,
	"role" varchar(20) DEFAULT 'member',
	"last_read_at" timestamp,
	"last_read_message_id" varchar(255),
	"is_muted" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "collab_chats" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"type" varchar(20) DEFAULT 'direct' NOT NULL,
	"name" varchar(100),
	"connection_id" varchar(255),
	"last_message_at" timestamp,
	"last_message_preview" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collab_connection_invites" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"sender_id" varchar(255) NOT NULL,
	"sender_mode" varchar(10) NOT NULL,
	"target_phone" varchar(20) NOT NULL,
	"target_phone_normalized" varchar(20) NOT NULL,
	"target_user_id" varchar(255),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"responded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "collab_connections" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_a_id" varchar(255) NOT NULL,
	"user_a_mode" varchar(10) NOT NULL,
	"user_b_id" varchar(255) NOT NULL,
	"user_b_mode" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'accepted' NOT NULL,
	"nickname" varchar(100),
	"initiated_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_bindings" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"link_id" varchar(255) NOT NULL,
	"home_person_id" varchar(255) NOT NULL,
	"home_person_name" varchar(100),
	"staff_client_id" varchar(255) NOT NULL,
	"staff_client_name" varchar(100),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_links" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"home_user_id" varchar(255) NOT NULL,
	"home_account_id" varchar(100) NOT NULL,
	"staff_user_id" varchar(255) NOT NULL,
	"staff_account_id" varchar(100) NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"invitation_code" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "collaboration_messages" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"link_id" varchar(255) NOT NULL,
	"from_device_id" varchar(255),
	"message_type" varchar(50) NOT NULL,
	"payload" text NOT NULL,
	"state_version" integer DEFAULT 1 NOT NULL,
	"is_processed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"device_id" varchar(255) NOT NULL,
	"platform" varchar(50),
	"device_name" varchar(100),
	"push_token" text,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_share_members" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"share_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'viewer' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_shares" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"owner_id" varchar(255) NOT NULL,
	"local_household_id" varchar(255) NOT NULL,
	"household_name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "laundry_revisions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"laundry_id" varchar(255) NOT NULL,
	"revision_number" integer NOT NULL,
	"previous_data" text,
	"new_data" text,
	"remarks" text,
	"action" varchar(20) NOT NULL,
	"action_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"user_mode" varchar(10) NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"entity_type" varchar(50),
	"entity_id" varchar(255),
	"payload" text,
	"action_required" boolean DEFAULT false,
	"action_type" varchar(50),
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"is_actioned" boolean DEFAULT false,
	"actioned_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"phone" varchar(20) NOT NULL,
	"password_hash" text,
	"user_type" varchar(50),
	"display_name" varchar(100),
	"avatar_data" text,
	"avatar_updated_at" timestamp,
	"plan_tier" varchar(50),
	"subscription_status" varchar(50),
	"subscription_expiry_date" timestamp,
	"otp_hash" text,
	"otp_expires_at" timestamp,
	"otp_attempt_count" integer DEFAULT 0,
	"otp_attempt_reset_at" timestamp,
	"otp_last_sent_at" timestamp,
	"is_verified" boolean DEFAULT false,
	"is_new_user" boolean DEFAULT true,
	"onboarding_completed" boolean DEFAULT false,
	"preferred_language" varchar(10),
	"last_login_at" timestamp,
	"last_active_at" timestamp,
	"device_info" text,
	"is_active" boolean DEFAULT true,
	"connect_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shared_attendance" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"binding_id" varchar(255) NOT NULL,
	"date" varchar(10) NOT NULL,
	"status" varchar(20) NOT NULL,
	"hours_worked" integer,
	"note" text,
	"approval_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"submitted_by" varchar(255) NOT NULL,
	"submitted_by_role" varchar(10) NOT NULL,
	"action_required_by" varchar(255),
	"current_revision_id" varchar(255),
	"revision_count" integer DEFAULT 0,
	"record_salary_type" varchar(20),
	"record_rate" integer,
	"record_currency" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"rejected_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "shared_laundry" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"binding_id" varchar(255) NOT NULL,
	"date" varchar(10) NOT NULL,
	"items" text NOT NULL,
	"items_total" integer,
	"pickup_delivery" boolean DEFAULT false,
	"pickup_delivery_charge" integer,
	"total" integer NOT NULL,
	"service_type" varchar(50),
	"approval_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"submitted_by" varchar(255) NOT NULL,
	"submitted_by_role" varchar(10) NOT NULL,
	"action_required_by" varchar(255),
	"current_revision_id" varchar(255),
	"revision_count" integer DEFAULT 0,
	"record_currency" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"rejected_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_backups" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"phone_number" text NOT NULL,
	"backup_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"backup_data" jsonb,
	"checksum" text,
	"created_by_id" varchar(255),
	"restored_by_id" varchar(255),
	"restored_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_ad_id_advertisements_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."advertisements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_role_id_admin_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."admin_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_invited_by_id_admin_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_role_id_admin_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."admin_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_revisions" ADD CONSTRAINT "attendance_revisions_attendance_id_shared_attendance_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."shared_attendance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_revisions" ADD CONSTRAINT "attendance_revisions_action_by_users_id_fk" FOREIGN KEY ("action_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_logs" ADD CONSTRAINT "backup_logs_backup_id_user_backups_id_fk" FOREIGN KEY ("backup_id") REFERENCES "public"."user_backups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_logs" ADD CONSTRAINT "backup_logs_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_share_members" ADD CONSTRAINT "business_share_members_share_id_business_shares_id_fk" FOREIGN KEY ("share_id") REFERENCES "public"."business_shares"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_share_members" ADD CONSTRAINT "business_share_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_shares" ADD CONSTRAINT "business_shares_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_id_collab_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."collab_chats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_chat_id_collab_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."collab_chats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collab_chats" ADD CONSTRAINT "collab_chats_connection_id_collab_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."collab_connections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collab_connection_invites" ADD CONSTRAINT "collab_connection_invites_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collab_connection_invites" ADD CONSTRAINT "collab_connection_invites_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collab_connections" ADD CONSTRAINT "collab_connections_user_a_id_users_id_fk" FOREIGN KEY ("user_a_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collab_connections" ADD CONSTRAINT "collab_connections_user_b_id_users_id_fk" FOREIGN KEY ("user_b_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collab_connections" ADD CONSTRAINT "collab_connections_initiated_by_users_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_bindings" ADD CONSTRAINT "collaboration_bindings_link_id_collaboration_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."collaboration_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_links" ADD CONSTRAINT "collaboration_links_home_user_id_users_id_fk" FOREIGN KEY ("home_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_links" ADD CONSTRAINT "collaboration_links_staff_user_id_users_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_messages" ADD CONSTRAINT "collaboration_messages_link_id_collaboration_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."collaboration_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_messages" ADD CONSTRAINT "collaboration_messages_from_device_id_devices_id_fk" FOREIGN KEY ("from_device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_share_members" ADD CONSTRAINT "household_share_members_share_id_household_shares_id_fk" FOREIGN KEY ("share_id") REFERENCES "public"."household_shares"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_share_members" ADD CONSTRAINT "household_share_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_shares" ADD CONSTRAINT "household_shares_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_revisions" ADD CONSTRAINT "laundry_revisions_laundry_id_shared_laundry_id_fk" FOREIGN KEY ("laundry_id") REFERENCES "public"."shared_laundry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_revisions" ADD CONSTRAINT "laundry_revisions_action_by_users_id_fk" FOREIGN KEY ("action_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_attendance" ADD CONSTRAINT "shared_attendance_binding_id_collaboration_bindings_id_fk" FOREIGN KEY ("binding_id") REFERENCES "public"."collaboration_bindings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_attendance" ADD CONSTRAINT "shared_attendance_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_attendance" ADD CONSTRAINT "shared_attendance_action_required_by_users_id_fk" FOREIGN KEY ("action_required_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_laundry" ADD CONSTRAINT "shared_laundry_binding_id_collaboration_bindings_id_fk" FOREIGN KEY ("binding_id") REFERENCES "public"."collaboration_bindings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_laundry" ADD CONSTRAINT "shared_laundry_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_laundry" ADD CONSTRAINT "shared_laundry_action_required_by_users_id_fk" FOREIGN KEY ("action_required_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_backups" ADD CONSTRAINT "user_backups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_backups" ADD CONSTRAINT "user_backups_created_by_id_admin_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_backups" ADD CONSTRAINT "user_backups_restored_by_id_admin_users_id_fk" FOREIGN KEY ("restored_by_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;