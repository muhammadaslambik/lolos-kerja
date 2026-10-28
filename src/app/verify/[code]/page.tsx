import Link from "next/link";
import { db } from "@/lib/db";
import { formatDateId, normalizeCode } from "@/lib/certificate";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verifikasi Sertifikat", robots: { index: false, follow: false } };

export default async function VerifyPage({ params }: { params: { code: string } }) {
  const code = normalizeCode(params.code);
  const cert = await db.certificate.findUnique({
    where: { code },
    include: { enrollment: { include: { user: { select: { fullName: true } }, course: { select: { title: true } } } } },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-3 text-2xl font-extrabold">Verifikasi sertifikat</h1>
      {cert ? (
        <div className="panel space-y-2 text-sm">
          <p role="status" className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 font-semibold text-ink">
            Sertifikat valid dan tercatat di Lolos Kerja.
          </p>
          <p><span className="text-ink/70">Nama penerima:</span> <span className="font-semibold">{cert.enrollment.user.fullName}</span></p>
          <p><span className="text-ink/70">Kelas:</span> <span className="font-semibold">{cert.enrollment.course.title}</span></p>
          {cert.enrollment.finalScore !== null && (
            <p><span className="text-ink/70">Nilai akhir:</span> {cert.enrollment.finalScore}</p>
          )}
          <p><span className="text-ink/70">Tanggal terbit:</span> {formatDateId(cert.issuedAt)}</p>
          <p><span className="text-ink/70">Kode:</span> {cert.code}</p>
          <a href={`/api/certificates/${cert.code}/pdf`} className="btn btn-primary mt-2 inline-block">Unduh sertifikat PDF</a>
        </div>
      ) : (
        <div className="panel text-sm">
          <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-red-600">
            Sertifikat dengan kode ini tidak ditemukan. Periksa kembali penulisan kodenya.
          </p>
          <p className="mt-3"><Link href="/courses" className="underline">Lihat kelas pelatihan</Link></p>
        </div>
      )}
    </div>
  );
}
