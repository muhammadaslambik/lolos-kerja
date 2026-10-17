import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { rupiah } from "@/lib/constants";
import { enrollCourse } from "@/app/actions/courses";

export const dynamic = "force-dynamic";
export const metadata = { title: "Detail Kelas" };

export default async function CourseDetail({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { error?: string; selesai?: string };
}) {
  const course = await db.course.findFirst({
    where: { slug: params.slug, published: true },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: { lessons: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true } } },
      },
    },
  });
  if (!course) notFound();

  const s = await getSession();
  const enrollment =
    s && s.role === "SEEKER"
      ? await db.enrollment.findUnique({
          where: { userId_courseId: { userId: s.uid, courseId: course.id } },
          include: { progress: { select: { lessonId: true } } },
        })
      : null;

  const done = new Set((enrollment?.progress ?? []).map((p) => p.lessonId));
  const flat = course.modules.flatMap((m) => m.lessons);
  const pct = flat.length ? Math.round((flat.filter((l) => done.has(l.id)).length / flat.length) * 100) : 0;
  const nextLesson = flat.find((l) => !done.has(l.id)) ?? flat[0];

  return (
    <div className="max-w-3xl">
      <p className="mb-2 text-sm"><Link href="/courses" className="underline">Kembali ke daftar kelas</Link></p>
      <span className="tag">{course.category}</span>
      <h1 className="mt-2 text-2xl font-extrabold">{course.title}</h1>
      <p className="mt-1 text-sm text-ink/70">{course.description}</p>
      <p className="mt-2 text-sm">
        {flat.length} pelajaran, nilai lulus {course.passScore}.{" "}
        <span className="font-bold">{course.price === 0 ? "Gratis" : rupiah(course.price)}</span>
      </p>

      {searchParams.error && (
        <p role="alert" className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{searchParams.error}</p>
      )}
      {searchParams.selesai && (
        <p role="status" className="mt-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700">
          Semua materi sudah selesai. Kuis dan sertifikat akan tersedia di tahap berikutnya.
        </p>
      )}

      <div className="panel mt-4">
        {enrollment ? (
          <div>
            <p className="text-sm font-medium">Progres belajar Anda</p>
            <div className="mt-1 h-2 rounded bg-line"><div className="h-2 rounded bg-brand" style={{ width: `${pct}%` }} /></div>
            <p className="mt-1 text-xs text-ink/60">{pct}% selesai</p>
            {nextLesson && (
              <Link href={`/courses/${course.slug}/belajar/${nextLesson.id}`} className="btn btn-primary mt-3 inline-block">
                {pct === 0 ? "Mulai belajar" : "Lanjutkan belajar"}
              </Link>
            )}
          </div>
        ) : !s ? (
          <Link href="/login" className="btn btn-primary inline-block">Masuk untuk mendaftar</Link>
        ) : s.role !== "SEEKER" ? (
          <p className="text-sm">Hanya akun pelamar yang dapat mendaftar kelas.</p>
        ) : course.price > 0 ? (
          <p className="text-sm">Kelas berbayar belum tersedia. Pembayaran sedang disiapkan.</p>
        ) : (
          <form action={enrollCourse}>
            <input type="hidden" name="slug" value={course.slug} />
            <button className="btn btn-primary">Daftar kelas gratis</button>
          </form>
        )}
      </div>

      <h2 className="mb-2 mt-6 font-bold">Isi kelas</h2>
      <div className="space-y-3">
        {course.modules.map((m, i) => (
          <section key={m.id} className="panel">
            <h3 className="text-sm font-bold">Modul {i + 1}: {m.title}</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {m.lessons.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2">
                  {enrollment ? (
                    <Link href={`/courses/${course.slug}/belajar/${l.id}`} className="underline">{l.title}</Link>
                  ) : (
                    <span>{l.title}</span>
                  )}
                  {done.has(l.id) && <span className="tag">Selesai</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
