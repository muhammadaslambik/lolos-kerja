import { getSession } from "@/lib/session";
import { unreadSummary } from "@/lib/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export async function GET() {
  const s = await getSession();
  if (!s || (s.role !== "SEEKER" && s.role !== "EMPLOYER")) return json({ error: "Silakan masuk." }, 401);
  return json(await unreadSummary(s.role, s.uid));
}
