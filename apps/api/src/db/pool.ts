import { Pool } from "pg";
import { getDatabaseConfig } from "./index";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const config = getDatabaseConfig();
    pool = new Pool({ connectionString: config.connectionString });
  }
  return pool;
}

export async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
  const client = getPool();
  const result = await client.query(text, params);
  return result.rows as T[];
}
