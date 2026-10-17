import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { orderedLessons } from "@/lib/course-utils";
import { completeLesson } from "@/app/actions/courses";

export const dynamic = "force-dynamic";
export const metadata = { title: "Belajar" };

export default async function LessonPage({ params }: { params: { slug: string; lessonId: string } }) {
  const s = await requireRole("SEEKER");
  const course = await db.course.findFirst({ where: { slug: params.slug, published: true } });
  if (!course) notFound();

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: s.uid, courseId: course.id } },
    include: { progress: { select: { lessonId: true } } },
  });
  if (!enrollment) redirect(`/courses/${course.slug}`);

  const lesson = await db.lesson.findFirst({
    where: { id: params.lessonId, module: { courseId: course.id } },
    include: { module: true },
  });
  if (!lesson) notFound();

  const all = await orderedLessons(course.id);
  const idx = all.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? all[idx - 1] : undefined;
  const next = idx >= 0 ? all[idx + 1] : undefined;
  const isDone = enrollment.progress.some((p) => p.lessonId === lesson.id);
  const videoOk = lesson.type === "video" && lesson.videoRef && lesson.videoRef.startsWith("https://");

  return (
    <div className="max-w-3xl">
      <p className="mb-2 text-sm"><Link href={`/courses/${course.slug}`} className="underline">Kembali ke {course.title}</Link></p>
      <p className="text-xs text-ink/70">{lesson.module.title}</p>
      <h1 className="mb-3 text-2xl font-extrabold">{lesson.title}</h1>

      <article className="panel whitespace-pre-line text-sm leading-relaxed">
        {lesson.content ?? "Materi belum tersedia."}
      </article>
      {videoOk && (
        <p className="mt-3 text-sm">
          <a href={lesson.videoRef ?? "#"} target="_blank" rel="noopener noreferrer" className="underline">Tonton video materi</a>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {prev && <Link href={`/courses/${course.slug}/belajar/${prev.id}`} className="btn btn-ghost">Sebelumnya</Link>}
        {isDone ? (
          <>
            <span className="tag">Sudah selesai</span>
            {next && <Link href={`/courses/${course.slug}/belajar/${next.id}`} className="btn btn-primary">Berikutnya</Link>}
          </>
        ) : (
          <form action={completeLesson}>
            <input type="hidden" name="lessonId" value={lesson.id} />
            <button className="btn btn-primary">{next ? "Tandai selesai dan lanjut" : "Tandai selesai"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
