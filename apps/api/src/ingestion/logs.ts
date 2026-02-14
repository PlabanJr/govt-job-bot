import { query } from "../db/pool";
import type { SourceDefinition } from "./types";

export async function ensureSource(source: SourceDefinition) {
  await query(
    `INSERT INTO ingestion_sources (id, name, list_url, active)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       list_url = EXCLUDED.list_url,
       active = EXCLUDED.active,
       updated_at = now()`
    ,
    [source.id, source.name, source.listUrl, source.enabled]
  );
}

export async function startRun(sourceId: string) {
  const rows = await query<{ id: string }>(
    `INSERT INTO ingestion_runs (source_id, status, started_at)
     VALUES ($1, 'running', now())
     RETURNING id`,
    [sourceId]
  );

  return rows[0]?.id ?? null;
}

export async function completeRun(runId: string, stats: { itemsFound: number; itemsNew: number; itemsUpdated: number; }) {
  await query(
    `UPDATE ingestion_runs
     SET status = 'success',
         completed_at = now(),
         items_found = $1,
         items_new = $2,
         items_updated = $3
     WHERE id = $4`,
    [stats.itemsFound, stats.itemsNew, stats.itemsUpdated, runId]
  );
}

export async function failRun(runId: string | null, sourceId: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";

  if (runId) {
    await query(
      `UPDATE ingestion_runs
       SET status = 'failed', completed_at = now(), error_message = $1
       WHERE id = $2`,
      [message, runId]
    );
  }

  await query(
    `INSERT INTO ingestion_errors (source_id, message, occurred_at)
     VALUES ($1, $2, now())`,
    [sourceId, message]
  );
}
