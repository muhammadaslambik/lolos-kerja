import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { STAGE_LABEL, StageKey } from "@/lib/constants";
import ProfileForm from "@/components/ProfileForm";
import { respondInvite } from "@/app/actions/talent";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dasbor Pelamar" };

export default async function SeekerDashboard() {
  const s = await requireRole("SEEKER");
  const [profile, enrollments, apps, invites] = await Promise.all([
    db.seekerProfile.findUnique({ where: { userId: s.uid } }),
    db.enrollment.findMany({ where: { userId: s.uid }, include: { course: true, certificate: true } }),
    db.application.findMany({ where: { seekerId: s.uid }, include: { job: { include: { company: true } } }, orderBy: { createdAt: "desc" } }),
    db.talentInvite.findMany({
      where: { seekerId: s.uid },
      include: { company: { select: { name: true } }, job: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Halo, {s.name}</h1>
      <p className="text-sm"><Link href="/dashboard/seeker/cv" className="btn btn-ghost inline-block">Asisten CV</Link></p>
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
              {e.certificate && (
                <a href={`/api/certificates/${e.certificate.code}/pdf`} className="mt-1 inline-block text-xs underline">Unduh sertifikat</a>
              )}
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

      {invites.length > 0 && (
        <section className="panel">
          <h2 className="font-bold">Undangan dari perusahaan</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {invites.map((i) => (
              <li key={i.id}>
                <p className="font-medium">{i.company.name}{i.job ? `, untuk posisi ${i.job.title}` : ""}</p>
                <p className="text-xs text-ink/70">{i.message}</p>
                {i.status === "sent" ? (
                  <form action={respondInvite} className="mt-2 flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={i.id} />
                    <button name="decision" value="accept" className="btn btn-primary !py-1 text-xs">Terima dan bagikan email saya</button>
                    <button name="decision" value="decline" className="btn btn-ghost !py-1 text-xs">Tolak</button>
                  </form>
                ) : (
                  <span className="tag mt-1 inline-block">{i.status === "accepted" ? "Anda menerima" : "Anda menolak"}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink/60">
            Dengan menerima, email akun Anda dibagikan kepada perusahaan tersebut. Perusahaan tidak melihat email Anda sebelum Anda menerima.
          </p>
        </section>
      )}

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
