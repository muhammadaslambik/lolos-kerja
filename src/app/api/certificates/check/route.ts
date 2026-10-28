import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatDateId } from "@/lib/certificate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Menerima URL verifikasi atau kode (dengan atau tanpa tanda hubung) dan mengembalikan kode baku
function extractCode(input: string): string | null {
  let s = input.trim().slice(0, 300);
  try {
    const u = new URL(s);
    const last = u.pathname.split("/").filter(Boolean).pop();
    if (last) s = decodeURIComponent(last);
  } catch {
    // bukan URL, anggap kode biasa
  }
  const up = s.toUpperCase().replace(/\s+/g, "");
  const m = up.match(/^LK-?([A-Z0-9]{5})-?([A-Z0-9]{5})$/) ?? up.match(/LK-?([A-Z0-9]{5})-?([A-Z0-9]{5})/);
  return m ? `LK-${m[1]}-${m[2]}` : null;
}

// Pembatasan sederhana agar kode tidak bisa ditebak lewat percobaan massal: 30 cek per 10 menit per alamat IP
async function allowed(ip: string) {
  const key = `certcheck:${ip}`;
  const now = new Date();
  const windowMs = 10 * 60 * 1000;
  const max = 30;
  try {
    const row = await db.loginThrottle.findUnique({ where: { key } });
    if (!row || now.getTime() - row.windowStart.getTime() > windowMs) {
      await db.loginThrottle.upsert({
        where: { key },
        update: { count: 1, windowStart: now, lockedUntil: null },
        create: { key, count: 1, windowStart: now },
      });
      return true;
    }
    if (row.count >= max) return false;
    await db.loginThrottle.update({ where: { key }, data: { count: { increment: 1 } } });
    return true;
  } catch {
    return true;
  }
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await allowed(ip))) {
    return json({ found: false, message: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." }, 429);
  }

  const code = extractCode(q);
  if (!code) {
    return json({ found: false, message: "Format tidak dikenali. Tempel URL verifikasi atau kode berbentuk LK-XXXXX-XXXXX." });
  }
  const cert = await db.certificate.findUnique({
    where: { code },
    include: {
      enrollment: {
        include: {
          user: { select: { fullName: true } },
          course: { select: { title: true } },
        },
      },
    },
  });
  if (!cert) {
    return json({ found: false, message: "Sertifikat dengan kode ini tidak ditemukan. Periksa kembali penulisan kodenya." });
  }
  return json({
    found: true,
    code: cert.code,
    name: cert.enrollment.user.fullName,
    course: cert.enrollment.course.title,
    score: cert.enrollment.finalScore,
    issuedAt: formatDateId(cert.issuedAt),
  });
}
