import { sendDigest } from "./digest.ts";
import { infrai } from "./infrai.ts";
const taskUrl = process.env.DIGEST_TASK_URL ?? "https://example.edu/hooks/course-digest";
const job = await infrai.cron.create({ cron_expr: "0 8 * * 1", task: taskUrl });
console.log(`scheduled ${job.job_id}; the cron task and digest mail use the same INFRAI_API_KEY and base URL`);
if (process.env.DIGEST_JSON) { const result = await sendDigest(JSON.parse(process.env.DIGEST_JSON)); console.log(JSON.stringify(result)); }
