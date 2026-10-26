import { db } from "@/lib/db";
import { formatDateId, normalizeCode } from "@/lib/certificate";
import { buildCertificatePdf } from "@/lib/certificate-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const code = normalizeCode(params.code);
  const cert = await db.certificate.findUnique({
    where: { code },
    include: {
      enrollment: {
        include: {
          user: { select: { fullName: true } },
          course: { select: { title: true, passScore: true } },
        },
      },
    },
  });
  if (!cert) return new Response("Sertifikat tidak ditemukan.", { status: 404 });

  const origin = new URL(req.url).origin;
  const bytes = await buildCertificatePdf({
    name: cert.enrollment.user.fullName,
    course: cert.enrollment.course.title,
    score: cert.enrollment.finalScore,
    passScore: cert.enrollment.course.passScore,
    issuedAt: formatDateId(cert.issuedAt),
    code: cert.code,
    verifyUrl: `${origin}/verify/${cert.code}`,
  });
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="sertifikat-${cert.code}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
