import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { STAGE_LABEL, StageKey } from "@/lib/constants";
import ProfileForm from "@/components/ProfileForm";
import { respondInvite } from "@/app/actions/talent";
import { DECLINE_REASONS } from "@/lib/talent";
import { canChat } from "@/lib/chat";

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
      <p className="flex flex-wrap gap-2 text-sm">
        <Link href="/dashboard/seeker/cv" className="btn btn-ghost inline-block">Asisten CV</Link>
        <Link href="/dashboard/seeker/pesan" className="btn btn-ghost inline-block">Pesan</Link>
      </p>
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
                <span className="flex items-center gap-2">
                  <span className="tag">{STAGE_LABEL[a.stage as StageKey]}</span>
                  {canChat(a.stage) && (
                    <Link href={`/dashboard/seeker/pesan/${a.id}`} className="btn btn-ghost !py-0.5 text-xs">Pesan</Link>
                  )}
                </span>
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
                  <form action={respondInvite} className="mt-2 flex flex-wrap items-start gap-2">
                    <input type="hidden" name="id" value={i.id} />
                    <button name="decision" value="accept" formNoValidate className="btn btn-primary !py-1 text-xs">Terima dan bagikan email saya</button>
                    <details className="group">
                      <summary className="btn btn-ghost cursor-pointer list-none !py-1 text-xs [&::-webkit-details-marker]:hidden">Tolak</summary>
                      <div className="mt-2 max-w-sm rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs">
                        <p className="font-semibold">Yakin ingin menolak undangan ini?</p>
                        <p className="mt-1 text-ink/70">
                          Keputusan ini tidak dapat diubah. {i.company.name} baru dapat mengundang Anda lagi jika Anda memperbarui keahlian atau perusahaan memasang lowongan baru (maksimal 3 undangan). Email Anda tidak dibagikan.
                        </p>
                        <label className="mt-2 block font-semibold">
                          Alasan menolak
                          <select name="reason" required defaultValue="" className="field mt-1 text-xs">
                            <option value="" disabled>Pilih alasan</option>
                            {Object.entries(DECLINE_REASONS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </label>
                        <label className="mt-2 block font-semibold">
                          Catatan (opsional)
                          <textarea name="note" maxLength={200} rows={2} className="field mt-1 text-xs" placeholder="Misalnya: gaji minimal yang saya harapkan" />
                        </label>
                        <p className="mt-1 text-ink/70">Alasan dan catatan Anda akan terlihat oleh perusahaan.</p>
                        <button name="decision" value="decline" className="btn btn-ghost mt-2 !py-1 text-xs">Ya, tolak undangan</button>
                        <p className="mt-2 text-ink/60">Untuk membatalkan, klik tombol Tolak sekali lagi.</p>
                      </div>
                    </details>
                  </form>
                ) : (
                  <p className="mt-1">
                    <span className="tag inline-block">{i.status === "accepted" ? "Anda menerima" : "Anda menolak"}</span>
                    {i.status === "declined" && i.declineReason && DECLINE_REASONS[i.declineReason] && (
                      <span className="ml-2 text-xs text-ink/70">Alasan: {DECLINE_REASONS[i.declineReason]}</span>
                    )}
                  </p>
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
