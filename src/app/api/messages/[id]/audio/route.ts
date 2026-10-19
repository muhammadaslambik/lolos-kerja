import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getChatContext } from "@/lib/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const toAB = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return new Response("Silakan masuk.", { status: 401 });
  const m = await db.message.findUnique({
    where: { id: params.id },
    select: { applicationId: true, audio: true, audioMime: true },
  });
  if (!m || !m.audio || !m.audioMime) return new Response("Tidak ditemukan.", { status: 404 });
  const ctx = await getChatContext(m.applicationId, s);
  if (!ctx) return new Response("Tidak ditemukan.", { status: 404 });

  const data = new Uint8Array(m.audio);
  const total = data.length;
  const headers: Record<string, string> = {
    "Content-Type": m.audioMime,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  };

  // Dukungan Range agar pemutar audio (terutama Safari) bisa memutar dan menggeser
  const range = req.headers.get("range");
  if (range) {
    const mm = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (mm && (mm[1] || mm[2])) {
      let start: number;
      let end: number;
      if (mm[1] === "") {
        start = Math.max(0, total - parseInt(mm[2], 10));
        end = total - 1;
      } else {
        start = parseInt(mm[1], 10);
        end = mm[2] ? parseInt(mm[2], 10) : total - 1;
      }
      if (!(start <= end) || start >= total) {
        return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
      }
      end = Math.min(end, total - 1);
      const part = data.subarray(start, end + 1);
      return new Response(toAB(part), {
        status: 206,
        headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": String(part.length) },
      });
    }
  }
  return new Response(toAB(data), { headers: { ...headers, "Content-Length": String(total) } });
}
