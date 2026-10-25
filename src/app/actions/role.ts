"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession, setSession } from "@/lib/session";
import { dashboardPath } from "@/lib/constants";

// Berpindah peran aktif untuk satu akun yang punya dua peran (Pelamar dan Perusahaan).
export async function switchRole(target: "SEEKER" | "EMPLOYER") {
  const s = await getSession();
  if (!s) redirect("/login");
  if (target !== "SEEKER" && target !== "EMPLOYER") redirect("/");
  if (s.role !== "SEEKER" && s.role !== "EMPLOYER") redirect("/"); // Admin tidak berpindah peran
  if (s.role === target) redirect(dashboardPath(target));

  try {
    if (target === "EMPLOYER") {
      // Hanya boleh bila akun ini sudah punya perusahaan
      const member = await db.companyMember.findFirst({ where: { userId: s.uid }, select: { userId: true } });
      if (!member) redirect("/register");
    } else {
      const prof = await db.seekerProfile.findUnique({ where: { userId: s.uid }, select: { userId: true } });
      if (!prof) await db.seekerProfile.create({ data: { userId: s.uid } });
    }
    await db.user.update({ where: { id: s.uid }, data: { role: target } });
  } catch (e) {
    // redirect() melempar error khusus; teruskan agar tetap berjalan
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirect("/");
  }

  await setSession({ uid: s.uid, role: target, name: s.name });
  redirect(dashboardPath(target));
}
