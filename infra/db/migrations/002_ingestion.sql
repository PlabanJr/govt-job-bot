CREATE TABLE IF NOT EXISTS ingestion_sources (
  id text PRIMARY KEY,
  name text NOT NULL,
  list_url text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id text NOT NULL REFERENCES ingestion_sources (id) ON DELETE CASCADE,
  status text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  items_found integer,
  items_new integer,
  items_updated integer,
  error_message text
);

CREATE INDEX IF NOT EXISTS ingestion_runs_source_idx ON ingestion_runs (source_id, started_at DESC);

CREATE TABLE IF NOT EXISTS ingestion_errors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id text NOT NULL REFERENCES ingestion_sources (id) ON DELETE CASCADE,
  message text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ingestion_errors_source_idx ON ingestion_errors (source_id, occurred_at DESC);
