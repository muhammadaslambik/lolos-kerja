import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getDemoUser } from "@/lib/demo-user";
import { STAGES, STAGE_LABEL, StageKey } from "@/lib/constants";
import { matchLabel } from "@/lib/screening";
export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard Perusahaan" };

async function moveStage(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const to = String(formData.get("stage")) as StageKey;
  if (!STAGES.includes(to)) return;
  const app = await db.application.findUnique({ where: { id } });
  if (!app || app.stage === to) return;
  await db.application.update({ where: { id }, data: { stage: to, events: { create: { fromStage: app.stage, toStage: to } } } });
  revalidatePath("/dashboard/employer");
}

export default async function EmployerDashboard() {
  const user = await getDemoUser("EMPLOYER");
  const companyIds = user.memberships.map((m) => m.companyId);
  const apps = await db.application.findMany({
    where: { job: { companyId: { in: companyIds } } },
    include: { job: true, seeker: { include: { profile: true } } },
    orderBy: { matchScore: "desc" },
  });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Pelamar masuk</h1>
      <div className="grid gap-3 overflow-x-auto md:grid-cols-3 lg:grid-cols-6">
        {STAGES.map((stage) => {
          const col = apps.filter((a) => a.stage === stage);
          return (
            <section key={stage} className="min-w-[10rem] rounded-lg bg-brand-soft/60 p-2">
              <h2 className="mb-2 px-1 text-sm font-bold">{STAGE_LABEL[stage]} ({col.length})</h2>
              <div className="space-y-2">
                {col.map((a) => (
                  <form key={a.id} action={moveStage} className="rounded-md border border-line bg-white p-3 text-sm">
                    <input type="hidden" name="id" value={a.id} />
                    <p className="font-semibold">{a.seeker.fullName}</p>
                    <p className="text-xs text-ink/70">{a.job.title}</p>
                    <p className="text-xs text-ink/70">{a.seeker.profile?.educationLevel}, {a.seeker.profile?.experienceYears} thn</p>
                    <p className="mt-1 text-xs font-semibold text-brand">{a.matchScore}% {matchLabel(a.matchScore ?? 0)}</p>
                    <select name="stage" defaultValue={a.stage} className="mt-2 w-full rounded border border-line px-1 py-1 text-xs">
                      {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                    </select>
                    <button className="btn btn-ghost mt-2 w-full !py-1 text-xs">Pindahkan</button>
                  </form>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {apps.length === 0 && <p className="panel mt-4 text-sm">Belum ada pelamar. Pelamar akan muncul di sini setelah melamar lowongan Anda.</p>}
    </div>
  );
}
