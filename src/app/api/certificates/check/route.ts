import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatDateId } from "@/lib/certificate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Mengenali kode dari: kode biasa, URL verifikasi (/verify/KODE), URL unduhan PDF (/api/certificates/KODE/pdf),
// atau kalimat yang memuat kode berhyphen.
function extractCode(input: string): string | null {
  const s = input.trim().slice(0, 300);
  const squash = (t: string) => t.toUpperCase().replace(/\s+/g, "");
  const anchored = /^LK-?([A-Z0-9]{5})-?([A-Z0-9]{5})$/;
  const fmt = (m: RegExpMatchArray) => `LK-${m[1]}-${m[2]}`;
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      for (const seg of u.pathname.split("/").filter(Boolean)) {
        let d = seg;
        try {
          d = decodeURIComponent(seg);
        } catch {
          // biarkan apa adanya
        }
        const m = squash(d).match(anchored);
        if (m) return fmt(m);
      }
    } catch {
      // URL rusak
    }
    return null;
  }
  const m = squash(s).match(anchored) ?? s.toUpperCase().match(/LK-([A-Z0-9]{5})-([A-Z0-9]{5})/);
  return m ? fmt(m) : null;
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
    if (/^https?:\/\//i.test(q.trim())) {
      return json({ found: false, message: "URL tidak dikenali. Gunakan URL verifikasi atau URL unduhan PDF sertifikat." });
    }
    // Bukan kode atau URL: cari berdasarkan nama lengkap penerima (harus sama persis)
    const name = q.trim().replace(/\s+/g, " ").slice(0, 120);
    if (name.length < 4) {
      return json({ found: false, message: "Tulis nama lengkap penerima (minimal 4 huruf), atau tempel kode atau URL sertifikat." });
    }
    const rows = await db.certificate.findMany({
      where: { enrollment: { user: { fullName: { equals: name, mode: "insensitive" } } } },
      orderBy: { issuedAt: "desc" },
      take: 6,
      select: {
        issuedAt: true,
        enrollment: { select: { user: { select: { fullName: true } }, course: { select: { title: true } } } },
      },
    });
    if (rows.length === 0) {
      return json({ found: false, message: "Tidak ditemukan sertifikat atas nama tersebut. Tulis nama lengkap persis seperti di sertifikat, atau gunakan kode atau URL." });
    }
    // Kode tidak ditampilkan agar sertifikat tidak bisa diunduh hanya dari nama
    return json({
      found: true,
      mode: "name",
      more: rows.length > 5,
      matches: rows.slice(0, 5).map((r) => ({
        name: r.enrollment.user.fullName,
        course: r.enrollment.course.title,
        issuedAt: formatDateId(r.issuedAt),
      })),
    });
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
    mode: "code",
    code: cert.code,
    name: cert.enrollment.user.fullName,
    course: cert.enrollment.course.title,
    score: cert.enrollment.finalScore,
    issuedAt: formatDateId(cert.issuedAt),
  });
}
