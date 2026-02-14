import { query } from "../db/pool";

export interface ConsentAuditSummary {
  totalUsers: number;
  optedInUsers: number;
  optedOutUsers: number;
  usersMissingConsentLog: number;
  usersOptedOutButActive: number;
}

export async function runConsentAudit(): Promise<ConsentAuditSummary> {
  const totals = await query<{
    total_users: string;
    opted_in: string;
    opted_out: string;
  }>(
    `SELECT
      COUNT(*)::text AS total_users,
      COUNT(*) FILTER (WHERE consent_status = 'opt_in')::text AS opted_in,
      COUNT(*) FILTER (WHERE consent_status = 'opt_out')::text AS opted_out
     FROM users`
  );

  const missingLogs = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM users u
     LEFT JOIN consent_logs c ON c.user_id = u.id
     WHERE c.id IS NULL`
  );

  const optedOutActive = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM users
     WHERE consent_status = 'opt_out' AND last_active_at IS NOT NULL`
  );

  const total = Number(totals[0]?.total_users ?? 0);
  const optedIn = Number(totals[0]?.opted_in ?? 0);
  const optedOut = Number(totals[0]?.opted_out ?? 0);
  const missing = Number(missingLogs[0]?.count ?? 0);
  const optedOutActiveCount = Number(optedOutActive[0]?.count ?? 0);

  return {
    totalUsers: total,
    optedInUsers: optedIn,
    optedOutUsers: optedOut,
    usersMissingConsentLog: missing,
    usersOptedOutButActive: optedOutActiveCount
  };
}

async function main() {
  const summary = await runConsentAudit();
  console.log(JSON.stringify({ status: "ok", summary }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
