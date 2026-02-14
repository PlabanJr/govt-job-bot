# Deployment Instructions

## Prerequisites
- Node.js 20+
- Postgres 14+
- WhatsApp Cloud API credentials
- Docker (optional for containerized deploys)

## Environment Variables
Set for the API service:
- `PORT`, `HOST`
- `DATABASE_URL`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_API_BASE_URL` (optional)

## Build and Run
1. Install dependencies and build:
   `npm install`
   `npm run build`
2. Validate environment:
   `npm run env-check --workspace @govt-jobs/api`
3. Run DB migrations (manual SQL for now):
   Apply `infra/db/migrations/001_init.sql` then `002_ingestion.sql`.
4. Start API:
   `npm run start --workspace @govt-jobs/api`
5. Run ingestion (optional one-off):
   `npm run ingest --workspace @govt-jobs/api`
6. Run retention purge (daily cron):
   `npm run retention --workspace @govt-jobs/api`

## Docker (Optional)
- Build a Node-based image with `apps/api/dist` and run with the environment variables above.
