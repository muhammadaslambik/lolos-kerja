import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { orderedLessons } from "@/lib/course-utils";
import { completeLesson } from "@/app/actions/courses";
import { setLessonVideo } from "@/app/actions/lesson-video";
import { youtubeEmbedUrl, youtubeId, youtubeWatchUrl } from "@/lib/youtube";

export const dynamic = "force-dynamic";
export const metadata = { title: "Belajar" };

const VIDEO_MSG: Record<string, string> = {
  disimpan: "Video pelajaran disimpan.",
  dihapus: "Video pelajaran dihapus.",
};

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: { slug: string; lessonId: string };
  searchParams: { error?: string; video?: string };
}) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role !== "SEEKER" && s.role !== "ADMIN") redirect("/");
  const isAdmin = s.role === "ADMIN";

  const course = await db.course.findFirst({ where: { slug: params.slug, published: true } });
  if (!course) notFound();

  // Pelamar harus terdaftar di kelas. Admin boleh membuka semua pelajaran untuk pratinjau dan mengatur video.
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
  const yt = lesson.videoRef ? youtubeId(lesson.videoRef) : null;
  const otherVideo = !yt && lesson.type === "video" && lesson.videoRef && lesson.videoRef.startsWith("https://");
  const okMsg = searchParams.video ? VIDEO_MSG[searchParams.video] : "";

  return (
    <div className="max-w-3xl">
      <p className="mb-2 text-sm"><Link href={`/courses/${course.slug}`} className="underline">Kembali ke {course.title}</Link></p>
      <p className="text-xs text-ink/70">{lesson.module.title}</p>
      <h1 className="mb-3 text-2xl font-extrabold">{lesson.title}</h1>

      {okMsg && <p role="status" className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-ink">{okMsg}</p>}
      {searchParams.error && (
        <p role="alert" className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{searchParams.error}</p>
      )}

      {yt && (
        <div className="mb-3">
          <div className="overflow-hidden rounded-lg border border-line bg-black">
            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
              <iframe
                src={youtubeEmbedUrl(yt)}
                title={`Video: ${lesson.title}`}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-ink/60">
            Video tidak muncul? <a href={youtubeWatchUrl(yt)} target="_blank" rel="noopener noreferrer" className="underline">Buka di YouTube</a>
          </p>
        </div>
      )}

      <article className="panel whitespace-pre-line text-sm leading-relaxed">
        {lesson.content ?? "Materi belum tersedia."}
      </article>
      {otherVideo && (
        <p className="mt-3 text-sm">
          <a href={lesson.videoRef ?? "#"} target="_blank" rel="noopener noreferrer" className="underline">Tonton video materi</a>
        </p>
      )}

      {isAdmin && (
        <section className="panel mt-4 space-y-2">
          <h2 className="text-sm font-bold">Atur video pelajaran (khusus admin)</h2>
          <form action={setLessonVideo} className="space-y-2">
            <input type="hidden" name="lessonId" value={lesson.id} />
            <label htmlFor="videoUrl" className="block text-sm font-semibold">Link video YouTube</label>
            <input
              id="videoUrl"
              name="url"
              defaultValue={lesson.videoRef ?? ""}
              placeholder="https://www.youtube.com/watch?v=..."
              maxLength={300}
              className="field"
            />
            <p className="text-xs text-ink/60">Bisa memakai link watch, youtu.be, shorts, atau embed. Link dari situs lain ditolak.</p>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary !py-1 text-sm">Simpan video</button>
              {lesson.videoRef && (
                <button name="remove" value="1" className="btn btn-ghost !py-1 text-sm">Hapus video</button>
              )}
            </div>
          </form>
        </section>
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
