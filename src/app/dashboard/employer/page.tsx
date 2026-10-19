import Link from "next/link";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { STAGES, STAGE_LABEL, StageKey, VERIFICATION_LABEL } from "@/lib/constants";
import { matchLabel } from "@/lib/screening";
import { parseCv } from "@/lib/cv-analysis";
import { formatDateId } from "@/lib/certificate";
import EscClose from "@/components/EscClose";

export const dynamic = "force-dynamic";

// Tahap yang membuka fitur komunikasi dengan pelamar
const COMM_STAGES: StageKey[] = ["INTERVIEW", "OFFERING", "HIRED", "REJECTED"];
const BOARD = "/dashboard/employer";
export const metadata = { title: "Dasbor Perusahaan" };

async function moveStage(fd: FormData) {
  "use server";
  const s = await requireRole("EMPLOYER");
  const id = String(fd.get("id"));
  const to = String(fd.get("stage")) as StageKey;
  if (!STAGES.includes(to)) return;
  // Hanya lamaran pada lowongan milik perusahaan pengguna ini
  const app = await db.application.findFirst({ where: { id, job: { company: { members: { some: { userId: s.uid } } } } } });
  if (!app || app.stage === to) return;
  await db.application.update({ where: { id }, data: { stage: to, events: { create: { fromStage: app.stage, toStage: to } } } });
  revalidatePath("/dashboard/employer");
}

