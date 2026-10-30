--
-- PostgreSQL database dump
--

\restrict nx404568e5Jj2X2GBRnNQwHE23uV6N3blbfXnl1AHUfL8sPiNxmrHQrYkcIBDaZ

-- Dumped from database version 17.11 (Debian 17.11-1.pgdg13+2)
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: portfolio_touch_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.portfolio_touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: asset_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_id uuid NOT NULL,
    profile_id uuid,
    project_id uuid,
    experience_id uuid,
    recognition_id uuid,
    certification_id uuid,
    asset_role text DEFAULT 'other'::text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT asset_links_asset_role_check CHECK ((asset_role = ANY (ARRAY['screenshot'::text, 'demo'::text, 'proof'::text, 'report'::text, 'certificate'::text, 'profile_photo'::text, 'document'::text, 'other'::text]))),
    CONSTRAINT asset_links_one_target_chk CHECK ((num_nonnulls(profile_id, project_id, experience_id, recognition_id, certification_id) = 1))
);


--
-- Name: certifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    experience_id uuid,
    name text NOT NULL,
    issuer text NOT NULL,
    credential_number text,
    issued_at date,
    expires_at date,
    status text DEFAULT 'acquired'::text NOT NULL,
    score text,
    credential_url text,
    note text,
    is_public boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    source_notion_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT certification_valid_date_chk CHECK (((issued_at IS NULL) OR (expires_at IS NULL) OR (expires_at >= issued_at))),
    CONSTRAINT certifications_status_check CHECK ((status = ANY (ARRAY['acquired'::text, 'expired'::text])))
);


--
-- Name: education; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.education (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    experience_id uuid,
    school_name text NOT NULL,
    department text,
    education_level text NOT NULL,
    program_type text,
    started_at date,
    ended_at date,
    expected_end_at date,
    status text NOT NULL,
    gpa numeric(4,2),
    gpa_scale numeric(4,2),
    description text,
    is_public boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    source_notion_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT education_education_level_check CHECK ((education_level = ANY (ARRAY['high_school'::text, 'college'::text, 'university'::text, 'graduate'::text, 'other'::text]))),
    CONSTRAINT education_gpa_chk CHECK (((gpa IS NULL) OR (gpa_scale IS NULL) OR ((gpa >= (0)::numeric) AND (gpa <= gpa_scale)))),
    CONSTRAINT education_status_check CHECK ((status = ANY (ARRAY['enrolled'::text, 'graduated'::text, 'planned'::text, 'leave'::text])))
);


--
-- Name: employment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    experience_id uuid,
    company_name text NOT NULL,
    employment_type text,
    "position" text,
    started_at date,
    ended_at date,
    responsibilities text,
    tech_summary text,
    description text,
    source_material_visibility text DEFAULT 'private'::text NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    source_notion_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT employment_source_material_visibility_check CHECK ((source_material_visibility = ANY (ARRAY['public'::text, 'private'::text])))
);


--
-- Name: experience_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.experience_tags (
    experience_id uuid NOT NULL,
    tag_id uuid NOT NULL
);


--
-- Name: experiences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.experiences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    subcategory text,
    organization text,
    role text,
    description text,
    content_markdown text,
    outcome text,
    location text,
    started_at date,
    ended_at date,
    outcome_at date,
    date_precision text,
    period_label text,
    status text DEFAULT 'completed'::text NOT NULL,
    is_ongoing boolean GENERATED ALWAYS AS ((status = 'ongoing'::text)) STORED,
    is_highlight boolean DEFAULT false NOT NULL,
    credential_id text,
    credential_url text,
    source_url text,
    linkedin_sync_status text,
    is_public boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    source_notion_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT experiences_category_check CHECK ((category = ANY (ARRAY['Education'::text, 'Work'::text, 'Leadership & Activity'::text, 'Program & Training'::text, 'Competition & Hackathon'::text, 'Event & Workshop'::text, 'Certification & Badge'::text, 'Scholarship'::text]))),
    CONSTRAINT experiences_date_precision_check CHECK ((date_precision = ANY (ARRAY['Exact'::text, 'Month'::text, 'Semester'::text, 'Year'::text]))),
    CONSTRAINT experiences_linkedin_sync_status_check CHECK ((linkedin_sync_status = ANY (ARRAY['Added'::text, 'To Add'::text, 'Skip'::text]))),
    CONSTRAINT experiences_status_check CHECK ((status = ANY (ARRAY['ongoing'::text, 'completed'::text, 'paused'::text])))
);


