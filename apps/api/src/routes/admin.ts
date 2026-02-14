import type { FastifyInstance } from "fastify";
import { query } from "../db/pool";

export async function adminRoutes(app: FastifyInstance) {
  app.get("/ingestion/health", async () => {
    const rows = await query<{
      id: string;
      name: string;
      list_url: string;
      active: boolean;
      status: string | null;
      started_at: string | null;
      completed_at: string | null;
      items_found: number | null;
      items_new: number | null;
      items_updated: number | null;
      error_message: string | null;
      last_error_message: string | null;
      last_error_at: string | null;
    }>(
      `SELECT
        s.id,
        s.name,
        s.list_url,
        s.active,
        r.status,
        r.started_at,
        r.completed_at,
        r.items_found,
        r.items_new,
        r.items_updated,
        r.error_message,
        e.message AS last_error_message,
        e.occurred_at AS last_error_at
      FROM ingestion_sources s
      LEFT JOIN LATERAL (
        SELECT * FROM ingestion_runs r
        WHERE r.source_id = s.id
        ORDER BY r.started_at DESC
        LIMIT 1
      ) r ON true
      LEFT JOIN LATERAL (
        SELECT * FROM ingestion_errors e
        WHERE e.source_id = s.id
        ORDER BY e.occurred_at DESC
        LIMIT 1
      ) e ON true
      ORDER BY s.id`
    );

    return { sources: rows };
  });

  app.get("/ingestion/errors", async (req) => {
    const limitParam = (req.query as { limit?: string }).limit;
    const limit = Math.min(Number(limitParam ?? 50) || 50, 200);

    const rows = await query<{
      id: string;
      source_id: string;
      message: string;
      occurred_at: string;
    }>(
      `SELECT id, source_id, message, occurred_at
       FROM ingestion_errors
       ORDER BY occurred_at DESC
       LIMIT $1`,
      [limit]
    );

    return { errors: rows };
  });
}
