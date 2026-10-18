"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { analyzeCv, type CvContent } from "@/lib/cv-analysis";

const BASE = "/dashboard/seeker/cv";
const MAX_RESUMES = 5;

function fail(path: string, msg: string): never {
  redirect(`${path}?error=${encodeURIComponent(msg)}`);
}

function parseForm(fd: FormData): { error: string } | { title: string; cv: CvContent } {
  const str = (k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
  const cv: CvContent = {
    fullName: str("fullName", 120),
    email: str("email", 120),
    phone: str("phone", 40),
    city: str("city", 100),
    summary: str("summary", 1000),
    experiences: [],
    education: [],
    skills: str("skills", 600).split(",").map((x) => x.trim()).filter(Boolean).slice(0, 30),
  };
  for (let i = 0; i < 3; i++) {
    const role = str(`exp${i}_role`, 120);
    const company = str(`exp${i}_company`, 120);
    const period = str(`exp${i}_period`, 60);
    const bullets = String(fd.get(`exp${i}_bullets`) ?? "")
      .split("\n")
      .map((l) => l.replace(/^[\s\-*\u2022]+/, "").trim().slice(0, 300))
      .filter(Boolean)
      .slice(0, 8);
    if (role || company || bullets.length) cv.experiences.push({ role, company, period, bullets });
  }
  for (let i = 0; i < 2; i++) {
    const school = str(`edu${i}_school`, 150);
    const degree = str(`edu${i}_degree`, 150);
    const period = str(`edu${i}_period`, 60);
    if (school || degree) cv.education.push({ school, degree, period });
  }
  if (cv.fullName.length < 2) return { error: "Nama lengkap wajib diisi." };
  if (!/^\S+@\S+\.\S+$/.test(cv.email)) return { error: "Alamat email tidak valid." };
  return { title: str("title", 100) || "CV saya", cv };
}

export async function saveResume(fd: FormData): Promise<void> {
  const s = await requireRole("SEEKER");
  const id = String(fd.get("id") ?? "");
  const back = id ? `${BASE}/${id}` : `${BASE}/new`;
  const r = parseForm(fd);
  if ("error" in r) return fail(back, r.error);
  const atsScore = analyzeCv(r.cv).score;
  const content = r.cv as unknown as Prisma.InputJsonValue;

  if (id) {
    const own = await db.resume.findFirst({ where: { id, userId: s.uid }, select: { id: true } });
    if (!own) return redirect(BASE);
    try {
      await db.resume.update({ where: { id }, data: { title: r.title, content, atsScore } });
    } catch {
      return fail(back, "Gagal menyimpan. Coba lagi sebentar lagi.");
    }
    revalidatePath(BASE);
    redirect(`${BASE}/${id}?ok=1`);
  }

  const count = await db.resume.count({ where: { userId: s.uid } });
  if (count >= MAX_RESUMES) return fail(back, `Maksimal ${MAX_RESUMES} CV. Hapus salah satu terlebih dulu.`);
  let newId = "";
  try {
    const c = await db.resume.create({
      data: { userId: s.uid, title: r.title, content, atsScore, isPrimary: count === 0 },
      select: { id: true },
    });
    newId = c.id;
  } catch {
    return fail(back, "Gagal menyimpan. Coba lagi sebentar lagi.");
  }
  revalidatePath(BASE);
  redirect(`${BASE}/${newId}?ok=1`);
}

export async function deleteResume(fd: FormData): Promise<void> {
  const s = await requireRole("SEEKER");
  const id = String(fd.get("id") ?? "");
  const own = await db.resume.findFirst({ where: { id, userId: s.uid } });
  if (!own) return redirect(BASE);
  await db.resume.delete({ where: { id } });
  if (own.isPrimary) {
    const next = await db.resume.findFirst({ where: { userId: s.uid }, orderBy: { createdAt: "desc" }, select: { id: true } });
    if (next) await db.resume.update({ where: { id: next.id }, data: { isPrimary: true } });
  }
  revalidatePath(BASE);
  redirect(BASE);
}
