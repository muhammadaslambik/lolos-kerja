import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { parseCv } from "@/lib/cv-analysis";
import type { StageKey } from "@/lib/constants";

// Tahap yang membuka fitur komunikasi dengan pelamar
export const COMM_STAGES: StageKey[] = ["INTERVIEW", "OFFERING", "HIRED", "REJECTED"];
export const canChat = (stage: string) => COMM_STAGES.includes(stage as StageKey);

export type Viewer = { uid: string; role: string };

// Hanya pelamar yang bersangkutan dan anggota perusahaan pemilik lowongan yang boleh mengakses percakapan
export async function getChatContext(applicationId: string, v: Viewer) {
  const app = await db.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      stage: true,
      seekerId: true,
      seeker: { select: { fullName: true } },
      job: { select: { title: true, company: { select: { name: true, members: { select: { userId: true } } } } } },
    },
  });
  if (!app) return null;
  const isSeeker = v.role === "SEEKER" && app.seekerId === v.uid;
  const isEmployer = v.role === "EMPLOYER" && app.job.company.members.some((m) => m.userId === v.uid);
  if (!isSeeker && !isEmployer) return null;
  return { app, side: (isSeeker ? "seeker" : "employer") as "seeker" | "employer" };
}

// Nama ruang panggilan: acak dan tidak bisa ditebak. Setiap undangan panggilan (satu pesan) mendapat ruang sendiri,
// diturunkan dari AUTH_SECRET, id lamaran, dan id undangan.
export function roomName(applicationId: string, inviteId: string) {
  const secret = process.env.AUTH_SECRET ?? "";
  return "lk-" + createHmac("sha256", secret).update(`call:${applicationId}:${inviteId}`).digest("hex").slice(0, 24);
}

export function callUrl(applicationId: string, inviteId: string, mode: "audio" | "video") {
  const base = `https://meet.jit.si/${roomName(applicationId, inviteId)}`;
  return mode === "audio" ? `${base}#config.startWithVideoMuted=true` : base;
}

// Mengubah nomor telepon Indonesia ke format internasional tanpa tanda plus (contoh: 6281234567890)
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  if (!d.startsWith("62") || d.length < 10 || d.length > 15) return null;
  return d;
}

// Nomor telepon pelamar dari CV yang dilampirkan, atau CV utamanya
export async function applicantPhone(applicationId: string): Promise<{ raw: string; intl: string } | null> {
  const app = await db.application.findUnique({
    where: { id: applicationId },
    select: { seekerId: true, resume: { select: { content: true } } },
  });
  if (!app) return null;
  const row =
    app.resume ??
    (await db.resume.findFirst({
      where: { userId: app.seekerId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      select: { content: true },
    }));
  if (!row) return null;
  const raw = parseCv(row.content).phone;
  if (!raw) return null;
  const intl = normalizePhone(raw);
  return intl ? { raw, intl } : null;
}
