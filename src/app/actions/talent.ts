"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

const BASE = "/dashboard/employer/talent";
const DAILY_LIMIT = 20;

function fail(msg: string): never {
  redirect(`${BASE}?error=${encodeURIComponent(msg)}`);
}

export async function inviteTalent(fd: FormData): Promise<void> {
  const s = await requireRole("EMPLOYER");
  const company = await db.company.findFirst({
    where: { members: { some: { userId: s.uid } }, verification: "VERIFIED" },
  });
  if (!company) return fail("Talent Pool hanya untuk perusahaan yang sudah terverifikasi.");

  const seekerId = String(fd.get("seekerId") ?? "");
  const jobId = String(fd.get("jobId") ?? "");
  const message = String(fd.get("message") ?? "").trim().slice(0, 500);
  if (message.length < 10) return fail("Pesan undangan minimal 10 karakter.");

  const profile = await db.seekerProfile.findFirst({
    where: { userId: seekerId, talentVisible: true, user: { role: "SEEKER" } },
    select: { userId: true },
  });
  if (!profile) return fail("Profil ini tidak tersedia di Talent Pool.");

  let validJobId: string | null = null;
  if (jobId) {
    const job = await db.job.findFirst({ where: { id: jobId, companyId: company.id, status: "ACTIVE" }, select: { id: true } });
    if (!job) return fail("Lowongan yang dipilih tidak valid.");
    validJobId = job.id;
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sentToday = await db.talentInvite.count({ where: { companyId: company.id, createdAt: { gte: since } } });
  if (sentToday >= DAILY_LIMIT) return fail(`Batas ${DAILY_LIMIT} undangan per hari tercapai. Coba lagi besok.`);

  try {
    await db.talentInvite.create({ data: { companyId: company.id, seekerId, jobId: validJobId, message } });
  } catch {
    return fail("Undangan gagal dikirim. Mungkin kandidat ini sudah pernah Anda undang.");
  }
  revalidatePath(BASE);
  revalidatePath(`${BASE}/undangan`);
  redirect(`${BASE}/undangan?ok=terkirim`);
}

export async function respondInvite(fd: FormData): Promise<void> {
  const s = await requireRole("SEEKER");
  const dash = "/dashboard/seeker";
  const id = String(fd.get("id") ?? "");
  const decision = String(fd.get("decision") ?? "");
  if (decision !== "accept" && decision !== "decline") return redirect(dash);
  await db.talentInvite.updateMany({
    where: { id, seekerId: s.uid, status: "sent" },
    data: { status: decision === "accept" ? "accepted" : "declined" },
  });
  revalidatePath(dash);
  revalidatePath(`${BASE}/undangan`);
  redirect(dash);
}
