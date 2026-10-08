import { z } from "zod";
import { infrai } from "./infrai.ts";
export const digestRequest = z.object({ course: z.string().min(1), educator: z.string().min(1), subscribers: z.array(z.string().email()).min(1), deadlines: z.array(z.object({ learner: z.string().min(1), title: z.string().min(1), due: z.string().min(1) })) });
export type DigestRequest = z.infer<typeof digestRequest>;
export function overdueCount(input: DigestRequest, today: string): number { return input.deadlines.filter(item => item.due < today).length; }
export async function sendDigest(raw: unknown, today = new Date().toISOString().slice(0, 10)) {
  const input = digestRequest.parse(raw); const overdue = overdueCount(input, today); const rows = input.deadlines.map(item => `<li>${item.learner}: ${item.title} due ${item.due}</li>`).join(""); const html = `<h1>${input.course} delivery digest</h1><p>Educator: ${input.educator}. Overdue: ${overdue}.</p><ul>${rows}</ul>`; const stamp = `${input.course}-${today}`;
  const queued = await infrai.queue.publish({ queue: "course-deadline-digests", payload: { course: input.course, educator: input.educator, overdue, generated_on: today } }, `digest-queue-${stamp}`);
  const sent = await infrai.email.batch.send({ messages: input.subscribers.map(to => ({ to, subject: `${input.course} learner deadlines`, html })) }, `digest-mail-${stamp}`);
  return { overdue, message_id: sent.message_id, queue_message_id: queued.message_id };
}
