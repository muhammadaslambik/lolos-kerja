import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const err = (message: string, status: number) => NextResponse.json({ error: message }, { status });
const MAX_AUDIO_BYTES = 300 * 1024;

function audioMime(type: string): string | null {
  const t = type.toLowerCase();
  if (t.startsWith("audio/webm")) return "audio/webm";
  if (t.startsWith("audio/mp4") || t.startsWith("audio/x-m4a")) return "audio/mp4";
  if (t.startsWith("audio/ogg")) return "audio/ogg";
  return null;
}

// Mengirim pesan teks atau pesan suara dalam percakapan bantuan antara satu pengguna dan admin
export async function POST(req: Request, { params }: { params: { userId: string } }) {
  const s = await getSession();
  if (!s) return err("Silakan masuk dulu.", 401);
  const isAdmin = s.role === "ADMIN";
  if (!isAdmin && (s.uid !== params.userId || (s.role !== "SEEKER" && s.role !== "EMPLOYER"))) return err("Tidak diizinkan.", 403);
  if (isAdmin) {
    const target = await db.user.findUnique({ where: { id: params.userId }, select: { role: true } });
    if (!target || target.role === "ADMIN") return err("Pengguna tidak ditemukan.", 404);
  }

  const recent = await db.supportMessage.count({ where: { senderId: s.uid, createdAt: { gte: new Date(Date.now() - 60_000) } } });
  if (recent >= 20) return err("Terlalu banyak pesan dalam satu menit. Coba lagi sebentar lagi.", 429);

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return err("Permintaan tidak valid.", 400);
  }
  const kind = String(fd.get("kind") ?? "");

  if (kind === "text") {
    const body = String(fd.get("body") ?? "").trim().slice(0, 1000);
    if (!body) return err("Pesan kosong.", 400);
    await db.supportMessage.create({ data: { userId: params.userId, senderId: s.uid, fromAdmin: isAdmin, kind: "text", body } });
    return NextResponse.json({ ok: true });
  }

  if (kind === "voice") {
    const file = fd.get("audio");
    if (!file || typeof file === "string") return err("Rekaman tidak ditemukan.", 400);
    if (file.size === 0 || file.size > MAX_AUDIO_BYTES) return err("Rekaman terlalu besar atau kosong. Maksimal 60 detik.", 400);
    const mime = audioMime(file.type || "");
    if (!mime) return err("Format rekaman tidak didukung.", 400);
    const seconds = Math.min(60, Math.max(1, parseInt(String(fd.get("seconds") ?? "1"), 10) || 1));
    const audio = Buffer.from(await file.arrayBuffer());
    await db.supportMessage.create({
      data: { userId: params.userId, senderId: s.uid, fromAdmin: isAdmin, kind: "voice", audio, audioMime: mime, audioSeconds: seconds },
    });
    return NextResponse.json({ ok: true });
  }

  return err("Jenis pesan tidak dikenal.", 400);
}
