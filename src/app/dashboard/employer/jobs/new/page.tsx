import Link from "next/link";
import { requireRole } from "@/lib/session";
import { createJob } from "@/app/actions/jobs";
import JobForm from "@/components/JobForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pasang Lowongan" };

export default async function NewJobPage({ searchParams }: { searchParams: { error?: string } }) {
  await requireRole("EMPLOYER");
  return (
    <div className="max-w-3xl">
      <p className="mb-2 text-sm"><Link href="/dashboard/employer/jobs" className="underline">Kembali ke lowongan saya</Link></p>
      <h1 className="mb-1 text-2xl font-extrabold">Pasang lowongan</h1>
      <p className="mb-4 text-sm text-ink/70">
        Lowongan dari perusahaan yang sudah terverifikasi langsung tayang. Jika belum terverifikasi, lowongan menunggu peninjauan.
      </p>
      <JobForm action={createJob} error={searchParams.error} submitLabel="Simpan lowongan" />
    </div>
  );
}
