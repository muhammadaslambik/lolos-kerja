import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { EDU_LEVELS } from "@/lib/constants";
import { INVITE_LABEL, shortName } from "@/lib/talent";
import { inviteTalent } from "@/app/actions/talent";

export const dynamic = "force-dynamic";
export const metadata = { title: "Talent Pool" };

export default async function TalentPool({
  searchParams,
}: {
  searchParams: { kota?: string; pendidikan?: string; keahlian?: string; pengalaman?: string; error?: string };
}) {
  const s = await requireRole("EMPLOYER");
  const company = await db.company.findFirst({ where: { members: { some: { userId: s.uid } } } });

  const back = <p className="mb-2 text-sm"><Link href="/dashboard/employer" className="underline">Kembali ke dasbor</Link></p>;

  if (!company || company.verification !== "VERIFIED") {
    return (
      <div className="max-w-3xl">
        {back}
        <h1 className="mb-3 text-2xl font-extrabold">Talent Pool</h1>
        <p className="panel text-sm">Talent Pool hanya dapat dibuka oleh perusahaan yang sudah terverifikasi admin. Status perusahaan Anda dapat dilihat di halaman Lowongan saya.</p>
      </div>
    );
  }

  const kota = (searchParams.kota ?? "").trim().slice(0, 100);
  const pendidikan = EDU_LEVELS.includes(searchParams.pendidikan ?? "") ? (searchParams.pendidikan as string) : "";
  const keahlian = (searchParams.keahlian ?? "").trim().toLowerCase().slice(0, 60);
  const pengalaman = Math.min(50, Math.max(0, parseInt(searchParams.pengalaman ?? "0", 10) || 0));

  const [profiles, invites, jobs] = await Promise.all([
    db.seekerProfile.findMany({
      where: {
        talentVisible: true,
        user: { role: "SEEKER" },
        ...(kota ? { city: { contains: kota, mode: "insensitive" as const } } : {}),
        ...(pendidikan ? { educationLevel: pendidikan } : {}),
        ...(keahlian ? { skills: { has: keahlian } } : {}),
        ...(pengalaman > 0 ? { experienceYears: { gte: pengalaman } } : {}),
      },
      include: { user: { select: { fullName: true } } },
      orderBy: { experienceYears: "desc" },
      take: 30,
    }),
    db.talentInvite.findMany({ where: { companyId: company.id }, select: { seekerId: true, status: true } }),
    db.job.findMany({ where: { companyId: company.id, status: "ACTIVE" }, select: { id: true, title: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const invited = new Map(invites.map((i) => [i.seekerId, i.status]));

  return (
    <div className="max-w-3xl">
      {back}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">Talent Pool</h1>
        <Link href="/dashboard/employer/talent/undangan" className="btn btn-ghost">Undangan saya</Link>
      </div>
      <p className="mb-4 text-sm text-ink/70">
        Daftar pelamar yang mengizinkan profilnya dilihat perusahaan. Nama ditampilkan singkat dan email baru terlihat setelah pelamar menerima undangan Anda.
      </p>

      {searchParams.error && (
        <p role="alert" className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{searchParams.error}</p>
      )}

      <form method="get" className="panel mb-4 grid gap-3 md:grid-cols-4">
        <input name="kota" defaultValue={kota} placeholder="Kota" className="field" />
        <select name="pendidikan" defaultValue={pendidikan} className="field">
          <option value="">Semua pendidikan</option>
          {EDU_LEVELS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <input name="keahlian" defaultValue={keahlian} placeholder="Keahlian (satu kata kunci)" className="field" />
        <input name="pengalaman" type="number" min={0} max={50} defaultValue={pengalaman || ""} placeholder="Pengalaman min. (tahun)" className="field" />
        <button className="btn btn-primary md:col-span-4">Cari kandidat</button>
      </form>

      <p className="mb-3 text-sm text-ink/70">{profiles.length} kandidat ditemukan</p>
      {profiles.length === 0 && <p className="panel text-sm">Belum ada kandidat yang cocok dengan filter ini.</p>}

      <div className="space-y-3">
        {profiles.map((p) => {
          const status = invited.get(p.userId);
          return (
            <section key={p.userId} className="panel text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{shortName(p.user.fullName)}</p>
                {status && <span className="tag">{INVITE_LABEL[status] ?? status}</span>}
              </div>
              {p.headline && <p className="mt-1">{p.headline}</p>}
              <p className="mt-1 text-xs text-ink/70">
                {p.educationLevel ?? "-"}, {p.experienceYears} tahun pengalaman{p.city ? `, ${p.city}` : ""}
              </p>
              <p className="mt-2 flex flex-wrap gap-1">
                {p.skills.slice(0, 8).map((k) => <span key={k} className="tag">{k}</span>)}
              </p>
              {!status && (
                <form action={inviteTalent} className="mt-3 space-y-2">
                  <input type="hidden" name="seekerId" value={p.userId} />
                  <select name="jobId" className="field" defaultValue="">
                    <option value="">Undangan umum (tanpa lowongan tertentu)</option>
                    {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                  <textarea name="message" required minLength={10} maxLength={500} rows={2} className="field" placeholder="Tulis pesan undangan singkat (minimal 10 karakter)" />
                  <button className="btn btn-ghost !py-1 text-xs">Kirim undangan</button>
                </form>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
