import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type Q = { q: string; options: string[]; answerIdx: number; explanation: string };

// Semua soal kuis sebuah modul, berurutan sama seperti yang dipakai peserta
export async function moduleQuestions(moduleId: string) {
  const rows = await db.quiz.findMany({ where: { moduleId }, orderBy: { id: "asc" }, select: { id: true, questions: true } });
  const list: Q[] = [];
  for (const row of rows) {
    if (!Array.isArray(row.questions)) continue;
    for (const raw of row.questions) {
      const r = raw as unknown as Record<string, unknown> | null;
      if (!r || typeof r.q !== "string" || !Array.isArray(r.options) || typeof r.answerIdx !== "number") continue;
      list.push({
        q: r.q,
        options: r.options.map(String),
        answerIdx: r.answerIdx,
        explanation: typeof r.explanation === "string" ? r.explanation : "",
      });
    }
  }
  return { rows, list };
}

// Menyimpan seluruh soal modul dalam satu baris kuis (baris ekstra digabung)
export async function writeQuestions(moduleId: string, rows: { id: string }[], list: Q[]) {
  const json = list as unknown as Prisma.InputJsonValue;
  if (rows.length === 0) {
    await db.quiz.create({ data: { moduleId, questions: json } });
    return;
  }
  const extra = rows.slice(1).map((r) => r.id);
  await db.$transaction([
    db.quiz.update({ where: { id: rows[0].id }, data: { questions: json } }),
    ...(extra.length ? [db.quiz.deleteMany({ where: { id: { in: extra } } })] : []),
  ]);
}
