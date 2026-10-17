import { db } from "@/lib/db";

// Daftar pelajaran satu kelas, berurutan dari modul pertama sampai terakhir
export function orderedLessons(courseId: string) {
  return db.lesson.findMany({
    where: { module: { courseId } },
    orderBy: [{ module: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    select: { id: true, title: true },
  });
}
