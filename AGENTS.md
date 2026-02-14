# Repository Guidelines

## Project Structure & Module Organization
This repository is a TypeScript monorepo using npm workspaces.
- `apps/api/src`: Fastify API, WhatsApp webhook handlers, ingestion jobs, scheduler, and compliance logic.
- `apps/api/test`: Node test runner suites (`e2e`, `scheduler`, `compliance`).
- `packages/shared/src`: shared types and eligibility utilities used by the API.
- `packages/shared/test`: shared package tests.
- `infra/db/migrations`: SQL schema/migration files (`001_init.sql`, etc.).
- `docs`: operational guides (deploy, runbook, monitoring, templates).

## Build, Test, and Development Commands
Run from the repository root unless noted.
- `npm run build`: build all workspace TypeScript projects with project references.
- `npm run typecheck`: strict TS compile checks without pretty output (CI-friendly).
- `npm run dev:api`: build API workspace and start `apps/api/dist/index.js`.
- `npm run migrate`: execute `scripts/migrate.sh` against configured `DATABASE_URL`.
- `npm run test --workspace @govt-jobs/api`: run API tests.
- `npm run test --workspace @govt-jobs/shared`: run shared package tests.

## Coding Style & Naming Conventions
- Use TypeScript with `strict: true`; keep new code type-safe and avoid `any` unless justified.
- Follow existing style: 2-space indentation, double quotes, semicolons, and named exports for reusable modules.
- Keep file names short and domain-based (`ingestion/runner.ts`, `compliance/optout.ts`).
- No linter/formatter is currently configured; keep changes consistent with nearby code and run `npm run typecheck` before opening a PR.

## Testing Guidelines
- Framework: Node's built-in test runner (`node --test`).
- Place tests under each workspace `test/` directory.
- Name test files as `*.test.js` to match existing commands.
- Add or update tests for behavior changes in ingestion, compliance, routing, and shared eligibility logic.

## Commit & Pull Request Guidelines
- Git history is currently empty; adopt Conventional Commit style from now on (for example: `feat(api): add UPSC source parser`).
- Keep commits focused and runnable; include related test updates in the same commit.
- PRs should include: purpose, key changes, test commands run, migration impact (if any), and relevant doc updates in `docs/`.
- For webhook or admin route changes, include sample request/response payloads in the PR description.

## Security & Configuration Tips
- Do not commit `.env` secrets (WhatsApp tokens, DB credentials).
- Validate required env vars with `npm run env-check --workspace @govt-jobs/api` after building.
- Review `docs/compliance.md` before modifying consent, opt-out, or retention behavior.
