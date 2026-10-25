import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dokumen perusahaan hanya bisa dibuka oleh Admin dan anggota perusahaan itu sendiri
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return new Response("Tidak diizinkan.", { status: 401 });
  const doc = await db.companyDocument.findUnique({ where: { id: params.id } });
  if (!doc) return new Response("Tidak ditemukan.", { status: 404 });
  if (s.role !== "ADMIN") {
    const member = await db.companyMember.findFirst({ where: { userId: s.uid, companyId: doc.companyId }, select: { userId: true } });
    if (!member) return new Response("Tidak ditemukan.", { status: 404 });
  }
  return new Response(doc.data as unknown as BodyInit, {
    headers: {
      "Content-Type": doc.mime,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
