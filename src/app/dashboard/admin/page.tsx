import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dasbor Admin" };

async function setVerification(fd: FormData) {
  "use server";
  await requireRole("ADMIN");
  const id = String(fd.get("id"));
  const status = String(fd.get("status"));
  if (status !== "VERIFIED" && status !== "REJECTED") return;
  await db.company.update({ where: { id }, data: { verification: status } });
  revalidateTag("jobs");
  revalidatePath("/dashboard/admin");
}

export default async function AdminDashboard() {
  await requireRole("ADMIN");
  const [users, jobs, hired, enrolls, done, companies] = await Promise.all([
    db.user.count(),
    db.job.count({ where: { status: "ACTIVE" } }),
    db.application.count({ where: { stage: "HIRED" } }),
    db.enrollment.count(),
    db.enrollment.count({ where: { status: "completed" } }),
    db.company.findMany({ where: { verification: "PENDING" } }),
  ]);
  const stats: [string, string | number][] = [
    ["Pengguna", users], ["Lowongan aktif", jobs], ["Pelamar diterima", hired],
    ["Tingkat kelulusan kelas", enrolls ? `${Math.round((done / enrolls) * 100)}%` : "0%"],
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Ringkasan platform</h1>
      <div className="grid gap-3 md:grid-cols-4">
        {stats.map(([l, v]) => <div key={l} className="panel"><p className="text-2xl font-extrabold">{v}</p><p className="text-sm text-ink/70">{l}</p></div>)}
      </div>
      <section className="panel">
        <h2 className="font-bold">Perusahaan menunggu verifikasi</h2>
        <ul className="mt-3 space-y-2">
          {companies.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{c.name}</span>
              <form action={setVerification} className="flex gap-2">
                <input type="hidden" name="id" value={c.id} />
                <button name="status" value="VERIFIED" className="btn btn-primary !py-1">Setujui</button>
                <button name="status" value="REJECTED" className="btn btn-ghost !py-1">Tolak</button>
              </form>
            </li>
          ))}
          {companies.length === 0 && <li className="text-sm">Tidak ada antrean verifikasi.</li>}
        </ul>
      </section>
    </div>
  );
}
