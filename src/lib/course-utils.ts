import { db } from "@/lib/db";

// Daftar pelajaran satu kelas, berurutan dari modul pertama sampai terakhir
export function orderedLessons(courseId: string) {
  return db.lesson.findMany({
    where: { module: { courseId } },
    orderBy: [{ module: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    select: { id: true, title: true },
  });
}

export type QuizQuestion = { q: string; options: string[]; answerIdx: number; explanation: string };

// Gabungan semua soal kuis dalam satu kelas, urutannya tetap (modul, lalu id kuis)
export async function loadQuestions(courseId: string): Promise<QuizQuestion[]> {
  const quizzes = await db.quiz.findMany({
    where: { module: { courseId } },
    orderBy: [{ module: { sortOrder: "asc" } }, { id: "asc" }],
    select: { questions: true },
  });
  const out: QuizQuestion[] = [];
  for (const z of quizzes) {
    if (!Array.isArray(z.questions)) continue;
    for (const raw of z.questions) {
      const r = raw as unknown as Record<string, unknown> | null;
      if (!r || typeof r.q !== "string" || !Array.isArray(r.options) || typeof r.answerIdx !== "number") continue;
      out.push({
        q: r.q,
        options: r.options.map(String),
        answerIdx: r.answerIdx,
        explanation: typeof r.explanation === "string" ? r.explanation : "",
      });
    }
  }
  return out;
}
