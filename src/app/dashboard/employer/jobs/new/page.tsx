import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { VERIFICATION_LABEL } from "@/lib/constants";
import { createJobForCompany } from "@/app/actions/jobs";
import JobForm from "@/components/JobForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pasang Lowongan" };

const NEW = "/dashboard/employer/jobs/new";

export default async function NewJobPage({ searchParams }: { searchParams: { error?: string; c?: string } }) {
  const s = await requireRole("EMPLOYER");
  const companies = await db.company.findMany({
    where: { members: { some: { userId: s.uid } } },
    orderBy: { createdAt: "asc" },
  });
  const company = companies.find((x) => x.id === searchParams.c) ?? companies[0];
  if (!company) return <p className="panel text-sm">Akun Anda belum terhubung ke perusahaan.</p>;

  return (
    <div className="max-w-3xl">
      <p className="mb-2 text-sm"><Link href="/dashboard/employer/jobs" className="underline">Kembali ke lowongan saya</Link></p>
      <h1 className="mb-1 text-2xl font-extrabold">Pasang lowongan</h1>
      <p className="mb-4 text-sm text-ink/70">
        Lowongan dari perusahaan yang sudah terverifikasi langsung tayang. Jika belum terverifikasi, lowongan menunggu peninjauan.
      </p>

      <section className="panel mb-4 space-y-2 text-sm">
        <p className="font-semibold">Lowongan ini dipasang untuk usaha:</p>
        {companies.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {companies.map((c) => (
              <Link
                key={c.id}
                href={`${NEW}?c=${c.id}`}
                className={`rounded-md border px-3 py-2 font-semibold ${c.id === company.id ? "border-brand bg-brand-soft text-brand-ink" : "border-line"}`}
              >
                {c.name} <span className="tag">{VERIFICATION_LABEL[c.verification]}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p>
            {company.name} <span className="tag">{VERIFICATION_LABEL[company.verification]}</span>
          </p>
        )}
        {companies.length > 1 && (
          <p className="text-xs text-ink/60">Pilih usaha dulu sebelum mengisi formulir, karena pindah usaha akan mengosongkan isian.</p>
        )}
        {company.verification !== "VERIFIED" && (
          <p className="text-xs text-ink/70">
            Usaha ini belum terverifikasi. Lengkapi data di{" "}
            <Link href={`/dashboard/employer/perusahaan?c=${company.id}`} className="underline">Profil perusahaan</Link>{" "}
            agar lowongan bisa tayang.
          </p>
        )}
      </section>

      <JobForm
        key={company.id}
        action={createJobForCompany.bind(null, company.id)}
        error={searchParams.error}
        submitLabel="Simpan lowongan"
      />
    </div>
  );
}
