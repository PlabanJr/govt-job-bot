# Govt Jobs WhatsApp Agent (Central)

Phase 0 scaffold for a monorepo Node.js + TypeScript backend with WhatsApp Cloud API webhook skeleton, shared types, and Postgres schema migrations.

## Structure
- `apps/api` Fastify API service
- `packages/shared` shared types
- `infra/db/migrations` SQL migrations
- `docs` onboarding copy and compliance text

## Environment (API)
- `PORT`
- `HOST`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_API_BASE_URL` (optional)
- `DATABASE_URL`

## Ingestion
Run the ingestion CLI after building:
`npm run build --workspace @govt-jobs/api` then `npm run ingest --workspace @govt-jobs/api`

## Tests
`npm run test --workspace @govt-jobs/api`

## Docs
- Deployment: `docs/deploy.md`
- Runbook: `docs/runbook.md`
- Monitoring: `docs/monitoring.md`
- WhatsApp Templates: `docs/whatsapp-templates.md`
