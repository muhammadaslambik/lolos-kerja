import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { deleteResume } from "@/app/actions/resumes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Asisten CV" };

export default async function CvList() {
  const s = await requireRole("SEEKER");
  const resumes = await db.resume.findMany({ where: { userId: s.uid }, orderBy: { createdAt: "desc" } });
  return (
    <div className="max-w-3xl">
      <p className="mb-2 text-sm"><Link href="/dashboard/seeker" className="underline">Kembali ke dasbor</Link></p>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">Asisten CV</h1>
        <Link href="/dashboard/seeker/cv/new" className="btn btn-primary">Buat CV baru</Link>
      </div>
      <p className="mb-4 text-sm text-ink/70">
        Susun CV yang rapi dan ramah ATS, lihat skor dan saran perbaikannya, lalu unduh sebagai PDF. Skor berasal dari aturan penilaian sederhana, bukan dari sistem ATS milik perusahaan.
      </p>

      {resumes.length === 0 && <p className="panel text-sm">Belum ada CV. Klik Buat CV baru untuk memulai.</p>}

      <div className="space-y-3">
        {resumes.map((r) => (
          <div key={r.id} className="panel flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-semibold">{r.title} {r.isPrimary && <span className="tag">Utama</span>}</p>
              <p className="text-xs text-ink/70">Skor ATS: {r.atsScore ?? "-"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/seeker/cv/${r.id}`} className="btn btn-ghost !py-1 text-xs">Ubah dan analisis</Link>
              <a href={`/api/resumes/${r.id}/pdf`} className="btn btn-ghost !py-1 text-xs">Unduh PDF</a>
              <form action={deleteResume}>
                <input type="hidden" name="id" value={r.id} />
                <button className="btn btn-ghost !py-1 text-xs">Hapus</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
