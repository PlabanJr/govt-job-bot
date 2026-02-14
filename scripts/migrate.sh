#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

MIGRATIONS_DIR="${MIGRATIONS_DIR:-infra/db/migrations}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install Postgres client tools or run this inside a container that has psql."
  exit 1
fi

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
SQL

# Apply *.sql in sorted order, once each
for f in $(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
  id="$(basename "$f")"
  already="$(psql "$DATABASE_URL" -tAc "SELECT 1 FROM schema_migrations WHERE id='${id}' LIMIT 1;")"
  if [[ "$already" == "1" ]]; then
    echo "skip $id"
    continue
  fi

  echo "apply $id"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO schema_migrations (id) VALUES ('${id}');"
done

echo "migrations complete"
