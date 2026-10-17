import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { STAGE_LABEL, StageKey } from "@/lib/constants";
import ProfileForm from "@/components/ProfileForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dasbor Pelamar" };

export default async function SeekerDashboard() {
  const s = await requireRole("SEEKER");
  const [profile, enrollments, apps] = await Promise.all([
    db.seekerProfile.findUnique({ where: { userId: s.uid } }),
    db.enrollment.findMany({ where: { userId: s.uid }, include: { course: true } }),
    db.application.findMany({ where: { seekerId: s.uid }, include: { job: { include: { company: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Halo, {s.name}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="panel">
          <h2 className="font-bold">Lanjutkan belajar</h2>
          {enrollments.map((e) => (
            <div key={e.id} className="mt-3">
              <Link href={`/courses/${e.course.slug}`} className="text-sm font-medium underline">{e.course.title}</Link>
              <div className="mt-1 h-2 rounded bg-line"><div className="h-2 rounded bg-brand" style={{ width: `${e.progressPct}%` }} /></div>
              <p className="mt-1 text-xs text-ink/60">
                {e.progressPct}% selesai
                {e.status === "completed" && e.finalScore !== null && ` | Lulus, nilai ${e.finalScore}`}
              </p>
            </div>
          ))}
          {enrollments.length === 0 && <p className="mt-2 text-sm">Belum ada kelas. Pilih kelas pertama Anda di menu Kelas.</p>}
        </section>
        <section className="panel">
          <h2 className="font-bold">Status lamaran</h2>
          <ul className="mt-3 space-y-2">
            {apps.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                <span>{a.job.title}, {a.job.company.name}</span>
                <span className="tag">{STAGE_LABEL[a.stage as StageKey]}</span>
              </li>
            ))}
            {apps.length === 0 && <li className="text-sm">Belum ada lamaran. Buka menu Lowongan untuk mulai melamar.</li>}
          </ul>
        </section>
      </div>

      <section className="panel">
        <h2 className="font-bold">Profil saya</h2>
        <p className="mt-1 text-sm text-ink/70">Profil yang lengkap menaikkan skor kecocokan lamaran Anda.</p>
        <ProfileForm
          profile={
            profile && {
              headline: profile.headline,
              city: profile.city,
              educationLevel: profile.educationLevel,
              experienceYears: profile.experienceYears,
              skills: profile.skills,
              talentVisible: profile.talentVisible,
            }
          }
        />
      </section>
    </div>
  );
}