--
-- Name: goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    target_period text,
    target_date date,
    status text DEFAULT 'planned'::text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    source_notion_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT goals_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'active'::text, 'achieved'::text, 'cancelled'::text])))
);


--
-- Name: leadership; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leadership (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    experience_id uuid,
    activity_name text NOT NULL,
    organization text,
    organization_type text,
    role text,
    started_at date,
    ended_at date,
    status text DEFAULT 'completed'::text NOT NULL,
    responsibilities text,
    related_project_id uuid,
    is_public boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    source_notion_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT leadership_organization_type_check CHECK ((organization_type = ANY (ARRAY['central_club'::text, 'department_club'::text, 'campus_activity'::text, 'other'::text]))),
    CONSTRAINT leadership_status_check CHECK ((status = ANY (ARRAY['ongoing'::text, 'completed'::text, 'paused'::text])))
);


--
-- Name: media_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    file_name text,
    media_type text NOT NULL,
    mime_type text,
    storage_key text,
    external_url text,
    caption text,
    source text,
    is_public boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT media_asset_location_chk CHECK (((storage_key IS NULL) OR (length(btrim(storage_key)) > 0))),
    CONSTRAINT media_assets_media_type_check CHECK ((media_type = ANY (ARRAY['image'::text, 'video'::text, 'pdf'::text, 'document'::text, 'other'::text])))
);


