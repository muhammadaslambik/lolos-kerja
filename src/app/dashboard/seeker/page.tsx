import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { EDU_LEVELS, STAGE_LABEL, StageKey } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dasbor Pelamar" };

async function saveProfile(fd: FormData) {
  "use server";
  const s = await requireRole("SEEKER");
  const str = (k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max) || null;
  const edu = String(fd.get("educationLevel") ?? "");
  const data = {
    headline: str("headline", 150),
    city: str("city", 100),
    educationLevel: EDU_LEVELS.includes(edu) ? edu : null,
    experienceYears: Math.min(50, Math.max(0, parseInt(String(fd.get("experienceYears") ?? "0"), 10) || 0)),
    skills: String(fd.get("skills") ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean).slice(0, 20),
    talentVisible: fd.get("talentVisible") === "on",
  };
  await db.seekerProfile.upsert({ where: { userId: s.uid }, update: data, create: { userId: s.uid, ...data } });
  revalidatePath("/dashboard/seeker");
}

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
        <form action={saveProfile} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold">Headline
            <input name="headline" defaultValue={profile?.headline ?? ""} placeholder="Contoh: Fresh graduate Manajemen" className="field mt-1 font-normal" />
          </label>
          <label className="text-sm font-semibold">Kota
            <input name="city" defaultValue={profile?.city ?? ""} className="field mt-1 font-normal" />
          </label>
          <label className="text-sm font-semibold">Pendidikan terakhir
            <select name="educationLevel" defaultValue={profile?.educationLevel ?? ""} className="field mt-1 font-normal">
              <option value="">Pilih</option>
              {EDU_LEVELS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Pengalaman (tahun)
            <input name="experienceYears" type="number" min={0} max={50} defaultValue={profile?.experienceYears ?? 0} className="field mt-1 font-normal" />
          </label>
          <label className="text-sm font-semibold md:col-span-2">Keahlian (pisahkan dengan koma)
            <input name="skills" defaultValue={profile?.skills.join(", ") ?? ""} placeholder="excel, komunikasi, administrasi" className="field mt-1 font-normal" />
          </label>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" name="talentVisible" defaultChecked={profile?.talentVisible ?? false} />
            Izinkan profil saya tampil di Talent Pool perusahaan
          </label>
          <div className="md:col-span-2"><button className="btn btn-primary">Simpan profil</button></div>
        </form>
      </section>
    </div>
  );
}
