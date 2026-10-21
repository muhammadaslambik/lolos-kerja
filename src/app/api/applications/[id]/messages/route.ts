import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { canChat, getChatContext } from "@/lib/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AUDIO = 700 * 1024; // sekitar 60 detik pada kualitas suara yang dipakai
const AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/mp4"];
const DAY = 24 * 60 * 60 * 1000;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return json({ error: "Silakan masuk." }, 401);
  const ctx = await getChatContext(params.id, s);
  if (!ctx) return json({ error: "Percakapan tidak ditemukan." }, 404);
  if (!canChat(ctx.app.stage)) {
    return json({ error: "Percakapan tidak tersedia." }, 403);
  }

  const recent = await db.message.count({ where: { senderId: s.uid, createdAt: { gte: new Date(Date.now() - 60_000) } } });
  if (recent >= 20) return json({ error: "Terlalu banyak pesan. Tunggu sebentar." }, 429);

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return json({ error: "Data tidak valid." }, 400);
  }
  const kind = String(fd.get("kind") ?? "text");

  if (kind === "text") {
    const body = String(fd.get("body") ?? "").trim().slice(0, 1000);
    if (!body) return json({ error: "Pesan kosong." }, 400);
    await db.message.create({ data: { applicationId: ctx.app.id, senderId: s.uid, kind: "text", body } });
    return json({ ok: true });
  }

  if (kind === "voice") {
    const file = fd.get("audio");
    if (!file || typeof file === "string") return json({ error: "Berkas suara tidak ditemukan." }, 400);
    const mime = (file.type || "").split(";")[0].trim().toLowerCase();
    if (!AUDIO_TYPES.includes(mime)) return json({ error: "Format suara tidak didukung." }, 400);
    if (file.size === 0 || file.size > MAX_AUDIO) {
      return json({ error: "Pesan suara terlalu besar. Rekam maksimal 60 detik." }, 400);
    }
    const seconds = Math.min(60, Math.max(1, parseInt(String(fd.get("seconds") ?? "1"), 10) || 1));
    const audio = Buffer.from(await file.arrayBuffer());
    await db.message.create({
      data: { applicationId: ctx.app.id, senderId: s.uid, kind: "voice", audio, audioMime: mime, audioSeconds: seconds },
    });
    // Sesekali hapus isi suara yang lebih dari 30 hari agar penyimpanan tidak membengkak
    if (Math.random() < 0.05) {
      await db.message.updateMany({
        where: { kind: "voice", audio: { not: null }, createdAt: { lt: new Date(Date.now() - 30 * DAY) } },
        data: { audio: null, audioMime: null },
      });
    }
    return json({ ok: true });
  }

  return json({ error: "Jenis pesan tidak dikenal." }, 400);
}
