import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { JOB_TYPE_LABEL, VERIFICATION_LABEL } from "@/lib/constants";
import { DOC_LABEL, fmtSize } from "@/lib/company-profile";
import { companyFields, type Tier } from "@/lib/company-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profil Perusahaan" };

export default async function PublicCompanyPage({ params }: { params: { slug: string } }) {
  const company = await db.company.findUnique({ where: { slug: params.slug } });
  if (!company) notFound();

  const s = await getSession();
  const isAdmin = s?.role === "ADMIN";
  const isMember = s
    ? !!(await db.companyMember.findFirst({ where: { companyId: company.id, userId: s.uid }, select: { userId: true } }))
    : false;
  // Perusahaan yang belum terverifikasi tidak ditampilkan ke publik
  if (company.verification !== "VERIFIED" && !isAdmin && !isMember) notFound();
  const tier: Tier = isAdmin ? "admin" : isMember ? "owner" : "public";

  const [profile, jobs, docs] = await Promise.all([
    db.companyProfile.findUnique({ where: { companyId: company.id } }),
    db.job.findMany({
      where: { companyId: company.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, title: true, city: true, jobType: true },
    }),
    tier === "public"
      ? Promise.resolve([])
      : db.companyDocument.findMany({
          where: { companyId: company.id },
          select: { id: true, kind: true, fileName: true, size: true },
          orderBy: { createdAt: "asc" },
        }),
  ]);

  const fields = companyFields(company, profile, tier);
  const publicFields = fields.filter((f) => f.min === "public");
  const internalFields = fields.filter((f) => f.min !== "public");

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">{company.name}</h1>
        <p className="mt-1">
          <span className="tag">{VERIFICATION_LABEL[company.verification]}</span>
        </p>
      </div>

      <section className="panel space-y-3 text-sm">
        <h2 className="font-bold">Tentang perusahaan</h2>
        {company.description ? (
          <p className="whitespace-pre-line leading-relaxed">{company.description}</p>
        ) : (
          <p className="text-ink/60">Perusahaan belum menulis deskripsi.</p>
        )}
        {publicFields.length > 0 && (
          <dl className="space-y-1">
            {publicFields.map((f) => (
              <div key={f.label} className="grid grid-cols-3 gap-2">
                <dt className="text-ink/60">{f.label}</dt>
                <dd className="col-span-2 break-words">
                  {f.label === "Situs web" && f.value !== "-" ? (
                    <a href={f.value} target="_blank" rel="noopener noreferrer nofollow" className="underline">{f.value}</a>
                  ) : (
                    f.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="panel space-y-2 text-sm">
        <h2 className="font-bold">Lowongan aktif ({jobs.length})</h2>
        {jobs.length === 0 ? (
          <p className="text-ink/60">Belum ada lowongan yang tayang.</p>
        ) : (
          <ul className="space-y-1">
            {jobs.map((j) => (
              <li key={j.id}>
                <span className="font-semibold">{j.title}</span>{" "}
                <span className="text-xs text-ink/70">{JOB_TYPE_LABEL[j.jobType]}{j.city ? `, ${j.city}` : ""}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-ink/60">
          <Link href="/jobs" className="underline">Lihat semua lowongan</Link>
        </p>
      </section>

      {tier !== "public" && (
        <section className="panel space-y-3 text-sm">
          <h2 className="font-bold">
            {tier === "admin" ? "Data lengkap (hanya admin dan pemilik perusahaan)" : "Data internal (hanya terlihat oleh perusahaan Anda dan admin)"}
          </h2>
          <p className="text-xs text-ink/60">Pelamar dan pengunjung umum tidak dapat melihat bagian ini.</p>
          <dl className="space-y-1">
            {internalFields.map((f) => (
              <div key={f.label} className="grid grid-cols-3 gap-2">
                <dt className="text-ink/60">{f.label}</dt>
                <dd className="col-span-2 whitespace-pre-line break-words">{f.value}</dd>
              </div>
            ))}
          </dl>
          {docs.length > 0 && (
            <div>
              <h3 className="font-semibold">Dokumen</h3>
              <ul className="mt-1 space-y-1">
                {docs.map((d) => (
                  <li key={d.id}>
                    <span className="tag">{DOC_LABEL[d.kind]?.split(" (")[0] ?? d.kind}</span>{" "}
                    <a href={`/api/company-docs/${d.id}`} target="_blank" rel="noopener noreferrer" className="underline">{d.fileName}</a>{" "}
                    <span className="text-xs text-ink/60">({fmtSize(d.size)})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {isMember && (
            <p>
              <Link href={`/dashboard/employer/perusahaan?c=${company.id}`} className="underline">Ubah data perusahaan</Link>
            </p>
          )}
        </section>
      )}
    </div>
  );
}
