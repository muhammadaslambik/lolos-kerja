"use server";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import type { JobType, WorkMode } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { EDU_LEVELS, JOB_TYPE_LABEL } from "@/lib/constants";
import { WORK_MODES } from "@/lib/job-options";

const LIST = "/dashboard/employer/jobs";

type JobData = {
  title: string;
  description: string;
  requirements: string | null;
  jobType: JobType;
  workMode: WorkMode;
  city: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  minEducation: string | null;
  minExperienceYears: number;
  requiredSkills: string[];
};

function fail(path: string, msg: string): never {
  redirect(`${path}?error=${encodeURIComponent(msg)}`);
}

function slugify(t: string) {
  const s = t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return s || "lowongan";
}

function parseJob(fd: FormData): { error: string } | { data: JobData } {
  const str = (k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
  const num = (k: string) => {
    const v = String(fd.get(k) ?? "").replace(/\D/g, "");
    if (!v) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  };

  const title = str("title", 150);
  const description = str("description", 5000);
  const requirements = str("requirements", 3000) || null;
  const jobType = String(fd.get("jobType") ?? "");
  const workMode = String(fd.get("workMode") ?? "");
  const edu = String(fd.get("minEducation") ?? "");
  const salaryMin = num("salaryMin");
  const salaryMax = num("salaryMax");

  if (title.length < 3) return { error: "Judul lowongan minimal 3 karakter." };
  if (description.length < 20) return { error: "Deskripsi pekerjaan minimal 20 karakter." };
  if (!(jobType in JOB_TYPE_LABEL)) return { error: "Tipe pekerjaan tidak valid." };
  if (!(WORK_MODES as readonly string[]).includes(workMode)) return { error: "Mode kerja tidak valid." };
  if ((salaryMin ?? 0) > 1_000_000_000 || (salaryMax ?? 0) > 1_000_000_000) {
    return { error: "Nilai gaji terlalu besar." };
  }
  if (salaryMin != null && salaryMax != null && salaryMin > salaryMax) {
    return { error: "Gaji minimum tidak boleh lebih besar dari gaji maksimum." };
  }

  return {
    data: {
      title,
      description,
      requirements,
      jobType: jobType as JobType,
      workMode: workMode as WorkMode,
      city: str("city", 100) || null,
      salaryMin,
      salaryMax,
      minEducation: EDU_LEVELS.includes(edu) ? edu : null,
      minExperienceYears: Math.min(50, Math.max(0, parseInt(String(fd.get("minExperienceYears") ?? "0"), 10) || 0)),
      requiredSkills: String(fd.get("requiredSkills") ?? "")
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 20),
    },
  };
}

function refresh() {
  revalidateTag("jobs");
  revalidatePath(LIST);
  revalidatePath("/jobs");
}

export async function createJob(fd: FormData): Promise<void> {
  const s = await requireRole("EMPLOYER");
  const back = `${LIST}/new`;
  const company = await db.company.findFirst({ where: { members: { some: { userId: s.uid } } } });
  if (!company) return fail(back, "Akun Anda belum terhubung ke perusahaan.");
  if (company.verification === "REJECTED" || company.verification === "SUSPENDED") {
    return fail(back, "Perusahaan Anda tidak dapat memasang lowongan saat ini. Hubungi admin.");
  }
  const r = parseJob(fd);
  if ("error" in r) return fail(back, r.error);

  const slug = `${slugify(r.data.title)}-${Math.random().toString(36).slice(2, 8)}`;
  const status = company.verification === "VERIFIED" ? "ACTIVE" : "PENDING_REVIEW";
  try {
    await db.job.create({ data: { ...r.data, companyId: company.id, slug, status } });
  } catch {
    return fail(back, "Gagal menyimpan. Coba lagi sebentar lagi.");
  }
  refresh();
  redirect(`${LIST}?ok=dibuat`);
}

export async function updateJob(fd: FormData): Promise<void> {
  const s = await requireRole("EMPLOYER");
  const id = String(fd.get("id") ?? "");
  const job = await db.job.findFirst({
    where: { id, company: { members: { some: { userId: s.uid } } } },
    include: { company: true },
  });
  if (!job) return redirect(LIST);
  const back = `${LIST}/${id}`;
  const r = parseJob(fd);
  if ("error" in r) return fail(back, r.error);

  const activate = job.status === "PENDING_REVIEW" && job.company.verification === "VERIFIED";
  try {
    await db.job.update({ where: { id }, data: { ...r.data, ...(activate ? { status: "ACTIVE" as const } : {}) } });
  } catch {
    return fail(back, "Gagal menyimpan. Coba lagi sebentar lagi.");
  }
  refresh();
  redirect(`${LIST}?ok=diubah`);
}

export async function setJobClosed(fd: FormData): Promise<void> {
  const s = await requireRole("EMPLOYER");
  const id = String(fd.get("id") ?? "");
  const close = fd.get("closed") === "1";
  const job = await db.job.findFirst({
    where: { id, company: { members: { some: { userId: s.uid } } } },
    include: { company: true },
  });
  if (!job || job.status === "REJECTED") return redirect(LIST);

  let status: "CLOSED" | "ACTIVE" | "PENDING_REVIEW" = "CLOSED";
  if (!close) status = job.company.verification === "VERIFIED" ? "ACTIVE" : "PENDING_REVIEW";
  if (job.status !== status) {
    await db.job.update({ where: { id }, data: { status } });
  }
  refresh();
  redirect(`${LIST}?ok=${close ? "ditutup" : "dibuka"}`);
}
