import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { loadQuestions, orderedLessons } from "@/lib/course-utils";
import { submitQuiz } from "@/app/actions/courses";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kuis Akhir" };

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { skor?: string; benar?: string; total?: string };
}) {
  const s = await requireRole("SEEKER");
  const course = await db.course.findFirst({ where: { slug: params.slug, published: true } });
  if (!course) notFound();

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: s.uid, courseId: course.id } },
  });
  if (!enrollment) redirect(`/courses/${course.slug}`);

  const [lessons, questions, done] = await Promise.all([
    orderedLessons(course.id),
    loadQuestions(course.id),
    db.lessonProgress.count({
      where: { enrollmentId: enrollment.id, lesson: { module: { courseId: course.id } } },
    }),
  ]);
  if (questions.length === 0 || done < lessons.length) redirect(`/courses/${course.slug}`);

  const skor = Number(searchParams.skor);
  const benar = Number(searchParams.benar);
  const total = Number(searchParams.total);
  const showResult =
    searchParams.skor !== undefined && Number.isFinite(skor) && Number.isFinite(benar) && Number.isFinite(total);
  const passed = showResult && skor >= course.passScore;

  return (
    <div className="max-w-3xl">
      <p className="mb-2 text-sm"><Link href={`/courses/${course.slug}`} className="underline">Kembali ke {course.title}</Link></p>
      <h1 className="text-2xl font-extrabold">Kuis akhir</h1>
      <p className="mt-1 text-sm text-ink/70">
        {questions.length} soal pilihan ganda. Nilai lulus {course.passScore}. Kuis boleh diulang.
        {enrollment.finalScore !== null && ` Nilai terbaik Anda: ${enrollment.finalScore}.`}
      </p>

      {showResult && passed && (
        <p role="status" className="mt-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700">
          Selamat, Anda lulus. Benar {benar} dari {total} soal, nilai {skor}. Sertifikat akan tersedia di tahap berikutnya.
        </p>
      )}
      {showResult && !passed && (
        <p role="alert" className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">
          Belum lulus. Benar {benar} dari {total} soal, nilai {skor}. Pelajari materinya lagi, lalu coba kembali.
        </p>
      )}

      <form action={submitQuiz} className="mt-4 space-y-4">
        <input type="hidden" name="slug" value={course.slug} />
        {questions.map((q, i) => (
          <fieldset key={i} className="panel">
            <legend className="px-1 text-sm font-bold">{i + 1}. {q.q}</legend>
            <div className="mt-2 space-y-1 text-sm">
              {q.options.map((o, j) => (
                <label key={j} className="flex items-start gap-2">
                  <input type="radio" name={`q${i}`} value={j} required className="mt-1" />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <button className="btn btn-primary">Kirim jawaban</button>
      </form>
    </div>
  );
}
