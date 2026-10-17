"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { loadQuestions, orderedLessons } from "@/lib/course-utils";

export async function enrollCourse(fd: FormData): Promise<void> {
  const s = await requireRole("SEEKER");
  const slug = String(fd.get("slug") ?? "");
  const course = await db.course.findFirst({ where: { slug, published: true } });
  if (!course) return redirect("/courses");
  if (course.price > 0) {
    const msg = "Kelas berbayar belum tersedia. Pembayaran sedang disiapkan.";
    return redirect(`/courses/${slug}?error=${encodeURIComponent(msg)}`);
  }
  try {
    await db.enrollment.upsert({
      where: { userId_courseId: { userId: s.uid, courseId: course.id } },
      update: {},
      create: { userId: s.uid, courseId: course.id },
    });
  } catch {
    const msg = "Gagal mendaftar. Coba lagi sebentar lagi.";
    return redirect(`/courses/${slug}?error=${encodeURIComponent(msg)}`);
  }
  revalidatePath("/dashboard/seeker");
  redirect(`/courses/${slug}`);
}

export async function completeLesson(fd: FormData): Promise<void> {
  const s = await requireRole("SEEKER");
  const lessonId = String(fd.get("lessonId") ?? "");
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });
  if (!lesson || !lesson.module.course.published) return redirect("/courses");
  const course = lesson.module.course;
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: s.uid, courseId: course.id } },
  });
  if (!enrollment) return redirect(`/courses/${course.slug}`);

  await db.lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
    update: {},
    create: { enrollmentId: enrollment.id, lessonId },
  });
  const all = await orderedLessons(course.id);
  const done = await db.lessonProgress.count({
    where: { enrollmentId: enrollment.id, lesson: { module: { courseId: course.id } } },
  });
  const pct = all.length ? Math.min(100, Math.round((done / all.length) * 100)) : 0;
  await db.enrollment.update({ where: { id: enrollment.id }, data: { progressPct: pct } });

  revalidatePath("/dashboard/seeker");
  revalidatePath(`/courses/${course.slug}`);
  const idx = all.findIndex((l) => l.id === lessonId);
  const next = idx >= 0 ? all[idx + 1] : undefined;
  if (next) return redirect(`/courses/${course.slug}/belajar/${next.id}`);
  redirect(`/courses/${course.slug}?selesai=1`);
}

export async function submitQuiz(fd: FormData): Promise<void> {
  const s = await requireRole("SEEKER");
  const slug = String(fd.get("slug") ?? "");
  const course = await db.course.findFirst({ where: { slug, published: true } });
  if (!course) return redirect("/courses");
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: s.uid, courseId: course.id } },
  });
  if (!enrollment) return redirect(`/courses/${slug}`);

  const [lessons, questions, done] = await Promise.all([
    orderedLessons(course.id),
    loadQuestions(course.id),
    db.lessonProgress.count({
      where: { enrollmentId: enrollment.id, lesson: { module: { courseId: course.id } } },
    }),
  ]);
  if (questions.length === 0 || done < lessons.length) return redirect(`/courses/${slug}`);

  let correct = 0;
  questions.forEach((q, i) => {
    const raw = fd.get(`q${i}`);
    if (raw !== null && String(raw) !== "" && Number(raw) === q.answerIdx) correct += 1;
  });
  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= course.passScore;

  await db.enrollment.update({
    where: { id: enrollment.id },
    data: {
      finalScore: Math.max(enrollment.finalScore ?? 0, score),
      ...(passed && enrollment.status !== "completed" ? { status: "completed", completedAt: new Date() } : {}),
    },
  });
  revalidatePath("/dashboard/seeker");
  revalidatePath(`/courses/${slug}`);
  redirect(`/courses/${slug}/kuis?benar=${correct}&total=${questions.length}&skor=${score}`);
}
