import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { orderedLessons } from "@/lib/course-utils";
import { completeLesson } from "@/app/actions/courses";
import { youtubeId } from "@/lib/youtube";
import { lessonVideos } from "@/lib/videos";
import VideoEmbed from "@/components/VideoEmbed";

export const dynamic = "force-dynamic";
export const metadata = { title: "Belajar" };

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: { slug: string; lessonId: string };
  searchParams: { error?: string };
}) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role !== "SEEKER" && s.role !== "ADMIN") redirect("/");
  const isAdmin = s.role === "ADMIN";

  const course = await db.course.findFirst({ where: { slug: params.slug, published: true } });
  if (!course) notFound();

  // Pelamar harus terdaftar di kelas. Admin boleh membuka semua pelajaran untuk pratinjau.
  const enrollment = isAdmin
    ? null
    : await db.enrollment.findUnique({
        where: { userId_courseId: { userId: s.uid, courseId: course.id } },
        include: { progress: { select: { lessonId: true } } },
      });
  if (!isAdmin && !enrollment) redirect(`/courses/${course.slug}`);

  const lesson = await db.lesson.findFirst({
    where: { id: params.lessonId, module: { courseId: course.id } },
    include: { module: true },
  });
  if (!lesson) notFound();

  const all = await orderedLessons(course.id);
  const idx = all.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? all[idx - 1] : undefined;
  const next = idx >= 0 ? all[idx + 1] : undefined;
  const isDone = !!enrollment?.progress.some((p) => p.lessonId === lesson.id);
  const videos = await lessonVideos(lesson.id, lesson.videoRef);
  const otherVideo =
    lesson.type === "video" && !!lesson.videoRef && !youtubeId(lesson.videoRef) && lesson.videoRef.startsWith("https://");

  return (
    <div className="max-w-3xl">
      <p className="mb-2 text-sm"><Link href={`/courses/${course.slug}`} className="underline">Kembali ke {course.title}</Link></p>
      <p className="text-xs text-ink/70">{lesson.module.title}</p>
      <h1 className="mb-3 text-2xl font-extrabold">{lesson.title}</h1>

      {searchParams.error && (
        <p role="alert" className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{searchParams.error}</p>
      )}

      {videos.map((v) => (
        <VideoEmbed key={v.id} id={v.youtubeId} title={v.title} label={`Video: ${lesson.title}`} />
      ))}

      <article className="panel whitespace-pre-line text-sm leading-relaxed">
        {lesson.content ?? "Materi belum tersedia."}
      </article>
      {otherVideo && (
        <p className="mt-3 text-sm">
          <a href={lesson.videoRef ?? "#"} target="_blank" rel="noopener noreferrer" className="underline">Tonton video materi</a>
        </p>
      )}

      {isAdmin && (
        <p className="mt-3 text-sm">
          <Link href={`/dashboard/admin/kelas/${course.id}#l-${lesson.id}`} className="underline">
            Edit pelajaran ini (materi dan video)
          </Link>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {prev && <Link href={`/courses/${course.slug}/belajar/${prev.id}`} className="btn btn-ghost">Sebelumnya</Link>}
        {isAdmin ? (
          <>
            <span className="tag">Pratinjau admin</span>
            {next && <Link href={`/courses/${course.slug}/belajar/${next.id}`} className="btn btn-primary">Berikutnya</Link>}
          </>
        ) : isDone ? (
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
