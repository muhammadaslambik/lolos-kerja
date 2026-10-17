import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { STAGES, STAGE_LABEL, StageKey, VERIFICATION_LABEL } from "@/lib/constants";
import { matchLabel } from "@/lib/screening";

export const dynamic = "force-dynamic";
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

export default async function EmployerDashboard() {
  const s = await requireRole("EMPLOYER");
  const companies = await db.company.findMany({ where: { members: { some: { userId: s.uid } } } });
  const apps = await db.application.findMany({
    where: { job: { companyId: { in: companies.map((c) => c.id) } } },
    include: { job: true, seeker: { include: { profile: true } } },
    orderBy: { matchScore: "desc" },
  });
  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold">Pelamar masuk</h1>
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
                    <p className="font-semibold">{a.seeker.fullName}</p>
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
    </div>
  );
}
