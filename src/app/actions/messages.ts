"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { canChat, getChatContext } from "@/lib/chat";

// Mengirim undangan panggilan ke percakapan, lalu membuka halaman pesan tempat tombol Gabung berada
export async function startCall(fd: FormData): Promise<void> {
  const s = await getSession();
  if (!s) return redirect("/login");
  const id = String(fd.get("id") ?? "");
  const mode = String(fd.get("mode") ?? "") === "audio" ? "audio" : "video";
  const ctx = await getChatContext(id, s);
  if (!ctx) return redirect("/");
  const base = ctx.side === "employer" ? "/dashboard/employer/pesan" : "/dashboard/seeker/pesan";

  if (canChat(ctx.app.stage)) {
    const recent = await db.message.count({ where: { senderId: s.uid, createdAt: { gte: new Date(Date.now() - 60_000) } } });
    if (recent < 20) {
      await db.message.create({ data: { applicationId: id, senderId: s.uid, kind: "call", body: mode } });
      revalidatePath(`${base}/${id}`);
    }
  }
  redirect(`${base}/${id}`);
}
