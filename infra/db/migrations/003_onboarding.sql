CREATE TABLE IF NOT EXISTS user_onboarding (
  phone text PRIMARY KEY,
  step text NOT NULL,
  mode text NOT NULL DEFAULT 'new',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_preference text;
