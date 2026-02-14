CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization text NOT NULL,
  post_title text NOT NULL,
  vacancies_count integer,
  pay_level text,
  location text,
  eligibility_education text[] NOT NULL DEFAULT '{}',
  eligibility_age_min integer,
  eligibility_age_max integer,
  eligibility_category_relaxations jsonb,
  eligibility_pwd boolean,
  eligibility_ex_serviceman boolean,
  eligibility_gender text,
  application_start_date date,
  application_end_date date,
  source_url text NOT NULL,
  source_pdf_url text,
  source_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS jobs_source_hash_idx ON jobs (source_hash);
CREATE INDEX IF NOT EXISTS jobs_end_date_idx ON jobs (application_end_date);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone text NOT NULL UNIQUE,
  name text NOT NULL,
  dob date NOT NULL,
  highest_qualification text NOT NULL,
  category text NOT NULL CHECK (category IN ('GEN', 'EWS', 'OBC', 'SC', 'ST')),
  pwd_status boolean NOT NULL DEFAULT false,
  ex_serviceman boolean NOT NULL DEFAULT false,
  gender text,
  language text NOT NULL CHECK (language IN ('en', 'hi')),
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly')),
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  consent_status text NOT NULL CHECK (consent_status IN ('opt_in', 'opt_out')),
  consent_timestamp timestamptz NOT NULL,
  last_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consent_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  event text NOT NULL CHECK (event IN ('opt_in', 'opt_out')),
  timestamp timestamptz NOT NULL DEFAULT now(),
  message_id text,
  channel text NOT NULL DEFAULT 'whatsapp'
);

CREATE TABLE IF NOT EXISTS delivery_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  job_ids jsonb NOT NULL,
  status text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_logs_user_idx ON delivery_logs (user_id, sent_at DESC);
