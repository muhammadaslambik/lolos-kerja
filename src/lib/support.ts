import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { parseCv } from "@/lib/cv-analysis";
import { normalizePhone } from "@/lib/chat";

// Nama ruang panggilan bantuan: acak, tidak bisa ditebak, dan unik untuk setiap undangan panggilan.
export function supportRoom(userId: string, inviteId: string) {
  const secret = process.env.AUTH_SECRET ?? "";
  return "lks-" + createHmac("sha256", secret).update(`support:${userId}:${inviteId}`).digest("hex").slice(0, 24);
}

export function supportCallUrl(userId: string, inviteId: string, mode: "audio" | "video") {
  const base = `https://meet.jit.si/${supportRoom(userId, inviteId)}`;
  return mode === "audio" ? `${base}#config.startWithVideoMuted=true` : base;
}

export function supportEmbedUrl(userId: string, inviteId: string, mode: "audio" | "video", displayName: string) {
  const base = `https://meet.jit.si/${supportRoom(userId, inviteId)}`;
  const params = [`userInfo.displayName=${encodeURIComponent(JSON.stringify(displayName))}`];
  if (mode === "audio") params.push("config.startWithVideoMuted=true");
  return `${base}#${params.join("&")}`;
}

// Nomor telepon pengguna: dari CV utamanya, atau dari data PIC atau telepon perusahaannya
export async function userPhone(userId: string): Promise<{ raw: string; intl: string } | null> {
  const candidates: string[] = [];
  const cv = await db.resume.findFirst({
    where: { userId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    select: { content: true },
  });
  const cvPhone = cv ? parseCv(cv.content).phone : null;
  if (cvPhone) candidates.push(cvPhone);
  const mem = await db.companyMember.findFirst({ where: { userId }, select: { companyId: true } });
  if (mem) {
    const p = await db.companyProfile.findUnique({ where: { companyId: mem.companyId }, select: { picPhone: true, phone: true } });
    if (p?.picPhone) candidates.push(p.picPhone);
    if (p?.phone) candidates.push(p.phone);
  }
  for (const raw of candidates) {
    const intl = normalizePhone(raw);
    if (intl) return { raw, intl };
  }
  return null;
}