--
-- Name: participations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    experience_id uuid,
    title text NOT NULL,
    participation_type text,
    organizer text,
    instructor text,
    location text,
    started_at date,
    ended_at date,
    attendance_status text DEFAULT 'unknown'::text NOT NULL,
    role text,
    description text,
    outcome text,
    related_project_id uuid,
    is_public boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    source_notion_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT participations_attendance_status_check CHECK ((attendance_status = ANY (ARRAY['unknown'::text, 'planned'::text, 'accepted'::text, 'attended'::text, 'completed'::text, 'cancelled'::text, 'not_attended'::text]))),
    CONSTRAINT participations_participation_type_check CHECK ((participation_type = ANY (ARRAY['event'::text, 'training'::text, 'workshop'::text, 'hackathon'::text, 'internship'::text, 'conference'::text, 'exhibition'::text, 'bootcamp'::text, 'competition'::text, 'study_abroad'::text, 'other'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_ko text NOT NULL,
    name_en text,
    headline text,
    intro_title text,
    bio text,
    school_name text,
    department text,
    current_grade smallint,
    academic_status text,
    academic_plan text,
    email text,
    phone text,
    github_url text,
    instagram_url text,
    youtube_url text,
    keyda_url text,
    primary_product_url text,
    profile_image_id uuid,
    is_public boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    source_notion_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT profiles_academic_status_check CHECK ((academic_status = ANY (ARRAY['enrolled'::text, 'graduated'::text, 'leave'::text, 'planned'::text]))),
    CONSTRAINT profiles_current_grade_check CHECK (((current_grade >= 1) AND (current_grade <= 6)))
);


--
-- Name: project_aliases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_aliases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    alias text NOT NULL,
    alias_type text DEFAULT 'previous_name'::text NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT project_aliases_alias_type_check CHECK ((alias_type = ANY (ARRAY['previous_name'::text, 'repository_name'::text, 'codename'::text, 'other'::text])))
);


--
-- Name: project_experiences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_experiences (
    project_id uuid NOT NULL,
    experience_id uuid NOT NULL,
    relationship_type text
);


--
-- Name: project_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    metric_key text NOT NULL,
    metric_name text NOT NULL,
    numeric_value numeric(18,4),
    display_value text NOT NULL,
    unit text,
    comparison text DEFAULT 'exact'::text NOT NULL,
    measured_at date,
    source_type text,
    is_verified boolean DEFAULT false NOT NULL,
    note text,
    is_public boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT project_metric_value_chk CHECK (((numeric_value IS NULL) OR (numeric_value >= (0)::numeric))),
    CONSTRAINT project_metrics_comparison_check CHECK ((comparison = ANY (ARRAY['exact'::text, 'minimum'::text, 'approximate'::text]))),
    CONSTRAINT project_metrics_source_type_check CHECK ((source_type = ANY (ARRAY['analytics'::text, 'user_reported'::text, 'repository_report'::text, 'other'::text])))
);


--
-- Name: project_technologies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_technologies (
    project_id uuid NOT NULL,
    technology_id uuid NOT NULL,
    usage_note text,
    is_primary boolean DEFAULT false NOT NULL
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    summary text,
    description text,
    content_markdown text,
    project_type text,
    status text DEFAULT 'planning'::text NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    featured_order integer,
    is_public boolean DEFAULT true NOT NULL,
    started_at date,
    ended_at date,
    planned_end_at date,
    date_precision text,
    start_date_source text,
    end_date_estimated boolean DEFAULT false NOT NULL,
    period_label text,
    role text,
    ownership text,
    team_size integer,
    team_label text,
    organization text,
    key_contributions text,
    tech_stack_summary text,
    result_summary text,
    lessons_learned text,
    github_url text,
    live_url text,
    store_url text,
    source_url text,
    evidence_url text,
    source_code_visibility text DEFAULT 'unavailable'::text NOT NULL,
    linkedin_sync_status text,
    source_notion_id text,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT projects_date_precision_check CHECK ((date_precision = ANY (ARRAY['Exact'::text, 'Month'::text, 'Semester'::text, 'Year'::text]))),
    CONSTRAINT projects_end_after_start_chk CHECK (((started_at IS NULL) OR (ended_at IS NULL) OR (ended_at >= started_at))),
    CONSTRAINT projects_linkedin_sync_status_check CHECK ((linkedin_sync_status = ANY (ARRAY['Added'::text, 'To Add'::text, 'Skip'::text]))),
    CONSTRAINT projects_planned_end_after_start_chk CHECK (((started_at IS NULL) OR (planned_end_at IS NULL) OR (planned_end_at >= started_at))),
    CONSTRAINT projects_project_type_check CHECK ((project_type = ANY (ARRAY['Personal'::text, 'Team'::text, 'Capstone'::text, 'Competition'::text, 'Work'::text, 'Club'::text, 'Academic'::text, 'Bootcamp'::text, 'Startup'::text, 'Product'::text]))),
    CONSTRAINT projects_slug_check CHECK ((slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text)),
    CONSTRAINT projects_source_code_visibility_check CHECK ((source_code_visibility = ANY (ARRAY['public'::text, 'private'::text, 'unavailable'::text]))),
    CONSTRAINT projects_status_check CHECK ((status = ANY (ARRAY['planning'::text, 'developing'::text, 'operating'::text, 'completed'::text, 'closed'::text, 'paused'::text]))),
    CONSTRAINT projects_team_size_check CHECK ((team_size > 0))
);


--
-- Name: recognitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recognitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    experience_id uuid,
    title text NOT NULL,
    recognition_type text NOT NULL,
    award_name text NOT NULL,
    rank_or_result text,
    issuer text,
    awarded_at date,
    academic_year text,
    academic_term text,
    related_project_id uuid,
    description text,
    evidence_asset_id uuid,
    is_public boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    source_notion_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT recognitions_recognition_type_check CHECK ((recognition_type = ANY (ARRAY['award'::text, 'scholarship'::text, 'badge'::text])))
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: technologies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.technologies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    proficiency text DEFAULT 'learning'::text NOT NULL,
    description text,
    is_public boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    source_notion_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT technologies_category_check CHECK ((category = ANY (ARRAY['language'::text, 'web_framework'::text, 'mobile'::text, 'database'::text, 'cloud_infra'::text, 'collaboration'::text, 'design'::text, 'ai_agent'::text, 'game_development'::text, 'data_ml'::text]))),
    CONSTRAINT technologies_proficiency_check CHECK ((proficiency = ANY (ARRAY['usable'::text, 'learning'::text, 'planned'::text])))
);


