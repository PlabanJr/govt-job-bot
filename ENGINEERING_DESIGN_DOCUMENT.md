# Engineering Design Document

## Tech Stack (JS/TS, Minimal Components)
- Backend: Node.js + TypeScript
- Web framework: Fastify (or Express if preferred)
- Database: Postgres
- Scheduler: Node cron worker + DB job table
- Storage: S3-compatible object storage for PDFs (optional but recommended)
- Deployment: Docker
- Observability: logging + basic metrics (OpenTelemetry optional later)

## High-Level Architecture
Monolith with clear modules to avoid premature microservices:
- Ingestion
- Parsing/Normalization
- Eligibility
- Messaging
- Admin/Monitoring

## Data Flow
1. Ingestion fetches official sources.
2. Parser extracts and normalizes data.
3. Jobs are stored in Postgres.
4. Scheduler builds daily/weekly digests.
5. WhatsApp sends approved templates.

## Core Components

### 1) Ingestion
- Allowlist only: official central portals
- Fetch HTML + PDFs
- Store source URL + hash
- Detect updates by checksum

### 2) Parsing & Normalization
- Parsers by source type (HTML table, PDF text)
- OCR fallback for scanned PDFs (deferred if not required initially)
- Normalize into canonical job schema

### 3) Eligibility Engine
Deterministic rules:
- Age check with category relaxations
- Qualification mapping (controlled vocabulary)
- PwD/ex-serviceman conditions
- Gender filtering only if explicitly required by source

Output: `eligible` / `ineligible` + reason.

### 4) User Profile & Consent
- Store user profile
- Consent log and opt-out history
- Retention policy: delete PII after 6 months of inactivity

### 5) Notification Scheduler
- Daily/weekly digests at IST
- Builds per-user list of eligible jobs
- Dedupe by job ID + user ID

### 6) WhatsApp Gateway
- Meta Cloud API direct
- Template messages for digests
- Session messages within 24h window
- Opt-out command handling

## Canonical Job Schema (Postgres)

### `jobs`
- `id` (uuid)
- `organization`
- `post_title`
- `vacancies_count`
- `pay_level`
- `location`
- `eligibility_education`
- `eligibility_age_min`
- `eligibility_age_max`
- `eligibility_category_relaxations` (jsonb)
- `eligibility_pwd`
- `eligibility_ex_serviceman`
- `eligibility_gender` (nullable)
- `application_start_date`
- `application_end_date`
- `source_url`
- `source_pdf_url`
- `source_hash`
- `created_at`
- `last_seen_at`

### `users`
- `id` (uuid)
- `phone`
- `name`
- `dob`
- `highest_qualification`
- `category`
- `pwd_status`
- `ex_serviceman`
- `gender` (nullable)
- `language`
- `frequency`
- `timezone`
- `consent_status`
- `consent_timestamp`
- `last_active_at`
- `created_at`

### `consent_logs`
- `id`
- `user_id`
- `event` (`opt_in` / `opt_out`)
- `timestamp`
- `message_id`
- `channel`

### `delivery_logs`
- `id`
- `user_id`
- `job_ids` (jsonb)
- `status`
- `sent_at`

## WhatsApp Onboarding Flow

### Consent
"Do you want central government job alerts on WhatsApp? Reply YES."

### Language
English / हिंदी

### Frequency
Daily / Weekly

### Profile Collection
- Name
- DOB
- Highest qualification
- Category
- PwD status
- Ex-serviceman
- Gender only if user agrees or a job requires it
- Location preference (optional)

## Notification Template Structure
- Title: Organization -> Post Title
- Eligibility summary
- Last date
- Official PDF link
- Application URL

## Security & Privacy
- Encrypt PII at rest
- Use environment-based secrets
- Data retention purge every 24h
- GDPR-like data export/delete on request

## Operational
- Parser health checks
- Source monitoring
- Failed fetch retry with backoff
- Manual review flag for low-confidence parses
