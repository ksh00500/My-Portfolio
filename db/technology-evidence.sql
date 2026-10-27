-- Additive PostgreSQL 17 extension. Apply manually ONLY after verified backup + Obsidian read-back.
-- This file is never loaded by application startup or deployment.
CREATE TABLE technology_evidence (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 technology_id uuid NOT NULL REFERENCES technologies(id) ON DELETE RESTRICT,
 experience_id uuid REFERENCES experiences(id) ON DELETE RESTRICT,
 recognition_id uuid REFERENCES recognitions(id) ON DELETE RESTRICT,
 participation_id uuid REFERENCES participations(id) ON DELETE RESTRICT,
 education_id uuid REFERENCES education(id) ON DELETE RESTRICT,
 employment_id uuid REFERENCES employment(id) ON DELETE RESTRICT,
 leadership_id uuid REFERENCES leadership(id) ON DELETE RESTRICT,
 certification_id uuid REFERENCES certifications(id) ON DELETE RESTRICT,
 evidence_kind text NOT NULL CHECK (evidence_kind IN ('practice','learning','attendance','credential')),
 evidence_note text NOT NULL CHECK (btrim(evidence_note) <> ''),
 is_public boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (num_nonnulls(experience_id,recognition_id,participation_id,education_id,employment_id,leadership_id,certification_id)=1)
);
CREATE UNIQUE INDEX technology_evidence_experience ON technology_evidence(technology_id,experience_id) WHERE experience_id IS NOT NULL;
CREATE UNIQUE INDEX technology_evidence_recognition ON technology_evidence(technology_id,recognition_id) WHERE recognition_id IS NOT NULL;
CREATE UNIQUE INDEX technology_evidence_participation ON technology_evidence(technology_id,participation_id) WHERE participation_id IS NOT NULL;
CREATE UNIQUE INDEX technology_evidence_education ON technology_evidence(technology_id,education_id) WHERE education_id IS NOT NULL;
CREATE UNIQUE INDEX technology_evidence_employment ON technology_evidence(technology_id,employment_id) WHERE employment_id IS NOT NULL;
CREATE UNIQUE INDEX technology_evidence_leadership ON technology_evidence(technology_id,leadership_id) WHERE leadership_id IS NOT NULL;
CREATE UNIQUE INDEX technology_evidence_certification ON technology_evidence(technology_id,certification_id) WHERE certification_id IS NOT NULL;