--
-- Name: technology_evidence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.technology_evidence (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    technology_id uuid NOT NULL,
    experience_id uuid,
    recognition_id uuid,
    participation_id uuid,
    education_id uuid,
    employment_id uuid,
    leadership_id uuid,
    certification_id uuid,
    evidence_kind text NOT NULL,
    evidence_note text NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT technology_evidence_check CHECK ((num_nonnulls(experience_id, recognition_id, participation_id, education_id, employment_id, leadership_id, certification_id) = 1)),
    CONSTRAINT technology_evidence_evidence_kind_check CHECK ((evidence_kind = ANY (ARRAY['practice'::text, 'learning'::text, 'attendance'::text, 'credential'::text]))),
    CONSTRAINT technology_evidence_evidence_note_check CHECK ((btrim(evidence_note) <> ''::text))
);


--
-- Name: asset_links asset_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_links
    ADD CONSTRAINT asset_links_pkey PRIMARY KEY (id);


--
-- Name: certifications certifications_experience_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_experience_id_key UNIQUE (experience_id);


--
-- Name: certifications certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_pkey PRIMARY KEY (id);


--
-- Name: certifications certifications_source_notion_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_source_notion_id_key UNIQUE (source_notion_id);


--
-- Name: education education_experience_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education
    ADD CONSTRAINT education_experience_id_key UNIQUE (experience_id);


--
-- Name: education education_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education
    ADD CONSTRAINT education_pkey PRIMARY KEY (id);


--
-- Name: education education_source_notion_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education
    ADD CONSTRAINT education_source_notion_id_key UNIQUE (source_notion_id);


--
-- Name: employment employment_experience_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employment
    ADD CONSTRAINT employment_experience_id_key UNIQUE (experience_id);


--
-- Name: employment employment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employment
    ADD CONSTRAINT employment_pkey PRIMARY KEY (id);


--
-- Name: employment employment_source_notion_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employment
    ADD CONSTRAINT employment_source_notion_id_key UNIQUE (source_notion_id);


--
-- Name: experience_tags experience_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experience_tags
    ADD CONSTRAINT experience_tags_pkey PRIMARY KEY (experience_id, tag_id);


--
-- Name: experiences experiences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experiences
    ADD CONSTRAINT experiences_pkey PRIMARY KEY (id);


