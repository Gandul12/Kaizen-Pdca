CREATE TABLE "activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text,
	"action" varchar(50) NOT NULL,
	"detail" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kaizen_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"department" text NOT NULL,
	"leader" text NOT NULL,
	"team_members" text,
	"start_date" varchar(20),
	"due_date" varchar(20),
	"status" varchar(30) DEFAULT 'Draft' NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
	"content" jsonb NOT NULL,
	"project_password" text DEFAULT '' NOT NULL,
	"is_template" integer DEFAULT 0 NOT NULL,
	"template_name" text,
	"share_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kaizen_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"revision_number" integer NOT NULL,
	"trigger" varchar(50) NOT NULL,
	"snapshot_content" jsonb NOT NULL,
	"snapshot_status" varchar(30) NOT NULL,
	"snapshot_step" integer NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
