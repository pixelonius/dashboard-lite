-- CreateEnum
CREATE TYPE "role" AS ENUM ('ADMIN', 'SALES', 'MARKETING', 'CSM');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "role" NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "csm" TEXT,
    "total_paid" INTEGER,
    "onboarding_call" BOOLEAN,
    "one_on_one" BOOLEAN,
    "went_through_course" BOOLEAN,
    "mocks_20_done" BOOLEAN,
    "applied_5_roles" BOOLEAN,
    "secured_interview" BOOLEAN,
    "secured_role" BOOLEAN,
    "active" BOOLEAN DEFAULT true,
    "weekly_calls_limit" INTEGER DEFAULT 2,
    "tags" VARCHAR[],
    "notes" TEXT,
    "progress_tracker_sheet" TEXT,
    "updated_at" TIMESTAMPTZ(6),
    "plan_type" VARCHAR,
    "installments" INTEGER,
    "installment_value" INTEGER,
    "next_payment_due_date" TIMESTAMPTZ(6),
    "program_price" INTEGER DEFAULT 5000,
    "slack_channel_created" BOOLEAN,
    "slack_user_id" VARCHAR,
    "onboarding_call_start_date" TIMESTAMPTZ(6),
    "onboarding_call_join_url" VARCHAR,
    "onboarding_call_not_booked_notification_sent" BOOLEAN,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "lead_id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "phone" VARCHAR(20),
    "captured_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "utm_source" VARCHAR(255),
    "utm_medium" VARCHAR(255),
    "utm_campaign" VARCHAR(255),
    "utm_content" VARCHAR(255),
    "utm_term" VARCHAR(255),
    "source" VARCHAR(100),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("lead_id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "paid_at" TIMESTAMPTZ(6),
    "name" TEXT,
    "email" TEXT,
    "total_amount" INTEGER,
    "net_amount" INTEGER,
    "payment_processor" TEXT,
    "payment_method" TEXT,
    "assigned_closer" INTEGER,
    "assigned_setter" INTEGER,
    "assigned_source" VARCHAR[],
    "product_id" INTEGER,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "product_id" SERIAL NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "product_type" VARCHAR(100),
    "price" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "stripe_id" VARCHAR(255),

    CONSTRAINT "products_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "booked_calls" (
    "id" SERIAL NOT NULL,
    "event_created" TIMESTAMPTZ(6),
    "event_start_date" TIMESTAMPTZ(6),
    "event_end_date" TIMESTAMPTZ(6),
    "lead_name" TEXT,
    "lead_email" TEXT,
    "host_name" TEXT,
    "host_email" TEXT,
    "host_calendly_uri" TEXT,
    "event_uri" TEXT,
    "event_type_uri" TEXT,
    "routing_form_submission" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_content" TEXT,
    "utm_term" TEXT,
    "cancelled" BOOLEAN,
    "24h_reminder_sent" BOOLEAN,
    "1h_reminder_sent" BOOLEAN,
    "join_url" VARCHAR,
    "lead_timezone" VARCHAR,
    "event_name" TEXT,
    "setter" TEXT,

    CONSTRAINT "booked_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_performance" (
    "performance_id" SERIAL NOT NULL,
    "campaign_id" VARCHAR(100) NOT NULL,
    "ad_set_id" VARCHAR(100) NOT NULL,
    "creative_id" VARCHAR(100) NOT NULL,
    "date" DATE NOT NULL,
    "ad_spend" DECIMAL(10,2) DEFAULT 0.00,
    "impressions" INTEGER DEFAULT 0,
    "clicks" INTEGER DEFAULT 0,
    "leads_captured" INTEGER DEFAULT 0,
    "ctr" DECIMAL(5,2),
    "cpc" DECIMAL(10,2),
    "cpl" DECIMAL(10,2),
    "conversions" INTEGER DEFAULT 0,
    "revenue_attributed" DECIMAL(10,2) DEFAULT 0.00,

    CONSTRAINT "ad_performance_pkey" PRIMARY KEY ("performance_id")
);

-- CreateTable
CREATE TABLE "contractors" (
    "contractor_id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "contractor_type" VARCHAR(100),
    "rate_per_piece" DECIMAL(10,2) DEFAULT 0.00,
    "total_pieces_delivered" INTEGER DEFAULT 0,
    "total_paid" DECIMAL(10,2) DEFAULT 0.00,
    "status" VARCHAR(50) DEFAULT 'ACTIVE',
    "start_date" DATE,

    CONSTRAINT "contractors_pkey" PRIMARY KEY ("contractor_id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "personal_email" TEXT,
    "company_email" TEXT,
    "crm_user_id" TEXT,
    "slack_user_id" TEXT,
    "role" TEXT,
    "created_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN,
    "commission" DECIMAL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "refund_id" VARCHAR(100) NOT NULL,
    "payment_id" VARCHAR(100) NOT NULL,
    "customer_id" INTEGER,
    "refund_amount" DECIMAL(10,2) NOT NULL,
    "refund_date" DATE NOT NULL,
    "refund_reason" TEXT,
    "processed_by" VARCHAR(255),
    "status" VARCHAR(50) DEFAULT 'PENDING',
    "email" VARCHAR(255) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("refund_id")
);

-- CreateTable
CREATE TABLE "students_check_ins" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR,
    "email" VARCHAR,
    "wins" VARCHAR,
    "goals" VARCHAR,
    "actions" VARCHAR,
    "challenges" VARCHAR,
    "support" VARCHAR,
    "kajabi_completion" VARCHAR,
    "training_sessions" VARCHAR,
    "mock_calls" VARCHAR,
    "time_effectiveness" INTEGER,
    "satisfaction" INTEGER,
    "feedback" VARCHAR,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL,
    "selected_outcome" VARCHAR,
    "something_learned_student_calls" VARCHAR,
    "something_learned_mock_calls" VARCHAR,

    CONSTRAINT "students_check_ins_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads_eod_reports" (
    "id" SERIAL NOT NULL,
    "date_of_reporting" TIMESTAMPTZ(6),
    "ad_spend" INTEGER,
    "followers" INTEGER,
    "leads" INTEGER,
    "bookings" INTEGER,
    "impressions" INTEGER,
    "clicks" INTEGER,

    CONSTRAINT "ads_eod_reports_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendly_coaches" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "user_uri" VARCHAR NOT NULL,

    CONSTRAINT "calendly_coaches_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendly_event_types" (
    "id" SERIAL NOT NULL,
    "event_name" VARCHAR NOT NULL,
    "event_type_uri" VARCHAR NOT NULL,
    "type" VARCHAR NOT NULL,
    "updated_at" TIMESTAMPTZ(6),
    "owner_name" VARCHAR NOT NULL,
    "owner_uri" VARCHAR NOT NULL,
    "internal_note" VARCHAR,
    "pooling_type" VARCHAR,

    CONSTRAINT "calendly_event_types_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ck_link_clicks" (
    "id" SERIAL NOT NULL,
    "clicked_at" TIMESTAMPTZ(6) NOT NULL,
    "type" VARCHAR,
    "name" VARCHAR,
    "email" VARCHAR,
    "subscriber_id" VARCHAR,

    CONSTRAINT "ck_link_clicks_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "closers_eod_reports" (
    "id" SERIAL NOT NULL,
    "date_of_reporting" TIMESTAMPTZ(6),
    "closer" TEXT,
    "calls_on_calendar" INTEGER,
    "live_calls" INTEGER,
    "offers_made" INTEGER,
    "deposits" INTEGER,
    "closes" INTEGER,
    "cash_collected" INTEGER,
    "revenue" INTEGER,
    "struggles" TEXT,
    "notes" TEXT,

    CONSTRAINT "closers_eod_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_setters_eod_reports" (
    "id" SERIAL NOT NULL,
    "setter" VARCHAR,
    "date_of_reporting" TIMESTAMPTZ(6),
    "new_outbound_convos" INTEGER,
    "outbound_responses" INTEGER,
    "new_inbound_convos" INTEGER,
    "follow_ups" INTEGER,
    "links_sent" INTEGER,
    "calls_proposed" INTEGER,
    "total_calls_booked" INTEGER,
    "qualified_calls_booked" INTEGER,
    "emails_of_qualified_calls_booked" VARCHAR,
    "sets_scheduled_today" INTEGER,
    "sets_taken_today" INTEGER,
    "sets_closed_today" INTEGER,
    "set_outcomes_today" VARCHAR,
    "revenue_generated" INTEGER,
    "new_cash_collected" INTEGER,
    "recurring_cash_collected" INTEGER,
    "hours_worked_today" INTEGER,
    "performance" INTEGER,
    "submitted_at" TIMESTAMPTZ(6),
    "notes" VARCHAR,
    "dms_sent" INTEGER,
    "conversations_started" INTEGER,
    "no_shows_today" INTEGER,
    "reschedules" INTEGER,
    "unqualified_leads" INTEGER,

    CONSTRAINT "dm_setters_eod_reports_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_payments" (
    "id" SERIAL NOT NULL,
    "paid_at" TIMESTAMPTZ(6),
    "product" TEXT,
    "lead_name" TEXT,
    "lead_email" TEXT,
    "total_amount" INTEGER,
    "net_amount" INTEGER,
    "payment_processor" TEXT,
    "payment_method" TEXT,

    CONSTRAINT "events_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_submissions" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6),
    "name" TEXT,
    "email" TEXT,
    "form_id" TEXT,
    "form_name" TEXT,
    "submission_id" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_term" TEXT,
    "utm_content" TEXT,
    "source" TEXT,
    "json_payload" VARCHAR,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peer_advisor_application" (
    "id" SERIAL NOT NULL,
    "submitted_at" TIMESTAMPTZ(6),
    "time_in_ast" VARCHAR,
    "unpaid" VARCHAR,
    "agreements" VARCHAR[],
    "full_name" VARCHAR,
    "email" VARCHAR,
    "slack_handle" VARCHAR,
    "timezone" VARCHAR,
    "availability" VARCHAR[],
    "languages" VARCHAR,
    "current_focus" VARCHAR,
    "mock_calls" VARCHAR,
    "support" VARCHAR[],
    "industries" VARCHAR[],
    "peers_supporting" VARCHAR,
    "preferred_touchpoint" VARCHAR[],
    "open_to_scrimmage" VARCHAR,
    "formal_coaching" VARCHAR,
    "pilot_length" VARCHAR,
    "confidence" VARCHAR,
    "motivation" VARCHAR,
    "consent" VARCHAR,
    "full_name_signature" VARCHAR,

    CONSTRAINT "peer_advisor_application_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setters_eod_reports" (
    "id" SERIAL NOT NULL,
    "date_of_reporting" TIMESTAMPTZ(6),
    "setter" TEXT,
    "calls_made" INTEGER,
    "pick_ups" INTEGER,
    "booked_calls" INTEGER,
    "reschedules" INTEGER,
    "no_shows" INTEGER,
    "unqualified_leads" INTEGER,
    "sms_emails_sent" INTEGER,
    "notes" TEXT,

    CONSTRAINT "setters_eod_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students_fathom_recordings" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER,
    "fathom_recording_url" VARCHAR,
    "created_at" TIMESTAMPTZ(6),

    CONSTRAINT "students_fathom_recordings_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members_bonuses" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "amount" INTEGER,
    "description" VARCHAR,

    CONSTRAINT "team_members_bonuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webinar_registrants" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR,
    "email" VARCHAR,
    "phone" VARCHAR,
    "webinar_id" VARCHAR,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joined_webinar_at" TIMESTAMPTZ(6),
    "left_webinar_at" TIMESTAMPTZ(6),
    "utm_source" VARCHAR,
    "utm_medium" VARCHAR,
    "utm_campaign" VARCHAR,
    "utm_term" VARCHAR,
    "utm_content" VARCHAR,
    "blast_sent" BOOLEAN,
    "1h_reminder_sent" BOOLEAN,
    "15min_reminder_sent" BOOLEAN,

    CONSTRAINT "webinar_registrants_pk" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "products_stripe_id_key" ON "products"("stripe_id");

-- CreateIndex
CREATE UNIQUE INDEX "contractors_email_key" ON "contractors"("email");

