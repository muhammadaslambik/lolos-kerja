import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { loadQuestions } from "@/lib/course-utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lihat Jawaban" };

// Hanya untuk peserta yang nilainya sudah sempurna
export default async function AnswersPage({ params }: { params: { slug: string } }) {
  const s = await requireRole("SEEKER");
  const course = await db.course.findFirst({ where: { slug: params.slug, published: true } });
  if (!course) notFound();
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: s.uid, courseId: course.id } },
  });
  if (!enrollment || enrollment.finalScore !== 100) redirect(`/courses/${course.slug}`);

  const questions = await loadQuestions(course.id);

  return (
    <div className="max-w-3xl">
      <p className="mb-2 text-sm"><Link href={`/courses/${course.slug}`} className="underline">Kembali ke {course.title}</Link></p>
      <h1 className="text-2xl font-extrabold">Jawaban kuis akhir</h1>
      <p className="mt-1 text-sm text-ink/70">Nilai Anda sempurna (100). Berikut kunci jawaban dan pembahasannya.</p>

      <div className="mt-4 space-y-4">
        {questions.map((q, i) => (
          <section key={i} className="panel">
            <h2 className="text-sm font-bold">{i + 1}. {q.q}</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {q.options.map((o, j) => {
                const right = j === q.answerIdx;
                return (
                  <li
                    key={j}
                    className={`flex items-start gap-2 rounded-md border px-2 py-1 ${right ? "border-emerald-500/60 bg-emerald-500/10 font-semibold" : "border-transparent"}`}
                  >
                    <span>{o}</span>
                    {right && <span className="tag shrink-0">Jawaban benar</span>}
                  </li>
                );
              })}
            </ul>
            {q.explanation && <p className="mt-2 text-xs text-ink/70">Pembahasan: {q.explanation}</p>}
          </section>
        ))}
      </div>
    </div>
  );
}
