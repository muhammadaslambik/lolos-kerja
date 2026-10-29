import { db } from "@/lib/db";

export type TopicQuestion = { q: string; options: string[]; answerIdx: number; explanation: string; topic: string };

// Sama persis dengan loadQuestions (urutan dan penyaringan), ditambah topik = judul modul asal soal
export async function loadQuestionsWithTopic(courseId: string): Promise<TopicQuestion[]> {
  const quizzes = await db.quiz.findMany({
    where: { module: { courseId } },
    orderBy: [{ module: { sortOrder: "asc" } }, { id: "asc" }],
    select: { questions: true, module: { select: { title: true } } },
  });
  const out: TopicQuestion[] = [];
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
        topic: z.module.title,
      });
    }
  }
  return out;
}
