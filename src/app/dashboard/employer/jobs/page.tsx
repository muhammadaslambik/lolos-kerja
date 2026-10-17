import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { JOB_TYPE_LABEL, VERIFICATION_LABEL } from "@/lib/constants";
import { JOB_STATUS_LABEL } from "@/lib/job-options";
import { setJobClosed } from "@/app/actions/jobs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lowongan Saya" };

const OK_TEXT: Record<string, string> = {
  dibuat: "Lowongan berhasil disimpan.",
  diubah: "Perubahan lowongan tersimpan.",
  ditutup: "Lowongan ditutup.",
  dibuka: "Lowongan dibuka kembali.",
};

export default async function EmployerJobs({ searchParams }: { searchParams: { ok?: string } }) {
  const s = await requireRole("EMPLOYER");
  const where = { members: { some: { userId: s.uid } } };
  const company = await db.company.findFirst({ where });
  const jobs = await db.job.findMany({
    where: { company: where },
    include: { _count: { select: { applications: true } } },
    orderBy: { createdAt: "desc" },
  });
  const ok = searchParams.ok ? OK_TEXT[searchParams.ok] : undefined;

  return (
    <div>
      <p className="mb-2 text-sm"><Link href="/dashboard/employer" className="underline">Kembali ke dasbor</Link></p>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">Lowongan saya</h1>
        <Link href="/dashboard/employer/jobs/new" className="btn btn-primary">Pasang lowongan</Link>
      </div>
      {company && (
        <p className="mb-3 text-sm text-ink/70">
          {company.name}: <span className="tag">{VERIFICATION_LABEL[company.verification]}</span>
          {company.verification !== "VERIFIED" && " Lowongan berstatus Menunggu peninjauan akan tayang setelah perusahaan diverifikasi."}
        </p>
      )}
      {ok && <p role="status" className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700">{ok}</p>}

      {jobs.length === 0 && <p className="panel text-sm">Belum ada lowongan. Klik Pasang lowongan untuk membuat yang pertama.</p>}

      <div className="space-y-3">
        {jobs.map((j) => (
          <div key={j.id} className="panel flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-semibold">{j.title}</p>
              <p className="text-xs text-ink/70">
                {JOB_TYPE_LABEL[j.jobType]}{j.city ? `, ${j.city}` : ""}, {j._count.applications} pelamar
              </p>
              <span className="tag mt-1 inline-block">{JOB_STATUS_LABEL[j.status]}</span>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/employer/jobs/${j.id}`} className="btn btn-ghost !py-1 text-xs">Ubah</Link>
              {j.status !== "REJECTED" && (
                <form action={setJobClosed}>
                  <input type="hidden" name="id" value={j.id} />
                  <input type="hidden" name="closed" value={j.status === "CLOSED" ? "0" : "1"} />
                  <button className="btn btn-ghost !py-1 text-xs">{j.status === "CLOSED" ? "Buka kembali" : "Tutup"}</button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
