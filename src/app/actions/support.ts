"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

// Mengirim undangan panggilan (suara atau video) ke percakapan bantuan, lalu membuka halaman percakapan
export async function startSupportCall(fd: FormData): Promise<void> {
  const s = await getSession();
  if (!s) return redirect("/login");
  const userId = String(fd.get("userId") ?? "");
  const mode = String(fd.get("mode") ?? "") === "audio" ? "audio" : "video";
  const isAdmin = s.role === "ADMIN";
  if (!isAdmin && s.uid !== userId) return redirect("/");
  if (!isAdmin && s.role !== "SEEKER" && s.role !== "EMPLOYER") return redirect("/");

  const page = isAdmin ? `/dashboard/admin/pesan/${userId}` : "/bantuan";
  if (isAdmin) {
    const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!target || target.role === "ADMIN") return redirect("/dashboard/admin/pesan");
  }
  const recent = await db.supportMessage.count({ where: { senderId: s.uid, createdAt: { gte: new Date(Date.now() - 60_000) } } });
  if (recent < 20) {
    await db.supportMessage.create({ data: { userId, senderId: s.uid, fromAdmin: isAdmin, kind: "call", body: mode } });
    revalidatePath(page);
  }
  redirect(page);
}