--
-- Name: experiences experiences_source_notion_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experiences
    ADD CONSTRAINT experiences_source_notion_id_key UNIQUE (source_notion_id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: goals goals_source_notion_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_source_notion_id_key UNIQUE (source_notion_id);


--
-- Name: leadership leadership_experience_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leadership
    ADD CONSTRAINT leadership_experience_id_key UNIQUE (experience_id);


--
-- Name: leadership leadership_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leadership
    ADD CONSTRAINT leadership_pkey PRIMARY KEY (id);


--
-- Name: leadership leadership_source_notion_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leadership
    ADD CONSTRAINT leadership_source_notion_id_key UNIQUE (source_notion_id);


--
-- Name: media_assets media_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_pkey PRIMARY KEY (id);


--
-- Name: participations participations_experience_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participations
    ADD CONSTRAINT participations_experience_id_key UNIQUE (experience_id);


--
-- Name: participations participations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participations
    ADD CONSTRAINT participations_pkey PRIMARY KEY (id);


--
-- Name: participations participations_source_notion_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participations
    ADD CONSTRAINT participations_source_notion_id_key UNIQUE (source_notion_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_source_notion_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_source_notion_id_key UNIQUE (source_notion_id);


--
-- Name: project_aliases project_aliases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_aliases
    ADD CONSTRAINT project_aliases_pkey PRIMARY KEY (id);


--
-- Name: project_aliases project_aliases_project_id_alias_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_aliases
    ADD CONSTRAINT project_aliases_project_id_alias_key UNIQUE (project_id, alias);


--
-- Name: project_experiences project_experiences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_experiences
    ADD CONSTRAINT project_experiences_pkey PRIMARY KEY (project_id, experience_id);


--
-- Name: project_metrics project_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_metrics
    ADD CONSTRAINT project_metrics_pkey PRIMARY KEY (id);


--
-- Name: project_technologies project_technologies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_technologies
    ADD CONSTRAINT project_technologies_pkey PRIMARY KEY (project_id, technology_id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: projects projects_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_slug_key UNIQUE (slug);


--
-- Name: projects projects_source_notion_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_source_notion_id_key UNIQUE (source_notion_id);


--
-- Name: recognitions recognitions_experience_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognitions
    ADD CONSTRAINT recognitions_experience_id_key UNIQUE (experience_id);


--
-- Name: recognitions recognitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognitions
    ADD CONSTRAINT recognitions_pkey PRIMARY KEY (id);


--
-- Name: recognitions recognitions_source_notion_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognitions
    ADD CONSTRAINT recognitions_source_notion_id_key UNIQUE (source_notion_id);


--
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: technologies technologies_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technologies
    ADD CONSTRAINT technologies_name_key UNIQUE (name);


--
-- Name: technologies technologies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technologies
    ADD CONSTRAINT technologies_pkey PRIMARY KEY (id);


--
-- Name: technologies technologies_source_notion_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technologies
    ADD CONSTRAINT technologies_source_notion_id_key UNIQUE (source_notion_id);


--
-- Name: technology_evidence technology_evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technology_evidence
    ADD CONSTRAINT technology_evidence_pkey PRIMARY KEY (id);


--
-- Name: ix_asset_links_asset; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_asset_links_asset ON public.asset_links USING btree (asset_id);


--
-- Name: ix_asset_links_certification; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_asset_links_certification ON public.asset_links USING btree (certification_id) WHERE (certification_id IS NOT NULL);


--
-- Name: ix_asset_links_experience; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_asset_links_experience ON public.asset_links USING btree (experience_id) WHERE (experience_id IS NOT NULL);


--
-- Name: ix_asset_links_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_asset_links_project ON public.asset_links USING btree (project_id) WHERE (project_id IS NOT NULL);


--
-- Name: ix_certifications_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_certifications_date ON public.certifications USING btree (issued_at DESC);


--
-- Name: ix_education_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_education_start ON public.education USING btree (started_at DESC);


--
-- Name: ix_employment_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_employment_start ON public.employment USING btree (started_at DESC);


--
-- Name: ix_experience_tags_tag; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_experience_tags_tag ON public.experience_tags USING btree (tag_id);


--
-- Name: ix_experiences_listing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_experiences_listing ON public.experiences USING btree (is_public, category, started_at DESC);


--
-- Name: ix_experiences_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_experiences_status ON public.experiences USING btree (status);


--
-- Name: ix_goals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_goals_status ON public.goals USING btree (status);


--
-- Name: ix_leadership_related_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_leadership_related_project ON public.leadership USING btree (related_project_id);


--
-- Name: ix_leadership_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_leadership_start ON public.leadership USING btree (started_at DESC);


--
-- Name: ix_participations_related_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_participations_related_project ON public.participations USING btree (related_project_id);


--
-- Name: ix_participations_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_participations_start ON public.participations USING btree (started_at DESC);


--
-- Name: ix_project_aliases_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_project_aliases_project ON public.project_aliases USING btree (project_id);


--
-- Name: ix_project_experiences_exp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_project_experiences_exp ON public.project_experiences USING btree (experience_id);


--
-- Name: ix_project_metrics_project_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_project_metrics_project_date ON public.project_metrics USING btree (project_id, measured_at DESC);


--
-- Name: ix_project_technologies_tech; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_project_technologies_tech ON public.project_technologies USING btree (technology_id);


--
-- Name: ix_projects_listing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_projects_listing ON public.projects USING btree (is_public, is_featured DESC, display_order, started_at DESC);


--
-- Name: ix_projects_started_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_projects_started_at ON public.projects USING btree (started_at DESC);


--
-- Name: ix_projects_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_projects_status ON public.projects USING btree (status);


--
-- Name: ix_recognitions_award_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_recognitions_award_date ON public.recognitions USING btree (awarded_at DESC);


--
-- Name: ix_recognitions_related_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_recognitions_related_project ON public.recognitions USING btree (related_project_id);


--
-- Name: technology_evidence_certification; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX technology_evidence_certification ON public.technology_evidence USING btree (technology_id, certification_id) WHERE (certification_id IS NOT NULL);


--
-- Name: technology_evidence_education; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX technology_evidence_education ON public.technology_evidence USING btree (technology_id, education_id) WHERE (education_id IS NOT NULL);


--
-- Name: technology_evidence_employment; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX technology_evidence_employment ON public.technology_evidence USING btree (technology_id, employment_id) WHERE (employment_id IS NOT NULL);


--
-- Name: technology_evidence_experience; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX technology_evidence_experience ON public.technology_evidence USING btree (technology_id, experience_id) WHERE (experience_id IS NOT NULL);


--
-- Name: technology_evidence_leadership; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX technology_evidence_leadership ON public.technology_evidence USING btree (technology_id, leadership_id) WHERE (leadership_id IS NOT NULL);


--
-- Name: technology_evidence_participation; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX technology_evidence_participation ON public.technology_evidence USING btree (technology_id, participation_id) WHERE (participation_id IS NOT NULL);


--
-- Name: technology_evidence_recognition; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX technology_evidence_recognition ON public.technology_evidence USING btree (technology_id, recognition_id) WHERE (recognition_id IS NOT NULL);


--
-- Name: certifications trg_certifications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_certifications_updated_at BEFORE UPDATE ON public.certifications FOR EACH ROW EXECUTE FUNCTION public.portfolio_touch_updated_at();


--
-- Name: education trg_education_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_education_updated_at BEFORE UPDATE ON public.education FOR EACH ROW EXECUTE FUNCTION public.portfolio_touch_updated_at();


--
-- Name: employment trg_employment_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_employment_updated_at BEFORE UPDATE ON public.employment FOR EACH ROW EXECUTE FUNCTION public.portfolio_touch_updated_at();


--
-- Name: experiences trg_experiences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_experiences_updated_at BEFORE UPDATE ON public.experiences FOR EACH ROW EXECUTE FUNCTION public.portfolio_touch_updated_at();


--
-- Name: goals trg_goals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.portfolio_touch_updated_at();


--
-- Name: leadership trg_leadership_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_leadership_updated_at BEFORE UPDATE ON public.leadership FOR EACH ROW EXECUTE FUNCTION public.portfolio_touch_updated_at();


--
-- Name: media_assets trg_media_assets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_media_assets_updated_at BEFORE UPDATE ON public.media_assets FOR EACH ROW EXECUTE FUNCTION public.portfolio_touch_updated_at();


--
-- Name: participations trg_participations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_participations_updated_at BEFORE UPDATE ON public.participations FOR EACH ROW EXECUTE FUNCTION public.portfolio_touch_updated_at();


--
-- Name: profiles trg_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.portfolio_touch_updated_at();


--
-- Name: project_metrics trg_project_metrics_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_project_metrics_updated_at BEFORE UPDATE ON public.project_metrics FOR EACH ROW EXECUTE FUNCTION public.portfolio_touch_updated_at();


--
-- Name: projects trg_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.portfolio_touch_updated_at();


--
-- Name: recognitions trg_recognitions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recognitions_updated_at BEFORE UPDATE ON public.recognitions FOR EACH ROW EXECUTE FUNCTION public.portfolio_touch_updated_at();


--
-- Name: tags trg_tags_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tags_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.portfolio_touch_updated_at();


--
-- Name: technologies trg_technologies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_technologies_updated_at BEFORE UPDATE ON public.technologies FOR EACH ROW EXECUTE FUNCTION public.portfolio_touch_updated_at();


--
-- Name: asset_links asset_links_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_links
    ADD CONSTRAINT asset_links_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.media_assets(id) ON DELETE CASCADE;


--
-- Name: asset_links asset_links_certification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_links
    ADD CONSTRAINT asset_links_certification_id_fkey FOREIGN KEY (certification_id) REFERENCES public.certifications(id) ON DELETE CASCADE;


--
-- Name: asset_links asset_links_experience_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_links
    ADD CONSTRAINT asset_links_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES public.experiences(id) ON DELETE CASCADE;


--
-- Name: asset_links asset_links_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_links
    ADD CONSTRAINT asset_links_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: asset_links asset_links_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_links
    ADD CONSTRAINT asset_links_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: asset_links asset_links_recognition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_links
    ADD CONSTRAINT asset_links_recognition_id_fkey FOREIGN KEY (recognition_id) REFERENCES public.recognitions(id) ON DELETE CASCADE;


--
-- Name: certifications certifications_experience_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES public.experiences(id) ON DELETE SET NULL;


--
-- Name: education education_experience_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education
    ADD CONSTRAINT education_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES public.experiences(id) ON DELETE SET NULL;


--
-- Name: employment employment_experience_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employment
    ADD CONSTRAINT employment_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES public.experiences(id) ON DELETE SET NULL;


--
-- Name: experience_tags experience_tags_experience_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experience_tags
    ADD CONSTRAINT experience_tags_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES public.experiences(id) ON DELETE CASCADE;


--
-- Name: experience_tags experience_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experience_tags
    ADD CONSTRAINT experience_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: leadership leadership_experience_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leadership
    ADD CONSTRAINT leadership_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES public.experiences(id) ON DELETE SET NULL;


--
-- Name: leadership leadership_related_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leadership
    ADD CONSTRAINT leadership_related_project_id_fkey FOREIGN KEY (related_project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: participations participations_experience_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participations
    ADD CONSTRAINT participations_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES public.experiences(id) ON DELETE SET NULL;


--
-- Name: participations participations_related_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participations
    ADD CONSTRAINT participations_related_project_id_fkey FOREIGN KEY (related_project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_profile_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_profile_image_id_fkey FOREIGN KEY (profile_image_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;


--
-- Name: project_aliases project_aliases_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_aliases
    ADD CONSTRAINT project_aliases_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_experiences project_experiences_experience_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_experiences
    ADD CONSTRAINT project_experiences_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES public.experiences(id) ON DELETE CASCADE;


--
-- Name: project_experiences project_experiences_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_experiences
    ADD CONSTRAINT project_experiences_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_metrics project_metrics_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_metrics
    ADD CONSTRAINT project_metrics_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_technologies project_technologies_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_technologies
    ADD CONSTRAINT project_technologies_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_technologies project_technologies_technology_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_technologies
    ADD CONSTRAINT project_technologies_technology_id_fkey FOREIGN KEY (technology_id) REFERENCES public.technologies(id) ON DELETE CASCADE;


--
-- Name: recognitions recognitions_evidence_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognitions
    ADD CONSTRAINT recognitions_evidence_asset_id_fkey FOREIGN KEY (evidence_asset_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;


--
-- Name: recognitions recognitions_experience_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognitions
    ADD CONSTRAINT recognitions_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES public.experiences(id) ON DELETE SET NULL;


--
-- Name: recognitions recognitions_related_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognitions
    ADD CONSTRAINT recognitions_related_project_id_fkey FOREIGN KEY (related_project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: technology_evidence technology_evidence_certification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technology_evidence
    ADD CONSTRAINT technology_evidence_certification_id_fkey FOREIGN KEY (certification_id) REFERENCES public.certifications(id) ON DELETE RESTRICT;


--
-- Name: technology_evidence technology_evidence_education_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technology_evidence
    ADD CONSTRAINT technology_evidence_education_id_fkey FOREIGN KEY (education_id) REFERENCES public.education(id) ON DELETE RESTRICT;


--
-- Name: technology_evidence technology_evidence_employment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technology_evidence
    ADD CONSTRAINT technology_evidence_employment_id_fkey FOREIGN KEY (employment_id) REFERENCES public.employment(id) ON DELETE RESTRICT;


--
-- Name: technology_evidence technology_evidence_experience_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technology_evidence
    ADD CONSTRAINT technology_evidence_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES public.experiences(id) ON DELETE RESTRICT;


--
-- Name: technology_evidence technology_evidence_leadership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technology_evidence
    ADD CONSTRAINT technology_evidence_leadership_id_fkey FOREIGN KEY (leadership_id) REFERENCES public.leadership(id) ON DELETE RESTRICT;


--
-- Name: technology_evidence technology_evidence_participation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technology_evidence
    ADD CONSTRAINT technology_evidence_participation_id_fkey FOREIGN KEY (participation_id) REFERENCES public.participations(id) ON DELETE RESTRICT;


--
-- Name: technology_evidence technology_evidence_recognition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technology_evidence
    ADD CONSTRAINT technology_evidence_recognition_id_fkey FOREIGN KEY (recognition_id) REFERENCES public.recognitions(id) ON DELETE RESTRICT;


--
-- Name: technology_evidence technology_evidence_technology_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technology_evidence
    ADD CONSTRAINT technology_evidence_technology_id_fkey FOREIGN KEY (technology_id) REFERENCES public.technologies(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict nx404568e5Jj2X2GBRnNQwHE23uV6N3blbfXnl1AHUfL8sPiNxmrHQrYkcIBDaZ

