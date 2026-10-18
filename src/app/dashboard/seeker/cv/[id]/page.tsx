import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { analyzeCv, matchKeywords, parseCv } from "@/lib/cv-analysis";
import { saveResume } from "@/app/actions/resumes";
import CvForm from "@/components/CvForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ubah CV" };

export default async function EditCv({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; ok?: string; lowongan?: string };
}) {
  const s = await requireRole("SEEKER");
  const resume = await db.resume.findFirst({ where: { id: params.id, userId: s.uid } });
  if (!resume) notFound();

  const cv = parseCv(resume.content);
  const analysis = analyzeCv(cv);
  const jobs = await db.job.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, title: true, company: { select: { name: true } } },
  });
  const job = searchParams.lowongan
    ? await db.job.findFirst({ where: { id: searchParams.lowongan, status: "ACTIVE" }, select: { title: true, requiredSkills: true } })
    : null;
  const kw = job ? matchKeywords(cv, job.requiredSkills) : null;

  return (
    <div className="max-w-3xl space-y-6">
      <p className="text-sm"><Link href="/dashboard/seeker/cv" className="underline">Kembali ke daftar CV</Link></p>
      <h1 className="text-2xl font-extrabold">Ubah dan analisis CV</h1>

      {searchParams.ok && (
        <p role="status" className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-ink">CV tersimpan.</p>
      )}

      <section className="panel">
        <h2 className="font-bold">Skor ATS: {analysis.score} dari 100</h2>
        <div className="mt-2 h-2 rounded bg-line"><div className="h-2 rounded bg-brand" style={{ width: `${analysis.score}%` }} /></div>
        <p className="mt-2 text-xs text-ink/70">
          Skor ini perkiraan berdasarkan aturan sederhana (kelengkapan, kualitas poin, keahlian), bukan nilai dari sistem ATS milik perusahaan. Skor mengikuti isi CV yang sudah disimpan.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {analysis.checks.map((c) => (
            <li key={c.label}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{c.label}</span>
                <span className="tag">{c.points}/{c.max}</span>
              </div>
              {c.tip && <p className="text-xs text-ink/70">{c.tip}</p>}
            </li>
          ))}
        </ul>
        <a href={`/api/resumes/${resume.id}/pdf`} className="btn btn-primary mt-4 inline-block">Unduh CV (PDF)</a>
      </section>

      {analysis.bulletTips.length > 0 && (
        <section className="panel">
          <h2 className="font-bold">Saran untuk poin pencapaian</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {analysis.bulletTips.slice(0, 10).map((b, i) => (
              <li key={i}>
                <p className="font-medium">{b.text}</p>
                <ul className="mt-1 list-disc pl-5 text-xs text-ink/70">
                  {b.tips.map((t, j) => <li key={j}>{t}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel">
        <h2 className="font-bold">Cocokkan dengan lowongan</h2>
        <p className="mt-1 text-xs text-ink/70">Pilih lowongan untuk melihat keahlian yang diminta tetapi belum ada di CV Anda.</p>
        <form method="get" className="mt-3 flex flex-wrap gap-2">
          <select name="lowongan" defaultValue={searchParams.lowongan ?? ""} className="field max-w-md">
            <option value="">Pilih lowongan</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title} - {j.company.name}</option>
            ))}
          </select>
          <button className="btn btn-ghost">Analisis</button>
        </form>
        {job && kw && (
          <div className="mt-3 text-sm">
            <p className="font-medium">{job.title}: kecocokan kata kunci {kw.percent}%</p>
            <p className="mt-2 text-xs text-ink/70">Sudah ada di CV:</p>
            <p className="mt-1 flex flex-wrap gap-1">
              {kw.matched.length ? kw.matched.map((k) => <span key={k} className="tag">{k}</span>) : <span className="text-xs">Belum ada.</span>}
            </p>
            <p className="mt-2 text-xs text-ink/70">Belum ada di CV (tambahkan bila memang Anda kuasai):</p>
            <p className="mt-1 flex flex-wrap gap-1">
              {kw.missing.length ? kw.missing.map((k) => <span key={k} className="tag">{k}</span>) : <span className="text-xs">Semua keahlian yang diminta sudah tercantum.</span>}
            </p>
          </div>
        )}
      </section>

      <CvForm action={saveResume} cv={cv} title={resume.title} id={resume.id} error={searchParams.error} submitLabel="Simpan perubahan" />
    </div>
  );
}
