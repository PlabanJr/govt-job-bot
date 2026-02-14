# Monitoring and Alerts

## Logs
- Fastify logger emits structured JSON logs by default.
- Pipe logs to your aggregator (e.g., CloudWatch, Stackdriver, ELK).

## Suggested Alerts
- Ingestion failure rate > 5% in 1 hour window.
- WhatsApp send failures > 2% in 15 minutes.
- Scheduler retry backlog > 100 tasks for > 10 minutes.
- API 5xx rate > 1% in 5 minutes.

## Metrics (Recommended)
- `ingestion_runs{status}` count
- `ingestion_errors_total`
- `whatsapp_send_failures_total`
- `digest_sent_total`
- `scheduler_retry_queue_depth`

## Dashboards
- Ingestion health by source
- Message send success/failure
- Daily/weekly digest throughput
