-- Saral PostgreSQL 15 Database Schema (PRD Section 4.2)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('consumer_owner', 'org_admin', 'org_member', 'platform_admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'pending_deletion', 'deleted');
CREATE TYPE org_type AS ENUM ('diagnostic_chain', 'home_care_provider', 'hospital', 'other');
CREATE TYPE sarvam_key_mode AS ENUM ('platform_pooled', 'byok');
CREATE TYPE org_role AS ENUM ('org_admin', 'org_member');
CREATE TYPE document_type AS ENUM ('prescription', 'discharge_summary');
CREATE TYPE scan_status AS ENUM ('pending_upload', 'queued', 'processing', 'completed', 'failed');
CREATE TYPE sarvam_key_source AS ENUM ('platform_pooled', 'org_byok');
CREATE TYPE ocr_confidence_enum AS ENUM ('high', 'medium', 'low');
CREATE TYPE consent_type_enum AS ENUM ('data_processing', 'ai_processing_third_party', 'marketing_communication');
CREATE TYPE share_status_enum AS ENUM ('pending', 'accepted', 'revoked', 'expired');
CREATE TYPE subject_type_enum AS ENUM ('user', 'organization');

-- 1. users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(15),
  email VARCHAR(255),
  password_hash VARCHAR(255),
  display_name VARCHAR(100) NOT NULL,
  preferred_ui_language VARCHAR(10) NOT NULL DEFAULT 'en-IN' CHECK (preferred_ui_language IN ('en-IN', 'hi-IN')),
  role user_role NOT NULL DEFAULT 'consumer_owner',
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX idx_users_phone_active ON users (phone_number) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_email_active ON users (email) WHERE deleted_at IS NULL;

-- 2. organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  org_type org_type NOT NULL,
  sarvam_key_mode sarvam_key_mode NOT NULL DEFAULT 'platform_pooled',
  sarvam_encrypted_key TEXT,
  plan_tier VARCHAR(50) NOT NULL DEFAULT 'org_starter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_byok_key CHECK (sarvam_key_mode != 'byok' OR sarvam_encrypted_key IS NOT NULL)
);

-- 3. organization_memberships
CREATE TABLE organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  org_role org_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

-- 4. patient_profiles
CREATE TABLE patient_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  display_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  default_target_language VARCHAR(10) NOT NULL DEFAULT 'hi-IN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_profile_owner CHECK (owner_user_id IS NOT NULL OR organization_id IS NOT NULL)
);
CREATE INDEX idx_patient_profiles_owner ON patient_profiles(owner_user_id);
CREATE INDEX idx_patient_profiles_org ON patient_profiles(organization_id);

-- 5. patient_profile_caseload_assignments
CREATE TABLE patient_profile_caseload_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_profile_id UUID NOT NULL REFERENCES patient_profiles(id),
  org_member_user_id UUID NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (patient_profile_id, org_member_user_id)
);

-- 6. scans
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_profile_id UUID NOT NULL REFERENCES patient_profiles(id),
  uploaded_by_user_id UUID NOT NULL REFERENCES users(id),
  document_type document_type NOT NULL,
  status scan_status NOT NULL DEFAULT 'pending_upload',
  page_count SMALLINT NOT NULL DEFAULT 1 CHECK (page_count BETWEEN 1 AND 10),
  target_language_code VARCHAR(10) NOT NULL,
  sarvam_key_source sarvam_key_source NOT NULL,
  failure_reason VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  source_deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_scans_profile ON scans(patient_profile_id);
CREATE INDEX idx_scans_status_created ON scans(status, created_at);
CREATE INDEX idx_scans_uploaded_by ON scans(uploaded_by_user_id);

-- 7. scan_pages
CREATE TABLE scan_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  page_number SMALLINT NOT NULL,
  s3_object_key VARCHAR(500) NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scan_id, page_number)
);

-- 8. extraction_results
CREATE TABLE extraction_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL UNIQUE REFERENCES scans(id) ON DELETE CASCADE,
  medicines JSONB NOT NULL DEFAULT '[]',
  plain_explanation_en TEXT NOT NULL,
  translated_explanation TEXT,
  safety_flags JSONB NOT NULL DEFAULT '[]',
  ocr_confidence ocr_confidence_enum NOT NULL,
  audio_s3_key VARCHAR(500),
  sarvam_request_ids JSONB NOT NULL DEFAULT '{}',
  prompt_version VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. consent_records
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  consent_type consent_type_enum NOT NULL,
  granted BOOLEAN NOT NULL,
  consent_version VARCHAR(20) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET NOT NULL
);
CREATE INDEX idx_consent_lookup ON consent_records(user_id, consent_type, recorded_at DESC);

-- 10. share_grants
CREATE TABLE share_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id),
  granted_by_user_id UUID NOT NULL REFERENCES users(id),
  granted_to_user_id UUID REFERENCES users(id),
  invite_token_hash VARCHAR(64) NOT NULL UNIQUE,
  status share_status_enum NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. usage_counters
CREATE TABLE usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type subject_type_enum NOT NULL,
  subject_id UUID NOT NULL,
  period_start DATE NOT NULL,
  scans_used INTEGER NOT NULL DEFAULT 0,
  plan_scan_limit INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subject_type, subject_id, period_start)
);

-- 12. audit_log & support_access_justifications
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(100) NOT NULL,
  before_state JSONB,
  after_state JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address VARCHAR(45)
);

CREATE TABLE support_access_justifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id),
  scan_id UUID NOT NULL REFERENCES scans(id),
  justification TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
