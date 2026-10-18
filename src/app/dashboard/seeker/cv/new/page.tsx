import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { buildSummary, emptyCv } from "@/lib/cv-analysis";
import { saveResume } from "@/app/actions/resumes";
import CvForm from "@/components/CvForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Buat CV" };

export default async function NewCv({ searchParams }: { searchParams: { error?: string } }) {
  const s = await requireRole("SEEKER");
  const [user, profile] = await Promise.all([
    db.user.findUnique({ where: { id: s.uid }, select: { fullName: true, email: true } }),
    db.seekerProfile.findUnique({ where: { userId: s.uid } }),
  ]);
  // Data awal diambil dari akun dan profil, bisa diubah bebas
  const cv = emptyCv();
  cv.fullName = user?.fullName ?? "";
  cv.email = user?.email ?? "";
  cv.city = profile?.city ?? "";
  cv.skills = profile?.skills ?? [];
  cv.summary = buildSummary({ educationLevel: profile?.educationLevel, experienceYears: profile?.experienceYears, skills: profile?.skills });
  return (
    <div className="max-w-3xl">
      <p className="mb-2 text-sm"><Link href="/dashboard/seeker/cv" className="underline">Kembali ke daftar CV</Link></p>
      <h1 className="mb-1 text-2xl font-extrabold">Buat CV</h1>
      <p className="mb-4 text-sm text-ink/70">Data awal diambil dari profil Anda. Ringkasan dibuat dari templat, silakan ubah sesuai kebutuhan.</p>
      <CvForm action={saveResume} cv={cv} title="CV saya" error={searchParams.error} submitLabel="Simpan CV" />
    </div>
  );
}
