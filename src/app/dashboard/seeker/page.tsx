import { db } from "@/lib/db";
import { getDemoUser } from "@/lib/demo-user";
import { STAGES, STAGE_LABEL, StageKey } from "@/lib/constants";
export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard Pelamar" };

export default async function SeekerDashboard() {
  const user = await getDemoUser("SEEKER");
  const [enrollments, apps] = await Promise.all([
    db.enrollment.findMany({ where: { userId: user.id }, include: { course: true } }),
    db.application.findMany({ where: { seekerId: user.id }, include: { job: { include: { company: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Halo, {user.fullName}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="panel">
          <h2 className="font-bold">Lanjutkan belajar</h2>
          {enrollments.map((e) => (
            <div key={e.id} className="mt-3">
              <p className="text-sm font-medium">{e.course.title}</p>
              <div className="mt-1 h-2 rounded bg-line"><div className="h-2 rounded bg-brand" style={{ width: `${e.progressPct}%` }} /></div>
              <p className="mt-1 text-xs text-ink/60">{e.progressPct}% selesai</p>
            </div>
          ))}
          {enrollments.length === 0 && <p className="mt-2 text-sm">Belum ada kelas. Pilih kelas pertama Anda di menu Kelas.</p>}
        </section>
        <section className="panel">
          <h2 className="font-bold">Status lamaran</h2>
          <ul className="mt-3 space-y-2">
            {apps.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <span>{a.job.title}, {a.job.company.name}</span>
                <span className="tag">{STAGE_LABEL[a.stage as StageKey]}</span>
              </li>
            ))}
            {apps.length === 0 && <li className="text-sm">Belum ada lamaran. Buka menu Lowongan untuk mulai melamar.</li>}
          </ul>
          <p className="mt-3 text-xs text-ink/60">Tahap: {STAGES.map((s) => STAGE_LABEL[s]).join(", ")}</p>
        </section>
      </div>
    </div>
  );
}
