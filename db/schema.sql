-- LEGACY PROTOTYPE SCHEMA. NOT COMPATIBLE WITH EXISTING PostgreSQL 17. DO NOT APPLY TO PRODUCTION.
-- Portfolio v1: PostgreSQL 16+, idempotent initial schema.
-- Uses stable TEXT identifiers so exported IDs and later UUIDs can coexist.
CREATE TABLE IF NOT EXISTS profile (
 id TEXT PRIMARY KEY, name_ko TEXT NOT NULL, name_en TEXT, headline TEXT,
 intro_title_ko TEXT, intro_title_en TEXT, bio_ko TEXT, bio_en TEXT,
 school_name TEXT, department TEXT, current_grade INTEGER,
 academic_status TEXT, academic_plan TEXT, email TEXT, phone TEXT,
 github_url TEXT, instagram_url TEXT, youtube_url TEXT,
 keyda_url TEXT, primary_product_url TEXT, profile_image_id TEXT,
 is_public BOOLEAN NOT NULL DEFAULT TRUE, display_order INT NOT NULL DEFAULT 0,
 source_notion_id TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS projects (
 id TEXT PRIMARY KEY,slug TEXT NOT NULL UNIQUE,name TEXT NOT NULL,name_en TEXT,
 summary_ko TEXT,summary_en TEXT,description_ko TEXT,description_en TEXT,
 project_type TEXT NOT NULL DEFAULT 'Personal',
 status TEXT NOT NULL DEFAULT 'planning' CHECK(status IN ('planning','developing','operating','completed','closed','paused')),
 is_featured BOOLEAN NOT NULL DEFAULT FALSE,featured_order INT,
 started_at DATE,ended_at DATE,planned_end_at DATE,started_month TEXT,ended_month TEXT,planned_end_month TEXT,brand_started_at DATE,
 date_precision TEXT,start_date_source TEXT,end_date_estimated BOOLEAN DEFAULT FALSE,period_label TEXT,
 role TEXT,role_en TEXT,ownership TEXT,team_size INT,team_label TEXT,organization TEXT,organization_en TEXT,
 key_contributions TEXT,key_contributions_en TEXT,tech_stack_summary TEXT,result_summary TEXT,result_summary_en TEXT,lessons_learned TEXT,lessons_learned_en TEXT,
 github_url TEXT,live_url TEXT,store_url TEXT,source_url TEXT,evidence_url TEXT,
 source_code_visibility TEXT DEFAULT 'unavailable',linkedin_sync_status TEXT,
 source_notion_id TEXT,is_public BOOLEAN NOT NULL DEFAULT TRUE,display_order INT NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS projects_visible_order ON projects(is_public,display_order);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS period_label_en TEXT;
CREATE TABLE IF NOT EXISTS project_metrics (
 id TEXT PRIMARY KEY,project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 metric_key TEXT NOT NULL,metric_name TEXT NOT NULL,numeric_value NUMERIC,
 display_value TEXT NOT NULL,unit TEXT,comparison TEXT DEFAULT 'exact',measured_at DATE,
 source_type TEXT,is_verified BOOLEAN NOT NULL DEFAULT FALSE,note TEXT,
 is_public BOOLEAN NOT NULL DEFAULT TRUE,display_order INT NOT NULL DEFAULT 0,
 source_notion_id TEXT,created_at TIMESTAMPTZ DEFAULT now(),updated_at TIMESTAMPTZ DEFAULT now(),
 UNIQUE(project_id,metric_key));
CREATE TABLE IF NOT EXISTS technologies (
 id TEXT PRIMARY KEY,name TEXT NOT NULL UNIQUE,category TEXT NOT NULL,
 proficiency TEXT NOT NULL DEFAULT 'learning' CHECK(proficiency IN ('usable','learning','planned')),
 description_ko TEXT,description_en TEXT,is_public BOOLEAN NOT NULL DEFAULT TRUE,
 display_order INT NOT NULL DEFAULT 0,source_notion_id TEXT,
 created_at TIMESTAMPTZ DEFAULT now(),updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS project_technologies (
 project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 technology_id TEXT NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
 usage_note TEXT,is_primary BOOLEAN NOT NULL DEFAULT FALSE,
 effort_weight NUMERIC(5,2) CHECK(effort_weight IS NULL OR effort_weight BETWEEN 0 AND 100),
 verification_status TEXT NOT NULL DEFAULT 'confirmed' CHECK(verification_status IN ('confirmed','inferred','pending')),
 created_at TIMESTAMPTZ DEFAULT now(),updated_at TIMESTAMPTZ DEFAULT now(),
 PRIMARY KEY(project_id,technology_id));
CREATE TABLE IF NOT EXISTS experiences (
 id TEXT PRIMARY KEY,name TEXT NOT NULL,name_en TEXT,
 category TEXT NOT NULL,subcategory TEXT,organization TEXT,role TEXT,role_en TEXT,
 description_ko TEXT,description_en TEXT,outcome TEXT,outcome_en TEXT,location TEXT,
 started_at DATE,ended_at DATE,outcome_at DATE,date_precision TEXT,period_label TEXT,
 status TEXT DEFAULT 'completed',is_ongoing BOOLEAN DEFAULT FALSE,is_highlight BOOLEAN DEFAULT FALSE,
 credential_id TEXT,credential_url TEXT,source_url TEXT,linkedin_sync_status TEXT,
 is_public BOOLEAN NOT NULL DEFAULT TRUE,display_order INT NOT NULL DEFAULT 0,
 source_notion_id TEXT,created_at TIMESTAMPTZ DEFAULT now(),updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS recognitions (
 id TEXT PRIMARY KEY,experience_id TEXT UNIQUE REFERENCES experiences(id) ON DELETE SET NULL,
 title TEXT NOT NULL,title_en TEXT,recognition_type TEXT NOT NULL CHECK(recognition_type IN ('award','scholarship','badge')),
 award_name TEXT NOT NULL,award_name_en TEXT,rank_or_result TEXT,issuer TEXT,awarded_at DATE,
 academic_year TEXT,academic_term TEXT,related_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
 description TEXT,evidence_asset_id TEXT,is_public BOOLEAN NOT NULL DEFAULT TRUE,
 display_order INT DEFAULT 0,source_notion_id TEXT,
 created_at TIMESTAMPTZ DEFAULT now(),updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS certifications (
 id TEXT PRIMARY KEY,experience_id TEXT UNIQUE REFERENCES experiences(id) ON DELETE SET NULL,
 name TEXT NOT NULL,issuer TEXT NOT NULL,credential_number TEXT,
 issued_at DATE,expires_at DATE,status TEXT DEFAULT 'acquired',score TEXT,
 credential_url TEXT,note TEXT,is_public BOOLEAN DEFAULT TRUE,display_order INT DEFAULT 0,
 source_notion_id TEXT,created_at TIMESTAMPTZ DEFAULT now(),updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS education (
 id TEXT PRIMARY KEY,experience_id TEXT UNIQUE REFERENCES experiences(id) ON DELETE SET NULL,
 school_name TEXT NOT NULL,school_name_en TEXT,department TEXT,department_en TEXT,education_level TEXT,program_type TEXT,
 started_at DATE,ended_at DATE,expected_end_at DATE,status TEXT,description TEXT,
 is_public BOOLEAN DEFAULT TRUE,display_order INT DEFAULT 0,source_notion_id TEXT,
 created_at TIMESTAMPTZ DEFAULT now(),updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS employment (
 id TEXT PRIMARY KEY,experience_id TEXT UNIQUE REFERENCES experiences(id) ON DELETE SET NULL,
 company_name TEXT NOT NULL,company_name_en TEXT,employment_type TEXT,position TEXT,position_en TEXT,
 started_at DATE,ended_at DATE,responsibilities TEXT,tech_summary TEXT,
 description_ko TEXT,description_en TEXT,source_material_visibility TEXT DEFAULT 'private',
 is_public BOOLEAN DEFAULT TRUE,display_order INT DEFAULT 0,source_notion_id TEXT,
 created_at TIMESTAMPTZ DEFAULT now(),updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS leadership (
 id TEXT PRIMARY KEY,experience_id TEXT UNIQUE REFERENCES experiences(id) ON DELETE SET NULL,
 activity_name TEXT NOT NULL,activity_name_en TEXT,organization TEXT,organization_type TEXT,role TEXT,role_en TEXT,
 started_at DATE,ended_at DATE,started_month TEXT,ended_month TEXT,status TEXT DEFAULT 'completed',responsibilities TEXT,
 related_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,is_public BOOLEAN DEFAULT TRUE,
 display_order INT DEFAULT 0,source_notion_id TEXT,
 created_at TIMESTAMPTZ DEFAULT now(),updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS participations (
 id TEXT PRIMARY KEY,experience_id TEXT UNIQUE REFERENCES experiences(id) ON DELETE SET NULL,
 title TEXT NOT NULL,title_en TEXT,participation_type TEXT,organizer TEXT,instructor TEXT,
 location TEXT,started_at DATE,ended_at DATE,
 attendance_status TEXT NOT NULL DEFAULT 'unknown' CHECK(attendance_status IN ('planned','accepted','attended','completed','cancelled','not_attended','unknown')),
 role TEXT,description TEXT,outcome TEXT,
 related_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,is_public BOOLEAN DEFAULT TRUE,
 display_order INT DEFAULT 0,source_notion_id TEXT,
 created_at TIMESTAMPTZ DEFAULT now(),updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS goals (
 id TEXT PRIMARY KEY,title TEXT NOT NULL,title_en TEXT,description TEXT,
 target_period TEXT,target_date DATE,status TEXT DEFAULT 'planned',
 display_order INT DEFAULT 0,is_public BOOLEAN DEFAULT TRUE,source_notion_id TEXT,
 created_at TIMESTAMPTZ DEFAULT now(),updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS media_assets (
 id TEXT PRIMARY KEY,file_name TEXT NOT NULL,media_type TEXT NOT NULL,
 mime_type TEXT,storage_key TEXT,external_url TEXT,caption TEXT,source TEXT,
 is_public BOOLEAN DEFAULT FALSE,display_order INT DEFAULT 0,source_notion_id TEXT,
 created_at TIMESTAMPTZ DEFAULT now(),updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS asset_links (
 id TEXT PRIMARY KEY,asset_id TEXT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
 entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,asset_role TEXT NOT NULL DEFAULT 'proof',
 display_order INT DEFAULT 0,source_notion_id TEXT,created_at TIMESTAMPTZ DEFAULT now(),
 UNIQUE(asset_id,entity_type,entity_id,asset_role));
CREATE TABLE IF NOT EXISTS project_experiences (
 project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 experience_id TEXT NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
 PRIMARY KEY(project_id,experience_id));
CREATE TABLE IF NOT EXISTS tags (
 id TEXT PRIMARY KEY,name TEXT NOT NULL UNIQUE,category TEXT,
 is_public BOOLEAN DEFAULT TRUE,display_order INT DEFAULT 0,source_notion_id TEXT,
 created_at TIMESTAMPTZ DEFAULT now(),updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS experience_tags (
 experience_id TEXT NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
 tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
 PRIMARY KEY(experience_id,tag_id));
-- Editable, localized headlines, descriptions, chapter titles and other site copy.
CREATE TABLE IF NOT EXISTS site_content (
 key TEXT PRIMARY KEY,ko TEXT,en TEXT,group_name TEXT NOT NULL DEFAULT 'general',
 is_public BOOLEAN NOT NULL DEFAULT TRUE,display_order INT NOT NULL DEFAULT 0,
 updated_at TIMESTAMPTZ DEFAULT now());
-- Administrative change journal. No secrets/personal private data stored in audit details.
CREATE TABLE IF NOT EXISTS audit_log (
 id BIGSERIAL PRIMARY KEY,entity TEXT NOT NULL,entity_id TEXT NOT NULL,
 operation TEXT NOT NULL,at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS experiences_pub_idx ON experiences(is_public,started_at DESC);
CREATE INDEX IF NOT EXISTS assets_link_target_idx ON asset_links(entity_type,entity_id);
