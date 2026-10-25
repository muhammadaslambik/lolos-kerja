import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { DOC_KINDS, MAX_DOCS, MAX_DOC_BYTES, MAX_DOC_MB, sniffMime } from "@/lib/company-profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const err = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "EMPLOYER") return err("Tidak diizinkan.", 401);

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return err("Permintaan tidak valid.", 400);
  }
  const file = fd.get("file");
  const kind = String(fd.get("kind") ?? "");
  const companyId = String(fd.get("companyId") ?? "");
  if (!file || typeof file === "string") return err("Pilih berkas terlebih dulu.", 400);
  if (!DOC_KINDS.some((k) => k.key === kind)) return err("Jenis dokumen tidak valid.", 400);
  if (file.size === 0) return err("Berkas kosong.", 400);
  if (file.size > MAX_DOC_BYTES) return err(`Ukuran berkas maksimal ${MAX_DOC_MB} MB.`, 400);

  // Hanya anggota perusahaan itu yang boleh mengunggah
  const member = await db.companyMember.findFirst({ where: { userId: s.uid, companyId }, select: { userId: true } });
  if (!member) return err("Tidak diizinkan.", 403);
  const count = await db.companyDocument.count({ where: { companyId } });
  if (count >= MAX_DOCS) return err(`Maksimal ${MAX_DOCS} dokumen per perusahaan. Hapus yang tidak perlu.`, 400);

  const buf = Buffer.from(await file.arrayBuffer());
  const mime = sniffMime(buf);
  if (!mime) return err("Format berkas harus PDF, JPG, atau PNG.", 400);

  const fileName = (file.name || "dokumen").replace(/[^\w.\- ]+/g, "_").slice(0, 120);
  await db.companyDocument.create({ data: { companyId, kind, fileName, mime, size: buf.length, data: buf } });
  return NextResponse.json({ ok: true });
}