export default async function EmployerDashboard({ searchParams }: { searchParams: { pelamar?: string } }) {
  const s = await requireRole("EMPLOYER");
  const companies = await db.company.findMany({ where: { members: { some: { userId: s.uid } } } });
  const apps = await db.application.findMany({
    where: { job: { companyId: { in: companies.map((c) => c.id) } } },
    include: { job: true, seeker: { include: { profile: true } } },
    orderBy: { matchScore: "desc" },
  });
  // Pelamar yang dibuka di jendela CV (hanya milik perusahaan pengguna ini)
  const selected = searchParams.pelamar
    ? await db.application.findFirst({
        where: { id: searchParams.pelamar, job: { company: { members: { some: { userId: s.uid } } } } },
        include: { job: { select: { title: true } }, seeker: { include: { profile: true } }, resume: true },
      })
    : null;
  const cvRow = selected
    ? selected.resume ??
      (await db.resume.findFirst({ where: { userId: selected.seekerId }, orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }] }))
    : null;
  const cv = cvRow ? parseCv(cvRow.content) : null;
  const hasCv = !!cv && !!(cv.summary || cv.experiences.length || cv.education.length || cv.skills.length);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold">Pelamar masuk</h1>
      <div className="mb-3 flex flex-wrap gap-2">
        <Link href="/dashboard/employer/jobs/new" className="btn btn-primary">Pasang lowongan</Link>
        <Link href="/dashboard/employer/jobs" className="btn btn-ghost">Lowongan saya</Link>
        <Link href="/dashboard/employer/talent" className="btn btn-ghost">Talent Pool</Link>
      </div>
      {companies.map((c) => (
        <p key={c.id} className="mb-3 text-sm text-ink/70">
          {c.name}: <span className="tag">{VERIFICATION_LABEL[c.verification]}</span>
          {c.verification !== "VERIFIED" && " Lowongan baru tampil setelah perusahaan diverifikasi admin."}
        </p>
      ))}
      <div className="grid gap-3 overflow-x-auto md:grid-cols-3 lg:grid-cols-6">
        {STAGES.map((stage) => {
          const col = apps.filter((a) => a.stage === stage);
          return (
            <section key={stage} className="min-w-[10rem] rounded-lg bg-brand-soft/60 p-2">
              <h2 className="mb-2 px-1 text-sm font-bold">{STAGE_LABEL[stage]} ({col.length})</h2>
              <div className="space-y-2">
                {col.map((a) => (
                  <form key={a.id} action={moveStage} className="rounded-md border border-line bg-surface p-3 text-sm">
                    <input type="hidden" name="id" value={a.id} />
                    <Link href={`${BOARD}?pelamar=${a.id}`} scroll={false} className="font-semibold underline">{a.seeker.fullName}</Link>
                    <p className="text-xs text-ink/70">{a.job.title}</p>
                    <p className="text-xs text-ink/70">{a.seeker.profile?.educationLevel ?? "-"}, {a.seeker.profile?.experienceYears ?? 0} thn</p>
                    <p className="mt-1 text-xs font-semibold text-brand-ink">{a.matchScore}% {matchLabel(a.matchScore ?? 0)}</p>
                    <select name="stage" defaultValue={a.stage} className="field mt-2 !px-1 !py-1 text-xs">
                      {STAGES.map((x) => <option key={x} value={x}>{STAGE_LABEL[x]}</option>)}
                    </select>
                    <button className="btn btn-ghost mt-2 w-full !py-1 text-xs">Pindahkan</button>
                  </form>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {apps.length === 0 && <p className="panel mt-4 text-sm">Belum ada pelamar. Pelamar akan muncul di sini setelah melamar lowongan perusahaan Anda.</p>}

      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`CV ${selected.seeker.fullName}`}>
          <EscClose href={BOARD} />
          <Link href={BOARD} scroll={false} aria-label="Tutup jendela CV" className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-line bg-surface p-5 shadow-xl">
            <Link
              href={BOARD}
              scroll={false}
              aria-label="Tutup"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md border border-line text-lg leading-none hover:bg-brand-soft"
            >
              &times;
            </Link>

            <h2 className="pr-10 text-xl font-extrabold">{selected.seeker.fullName}</h2>
            <p className="mt-1 text-sm text-ink/70">
              Melamar sebagai {selected.job.title}, {formatDateId(selected.createdAt)}.{" "}
              <span className="font-semibold text-brand-ink">{selected.matchScore ?? 0}% {matchLabel(selected.matchScore ?? 0)}</span>
            </p>

            <form action={moveStage} className="mt-4 flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={selected.id} />
              <label htmlFor="stage-modal" className="text-sm font-semibold">Status</label>
              <select id="stage-modal" name="stage" defaultValue={selected.stage} className="field !w-auto">
                {STAGES.map((x) => <option key={x} value={x}>{STAGE_LABEL[x]}</option>)}
              </select>
              <button className="btn btn-primary !py-1 text-sm">Pindahkan status</button>
            </form>

            {COMM_STAGES.includes(selected.stage as StageKey) && (
              <section className="mt-4 rounded-md border border-line p-3">
                <h3 className="text-sm font-bold">Komunikasi dengan pelamar</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" disabled className="btn btn-ghost !py-1 text-sm">Pesan</button>
                  <button type="button" disabled className="btn btn-ghost !py-1 text-sm">Telepon</button>
                  <button type="button" disabled className="btn btn-ghost !py-1 text-sm">Video call</button>
                </div>
                <p className="mt-2 text-xs text-ink/60">Fitur ini sedang disiapkan.</p>
              </section>
            )}

            <section className="mt-5">
              <h3 className="text-sm font-bold uppercase tracking-wide">Curriculum vitae</h3>
              {hasCv && cv ? (
                <div className="mt-2 space-y-4 text-sm">
                  <p className="text-xs text-ink/70">{[cv.email, cv.phone, cv.city].filter(Boolean).join(" | ")}</p>
                  {cv.summary && (
                    <div>
                      <h4 className="font-semibold">Ringkasan</h4>
                      <p className="mt-1 whitespace-pre-line">{cv.summary}</p>
                    </div>
                  )}
                  {cv.experiences.length > 0 && (
                    <div>
                      <h4 className="font-semibold">Pengalaman</h4>
                      <ul className="mt-1 space-y-3">
                        {cv.experiences.map((e, i) => (
                          <li key={i}>
                            <p className="font-medium">{[e.role, e.company].filter(Boolean).join(", ")}</p>
                            {e.period && <p className="text-xs text-ink/70">{e.period}</p>}
                            {e.bullets.length > 0 && (
                              <ul className="mt-1 list-disc pl-5">
                                {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {cv.education.length > 0 && (
                    <div>
                      <h4 className="font-semibold">Pendidikan</h4>
                      <ul className="mt-1 space-y-1">
                        {cv.education.map((e, i) => (
                          <li key={i}>
                            <span className="font-medium">{[e.degree, e.school].filter(Boolean).join(", ")}</span>
                            {e.period && <span className="text-xs text-ink/70"> ({e.period})</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {cv.skills.length > 0 && (
                    <div>
                      <h4 className="font-semibold">Keahlian</h4>
                      <p className="mt-1 flex flex-wrap gap-1">{cv.skills.map((k) => <span key={k} className="tag">{k}</span>)}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 space-y-2 text-sm">
                  <p className="text-xs text-ink/70">Pelamar belum menyusun CV di Asisten CV. Berikut data dari profilnya.</p>
                  {selected.seeker.profile?.headline && <p className="font-medium">{selected.seeker.profile.headline}</p>}
                  <p>
                    {selected.seeker.profile?.educationLevel ?? "-"}, {selected.seeker.profile?.experienceYears ?? 0} tahun pengalaman
                    {selected.seeker.profile?.city ? `, ${selected.seeker.profile.city}` : ""}
                  </p>
                  {selected.seeker.profile && selected.seeker.profile.skills.length > 0 && (
                    <p className="flex flex-wrap gap-1">{selected.seeker.profile.skills.map((k) => <span key={k} className="tag">{k}</span>)}</p>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
