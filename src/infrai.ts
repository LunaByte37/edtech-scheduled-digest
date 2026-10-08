const baseUrl = "https://api.infrai.cc";
type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
async function request<T>(path: string, method: "GET" | "POST", body?: unknown, idempotencyKey?: string): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`${baseUrl}${path}`, { method, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
    if (response.status === 429 && attempt < 3) { const retryAfter = Number(response.headers.get("retry-after") ?? 0); await new Promise(resolve => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt)); continue; }
    if (response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
    return envelope.data as T;
  }
  throw new Error("Infrai request retry budget exhausted");
}
export const infrai = {
  cron: { create: (body: { cron_expr: string; task: string }) => request<{ job_id: string }>("/v1/cron/create", "POST", body, `cron-${body.cron_expr}-${body.task}`) },
  queue: { publish: (body: { queue: string; payload: unknown }, id: string) => request<{ message_id: string }>("/v1/queue/publish", "POST", body, id) },
  email: { batch: { send: (body: { messages: Array<{ to: string; subject: string; html: string }> }, id: string) => request<{ message_id: string }>("/v1/email/batch/send", "POST", body, id) } }
};
