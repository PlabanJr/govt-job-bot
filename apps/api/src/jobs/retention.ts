import { query } from "../db/pool";

export interface RetentionResult {
  deletedUsers: number;
}

export async function purgeInactiveUsers(): Promise<RetentionResult> {
  const rows = await query<{ count: string }>(
    `WITH deleted AS (
      DELETE FROM users
      WHERE COALESCE(last_active_at, consent_timestamp, created_at) < (now() - interval '6 months')
      RETURNING id
    )
    SELECT COUNT(*)::text AS count FROM deleted`
  );

  const count = Number(rows[0]?.count ?? 0);
  return { deletedUsers: count };
}

async function main() {
  const result = await purgeInactiveUsers();
  console.log(JSON.stringify({ status: "ok", ...result }));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
