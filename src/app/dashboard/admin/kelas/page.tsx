import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { rupiah } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kelola Kelas" };

export default async function AdminCourses() {
  await requireRole("ADMIN");
  const courses = await db.course.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      published: true,
      price: true,
      category: true,
      _count: { select: { modules: true, enrollments: true } },
    },
  });
  const lessonCounts = await db.lesson.groupBy({ by: ["moduleId"], _count: { _all: true } });
  const modules = await db.module.findMany({ select: { id: true, courseId: true } });
  const perModule = new Map(lessonCounts.map((r) => [r.moduleId, r._count._all]));
  const perCourse = new Map<string, number>();
  for (const m of modules) perCourse.set(m.courseId, Number(perCourse.get(m.courseId) ?? 0) + Number(perModule.get(m.id) ?? 0));

  return (
    <div className="space-y-4">
      <p className="text-sm"><Link href="/dashboard/admin" className="underline">Kembali ke dasbor admin</Link></p>
      <h1 className="text-2xl font-extrabold">Kelola kelas</h1>
      <p className="text-sm text-ink/70">Pilih kelas untuk mengatur modul, materi tertulis, video, dan soal kuis.</p>
      <div className="space-y-3">
        {courses.map((c) => (
          <div key={c.id} className="panel flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-semibold">{c.title}</p>
              <p className="text-xs text-ink/70">
                {c.category ?? "-"}, {c._count.modules} modul, {perCourse.get(c.id) ?? 0} pelajaran, {c._count.enrollments} peserta,{" "}
                {c.price === 0 ? "Gratis" : rupiah(c.price)}
              </p>
              <span className="tag mt-1 inline-block">{c.published ? "Tayang" : "Draf"}</span>
            </div>
            <Link href={`/dashboard/admin/kelas/${c.id}`} className="btn btn-primary !py-1 text-sm">Kelola isi kelas</Link>
          </div>
        ))}
        {courses.length === 0 && <p className="panel text-sm">Belum ada kelas.</p>}
      </div>
    </div>
  );
}
