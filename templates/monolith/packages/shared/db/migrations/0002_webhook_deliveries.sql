-- {{projectName}} — webhook delivery dedupe
--
-- Tracks the svix-id of every webhook delivery we've successfully
-- processed so retries within svix's window don't re-execute the
-- handler. Paired with application-level INSERT ... ON CONFLICT DO NOTHING
-- checks in lib/billing/event-handler.ts.

CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
    "svix_id" text PRIMARY KEY,
    "event_type" text NOT NULL,
    "processed_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_webhook_deliveries_processed_at"
    ON "webhook_deliveries" ("processed_at");

-- Regular authenticated clients have no business reading or writing
-- this table — only the service role (webhook handler) touches it.
ALTER TABLE "webhook_deliveries" ENABLE ROW LEVEL SECURITY;
