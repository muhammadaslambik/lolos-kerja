import Link from "next/link";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import AdminStats from "@/components/AdminStats";
import { loadAdminOverview } from "@/lib/admin-details";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dasbor Admin" };

async function setVerification(fd: FormData) {
  "use server";
  await requireRole("ADMIN");
  const id = String(fd.get("id"));
  const status = String(fd.get("status"));
  const note = String(fd.get("note") ?? "").trim().slice(0, 1000) || null;
  if (status !== "VERIFIED" && status !== "REJECTED") return;
  const now = new Date();
  const saveNote = db.companyProfile.upsert({
    where: { companyId: id },
    update: { reviewNote: note, reviewedAt: now },
    create: { companyId: id, reviewNote: note, reviewedAt: now },
  });
  if (status === "VERIFIED") {
    // Perusahaan disetujui: lowongan yang menunggu peninjauan ikut tayang
    await db.$transaction([
      db.company.update({ where: { id }, data: { verification: "VERIFIED" } }),
      db.job.updateMany({ where: { companyId: id, status: "PENDING_REVIEW" }, data: { status: "ACTIVE" } }),
      saveNote,
    ]);
  } else {
    await db.$transaction([db.company.update({ where: { id }, data: { verification: "REJECTED" } }), saveNote]);
  }
  revalidateTag("jobs");
  revalidatePath("/jobs");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/employer/jobs");
  revalidatePath("/dashboard/employer/perusahaan");
}

export default async function AdminDashboard() {
  await requireRole("ADMIN");
  const { cards, details } = await loadAdminOverview();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">Ringkasan platform</h1>
        <Link href="/dashboard/admin/kelas" className="btn btn-primary">Kelola kelas</Link>
      </div>
      <AdminStats cards={cards} details={details} verify={setVerification} />
    </div>
  );
}
