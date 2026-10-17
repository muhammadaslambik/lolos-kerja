"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { EDU_LEVELS } from "@/lib/constants";

export type ProfileState = { ok?: boolean; error?: string };

export async function saveProfile(_: ProfileState, fd: FormData): Promise<ProfileState> {
  const s = await requireRole("SEEKER");
  const str = (k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max) || null;
  const edu = String(fd.get("educationLevel") ?? "");
  const data = {
    headline: str("headline", 150),
    city: str("city", 100),
    educationLevel: EDU_LEVELS.includes(edu) ? edu : null,
    experienceYears: Math.min(50, Math.max(0, parseInt(String(fd.get("experienceYears") ?? "0"), 10) || 0)),
    skills: String(fd.get("skills") ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean).slice(0, 20),
    talentVisible: fd.get("talentVisible") === "on",
  };
  try {
    await db.seekerProfile.upsert({ where: { userId: s.uid }, update: data, create: { userId: s.uid, ...data } });
  } catch {
    return { error: "Gagal menyimpan. Coba lagi sebentar lagi." };
  }
  revalidatePath("/dashboard/seeker");
  return { ok: true };
}
