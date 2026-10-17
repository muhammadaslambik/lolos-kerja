import Link from "next/link";
import { unstable_cache } from "next/cache";
import type { JobType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { JOB_TYPE_LABEL, rupiah } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lowongan Kerja" };

const getJobs = unstable_cache(
  async (q: string, city: string, type: string, min: number) => {
    const where: Prisma.JobWhereInput = { status: "ACTIVE" };
    if (q) where.title = { contains: q, mode: "insensitive" };
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (type) where.jobType = type as JobType;
    if (min) where.salaryMax = { gte: min };
    return db.job.findMany({
      where,
      take: 50,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      select: {
        id: true, title: true, slug: true, city: true, jobType: true, salaryMin: true, salaryMax: true,
        company: { select: { name: true, verification: true } },
      },
    });
  },
  ["jobs-list"],
  { revalidate: 60, tags: ["jobs"] },
);

export default async function Jobs({ searchParams }: { searchParams: { q?: string; city?: string; type?: string; min?: string } }) {
  const jobs = await getJobs(searchParams.q ?? "", searchParams.city ?? "", searchParams.type ?? "", Number(searchParams.min) || 0);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Lowongan kerja</h1>
      <form className="mb-6 grid gap-2 md:grid-cols-5">
        <input name="q" defaultValue={searchParams.q} placeholder="Posisi atau kata kunci" className="field" />
        <input name="city" defaultValue={searchParams.city} placeholder="Kota" className="field" />
        <select name="type" defaultValue={searchParams.type ?? ""} className="field">
          <option value="">Semua tipe</option>
          {Object.entries(JOB_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input name="min" type="number" step="500000" defaultValue={searchParams.min} placeholder="Gaji minimal (Rp)" className="field" />
        <button className="btn btn-primary">Cari</button>
      </form>
      <p className="mb-3 text-sm text-ink/60">{jobs.length} lowongan ditemukan</p>
      <ul className="space-y-3">
        {jobs.map((j) => (
          <li key={j.id} className="panel flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link href={`/jobs/${j.slug}`} className="font-bold hover:text-brand-ink">{j.title}</Link>
              <p className="text-sm text-ink/70">{j.company.name} {j.company.verification === "VERIFIED" && <span className="tag ml-1">Terverifikasi</span>}</p>
              <p className="text-sm text-ink/70">{j.city}. {JOB_TYPE_LABEL[j.jobType]}. {rupiah(j.salaryMin)} sampai {rupiah(j.salaryMax)}</p>
            </div>
            <Link href={`/jobs/${j.slug}`} className="btn btn-ghost">Lihat detail</Link>
          </li>
        ))}
        {jobs.length === 0 && <li className="panel text-sm">Tidak ada lowongan yang cocok. Coba kurangi filter.</li>}
      </ul>
    </div>
  );
}
