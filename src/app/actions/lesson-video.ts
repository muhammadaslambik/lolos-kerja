"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { youtubeId, youtubeWatchUrl } from "@/lib/youtube";

// Hanya admin yang boleh memasang atau menghapus video pelajaran.
export async function setLessonVideo(fd: FormData): Promise<void> {
  await requireRole("ADMIN");
  const lessonId = String(fd.get("lessonId") ?? "");
  const raw = String(fd.get("url") ?? "").trim();
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: { select: { slug: true } } } } },
  });
  if (!lesson) return redirect("/courses");
  const base = `/courses/${lesson.module.course.slug}/belajar/${lessonId}`;
  const err = (m: string) => redirect(`${base}?error=${encodeURIComponent(m)}`);

  if (fd.get("remove") === "1") {
    await db.lesson.update({ where: { id: lessonId }, data: { type: "text", videoRef: null } });
    revalidatePath(base);
    return redirect(`${base}?video=dihapus`);
  }
  if (!raw) return err("Tempel link video YouTube dulu.");
  const id = youtubeId(raw);
  if (!id) return err("Link tidak valid. Gunakan link video YouTube, misalnya https://www.youtube.com/watch?v=...");

  await db.lesson.update({ where: { id: lessonId }, data: { type: "video", videoRef: youtubeWatchUrl(id) } });
  revalidatePath(base);
  redirect(`${base}?video=disimpan`);
}
