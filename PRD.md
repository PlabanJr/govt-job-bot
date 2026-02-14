# PRD

## Product Name
Central Govt Jobs WhatsApp Agent

## Problem Statement
Central government job notifications are scattered across official portals and often missed by candidates. Users need an easy, reliable, eligibility-aware alert system.

## Goal
Deliver official central-government job alerts to WhatsApp users on a daily or weekly schedule, filtered by eligibility based on a minimal user profile.

## Scope (Phase 1)
- Central government only
- Official sources only
- WhatsApp onboarding and messaging
- English + Hindi
- Daily/weekly digests
- Eligibility filtering (rule-based)

## Out of Scope (Phase 1)
- State government jobs
- Application submission or form filling
- Unofficial aggregators
- AI ranking beyond deterministic rules

## User Personas
- Fresh graduates
- Mid-career candidates seeking government roles
- Candidates seeking category-specific relaxations

## Primary User Journey
1. User starts WhatsApp chat.
2. Bot collects consent.
3. User selects language and frequency.
4. Bot collects profile.
5. User receives digest with eligible jobs.
6. User can update preferences or opt out.

## Key Requirements

### Functional
- WhatsApp onboarding flow (consent -> language -> frequency -> profile)
- Daily/weekly digest (IST)
- Eligibility filter using age, qualification, category, PwD, ex-serviceman
- Only official source links
- Opt-out at any time with "STOP"
- Consent logs with timestamps

### Profile Fields
- Required: name, date of birth, highest qualification, category
- Conditional: gender (ask only if user opts in or if job requires gender filter)
- Optional: location preference
- Optional: PwD and ex-serviceman status
- System: language, frequency, timezone, consent status

### Non-Functional
- Reliable scheduled delivery (99% target)
- Simple, auditable eligibility decisions
- Privacy by default
- Data retention: 6 months after last activity

## Compliance
- Explicit opt-in
- Clear opt-out
- Consent logs and audit trail
- Data minimization (religion excluded)

## Success Metrics
- Onboarding completion rate
- Weekly active users
- Digest CTR
- Opt-out rate
- Eligible job coverage per user

## Risks & Mitigations
- Source layout changes -> parser health checks + manual review queue
- Eligibility mismatch -> show "verify with official PDF" note
- WhatsApp policy issues -> strict opt-in and template approvals

## Rollout Plan
- Phase 1: central sources, English + Hindi, rule-based eligibility
- Phase 2: add state portals, regional languages, personalized ranking
