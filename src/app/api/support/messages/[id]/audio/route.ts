import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rekaman suara hanya bisa diputar oleh admin dan pemilik percakapan
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return new Response("Tidak diizinkan.", { status: 401 });
  const m = await db.supportMessage.findUnique({ where: { id: params.id } });
  if (!m || m.kind !== "voice" || !m.audio || !m.audioMime) return new Response("Tidak ditemukan.", { status: 404 });
  if (s.role !== "ADMIN" && s.uid !== m.userId) return new Response("Tidak ditemukan.", { status: 404 });
  return new Response(m.audio as unknown as BodyInit, {
    headers: {
      "Content-Type": m.audioMime,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
