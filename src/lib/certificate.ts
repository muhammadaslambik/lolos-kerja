import { randomBytes } from "crypto";
import { db } from "@/lib/db";

// 32 karakter tanpa huruf atau angka yang mudah tertukar (0, O, 1, I)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newCertificateCode() {
  let s = "";
  for (const b of randomBytes(10)) s += ALPHABET[b % ALPHABET.length];
  return `LK-${s.slice(0, 5)}-${s.slice(5)}`;
}

export function normalizeCode(raw: string) {
  return raw.trim().toUpperCase();
}

export function formatDateId(d: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(d);
}

// Menerbitkan sertifikat satu kali per pendaftaran. Aman dipanggil berulang.
export async function issueCertificate(enrollmentId: string) {
  const existing = await db.certificate.findUnique({ where: { enrollmentId } });
  if (existing) return existing;
  for (let i = 0; i < 5; i++) {
    try {
      return await db.certificate.create({ data: { enrollmentId, code: newCertificateCode() } });
    } catch {
      const again = await db.certificate.findUnique({ where: { enrollmentId } });
      if (again) return again;
    }
  }
  return null;
}
