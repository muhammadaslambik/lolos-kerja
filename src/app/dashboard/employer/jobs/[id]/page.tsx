import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { updateJob } from "@/app/actions/jobs";
import JobForm from "@/components/JobForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ubah Lowongan" };

export default async function EditJobPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const s = await requireRole("EMPLOYER");
  const job = await db.job.findFirst({
    where: { id: params.id, company: { members: { some: { userId: s.uid } } } },
  });
  if (!job) notFound();
  return (
    <div className="max-w-3xl">
      <p className="mb-2 text-sm"><Link href="/dashboard/employer/jobs" className="underline">Kembali ke lowongan saya</Link></p>
      <h1 className="mb-4 text-2xl font-extrabold">Ubah lowongan</h1>
      <JobForm action={updateJob} job={job} error={searchParams.error} submitLabel="Simpan perubahan" />
    </div>
  );
}
