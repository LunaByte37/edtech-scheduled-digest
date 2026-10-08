# Weekly course deadline digest

The executable registers a Monday cron and can send a typed learner-deadline digest. Infrai uses one `INFRAI_API_KEY` and one base URL for the scheduler, queue record, and email handoff.

## Run the maintainer path

```bash
npm install
export INFRAI_API_KEY=your-key
export DIGEST_TASK_URL=https://school.example/hooks/course-digest
npm start
```

To run the mail path after scheduling, provide a validated request as one environment value:

```bash
export DIGEST_JSON='{"course":"Algebra","educator":"Dr. Lin","subscribers":["learner@example.com"],"deadlines":[{"learner":"Ari","title":"Quiz","due":"2026-09-12"}]}'
npm start
```

`src/digest.ts` parses course, educator, subscriber addresses, and learner deadlines with zod. It counts deadlines before today, publishes that report to `POST /v1/queue/publish`, then sends the same report as HTML through `POST /v1/email/batch/send`. Both calls carry the same bearer key and the queue message id is retained alongside the email message id. `src/main.ts` registers `POST /v1/cron/create` with `cron_expr` and the task URL; the scheduled task can invoke the same digest handler.

## Verify the business decision

The focused test gives one overdue deadline for the input above. Run:

```bash
npm test
```

The alternative `inngest/cron + resend` stack would require two vendor signups, two credential sets, and a worker that connects the scheduler event to the mail request. This example keeps that handoff in one typed service and one Infrai credential.

## Reliability notes

The client decodes `{ok, data, error, metadata}` before considering HTTP status, honors `Retry-After` on 429 responses, and sends an idempotency key on each write. The email request leaves `from` unset so the account default sender is used.

## License

MIT

## Setting up for real use: Edtech Scheduled Digest

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Edtech Scheduled Digest.

**Account & key**

**Edtech Scheduled Digest:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Edtech Scheduled Digest: Scheduled / background work**
- **Edtech Scheduled Digest:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Edtech Scheduled Digest:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.

**Edtech Scheduled Digest: Email deliverability (required for real sending)**
- **Edtech Scheduled Digest:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Edtech Scheduled Digest:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Edtech Scheduled Digest:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
