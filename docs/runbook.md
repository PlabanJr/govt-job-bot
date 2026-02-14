# Runbook

## Health Checks
- `GET /health` basic liveness.
- `GET /admin/ingestion/health` per-source ingestion status.
- `GET /admin/ingestion/errors` recent ingestion errors (use `?limit=`).

## Common Operations
- Run ingestion: `npm run ingest --workspace @govt-jobs/api`
- Retention purge: `npm run retention --workspace @govt-jobs/api`

## Incident Triage
1. Ingestion failures
   - Check `/admin/ingestion/health` for source errors.
   - Inspect `/admin/ingestion/errors` for latest failure message.
   - If source HTML changed, update parser in `apps/api/src/ingestion/sources` and rerun.
2. Digest delivery issues
   - Validate WhatsApp credentials and templates.
   - Verify database connectivity and job counts.
3. Scheduler lag
   - Check worker logs for retry storms.
   - Reduce batch sizes or increase worker concurrency.

## Data Retention
- Users inactive for 6 months (based on last activity or creation date) are purged.
- Consent logs and delivery logs are removed via cascade on user delete.
