import Link from "next/link";
import { db } from "@/lib/db";
import { JOB_TYPE_LABEL, rupiah } from "@/lib/constants";
export const dynamic = "force-dynamic";

export default async function Home() {
  const jobs = await db.job.findMany({ where: { status: "ACTIVE" }, include: { company: true }, orderBy: { createdAt: "desc" }, take: 4 });
  return (
    <div className="space-y-12">
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">Belajar skill, bangun CV, lalu lolos kerja.</h1>
          <p className="mt-4 max-w-prose text-lg text-ink/75">
            Untuk fresh graduate, yang ingin pindah karier, dan siapa pun yang sedang mencari pekerjaan baru. Lulus kelas, dapat sertifikat, dan terlihat oleh perusahaan.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/courses" className="btn btn-primary">Mulai belajar gratis</Link>
            <Link href="/jobs" className="btn btn-ghost">Cari lowongan</Link>
          </div>
        </div>
        <div className="panel bg-brand text-white">
          <p className="mb-3 text-sm font-semibold text-sun">Lowongan terbaru</p>
          <ul className="divide-y divide-white/20">
            {jobs.map((j) => (
              <li key={j.id} className="py-3">
                <Link href={`/jobs/${j.slug}`} className="font-semibold hover:underline">{j.title}</Link>
                <p className="text-sm text-white/80">{j.company.name}, {j.city}. {rupiah(j.salaryMin)} sampai {rupiah(j.salaryMax)}</p>
              </li>
            ))}
            {jobs.length === 0 && <li className="py-3 text-sm">Belum ada lowongan. Jalankan seed database.</li>}
          </ul>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Belajar", "Kelas video dan teks, kuis per modul, dan sertifikat digital yang bisa diverifikasi."],
          ["Lamar", "Cari berdasarkan kota, gaji, dan tipe kerja. Lamar sekali klik dan pantau statusnya."],
          ["Dilihat perusahaan", "Perusahaan terverifikasi mencari alumni kelas yang siap kerja."],
        ].map(([t, d]) => (
          <div key={t} className="panel"><h2 className="font-bold">{t}</h2><p className="mt-1 text-sm text-ink/75">{d}</p></div>
        ))}
      </section>
    </div>
  );
}
