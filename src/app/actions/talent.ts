"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { DECLINE_REASONS, MAX_INVITES, computeState } from "@/lib/talent";

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
    select: { userId: true, skills: true },
  });
  if (!profile) return fail("Profil ini tidak tersedia di Talent Pool.");

  let validJobId: string | null = null;
  if (jobId) {
    const job = await db.job.findFirst({ where: { id: jobId, companyId: company.id, status: "ACTIVE" }, select: { id: true } });
    if (!job) return fail("Lowongan yang dipilih tidak valid.");
    validJobId = job.id;
  }

  // Cek aturan undang ulang
  const [rows, latestJob] = await Promise.all([
    db.talentInvite.findMany({
      where: { companyId: company.id, seekerId },
      select: { status: true, createdAt: true, respondedAt: true, declineReason: true, declineNote: true, skillsSnapshot: true },
    }),
    db.job.findFirst({ where: { companyId: company.id, status: "ACTIVE" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);
  const st = computeState(rows, profile.skills, latestJob?.createdAt ?? null);
  if (!st.canInvite) {
    if (st.block === "pending") return fail("Undangan sebelumnya masih menunggu jawaban pelamar.");
    if (st.block === "accepted") return fail("Kandidat ini sudah menerima undangan Anda.");
    if (st.block === "limit") return fail(`Batas ${MAX_INVITES} undangan untuk kandidat ini sudah tercapai.`);
    return fail("Kandidat ini menolak undangan sebelumnya. Anda dapat mengundang lagi jika pelamar memperbarui keahliannya atau Anda memasang lowongan baru.");
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sentToday = await db.talentInvite.count({ where: { companyId: company.id, createdAt: { gte: since } } });
  if (sentToday >= DAILY_LIMIT) return fail(`Batas ${DAILY_LIMIT} undangan per hari tercapai. Coba lagi besok.`);

  try {
    await db.talentInvite.create({ data: { companyId: company.id, seekerId, jobId: validJobId, message } });
  } catch {
    return fail("Undangan gagal dikirim. Coba lagi sebentar lagi.");
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
  const now = new Date();

  if (decision === "accept") {
    await db.talentInvite.updateMany({
      where: { id, seekerId: s.uid, status: "sent" },
      data: { status: "accepted", respondedAt: now },
    });
  } else if (decision === "decline") {
    const reason = String(fd.get("reason") ?? "");
    if (!Object.keys(DECLINE_REASONS).includes(reason)) return redirect(dash);
    const note = String(fd.get("note") ?? "").trim().slice(0, 200) || null;
    const profile = await db.seekerProfile.findUnique({ where: { userId: s.uid }, select: { skills: true } });
    await db.talentInvite.updateMany({
      where: { id, seekerId: s.uid, status: "sent" },
      data: {
        status: "declined",
        declineReason: reason,
        declineNote: note,
        respondedAt: now,
        skillsSnapshot: profile?.skills ?? [],
      },
    });
  } else {
    return redirect(dash);
  }
  revalidatePath(dash);
  revalidatePath(`${BASE}/undangan`);
  revalidatePath(BASE);
  redirect(dash);
}
