import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db } from "@/lib/db";
import { formatDateId, normalizeCode } from "@/lib/certificate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Font bawaan PDF hanya mengenal huruf Latin. Karakter lain diganti tanda tanya.
const safe = (t: string) => t.replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, "?");

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const code = normalizeCode(params.code);
  const cert = await db.certificate.findUnique({
    where: { code },
    include: { enrollment: { include: { user: { select: { fullName: true } }, course: { select: { title: true } } } } },
  });
  if (!cert) return new Response("Sertifikat tidak ditemukan.", { status: 404 });

  const W = 842;
  const H = 595;
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([W, H]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const teal = rgb(0.06, 0.35, 0.37);
  const gold = rgb(0.85, 0.65, 0.13);
  const ink = rgb(0.1, 0.12, 0.14);
  const grey = rgb(0.4, 0.43, 0.46);

  page.drawRectangle({ x: 24, y: 24, width: W - 48, height: H - 48, borderColor: teal, borderWidth: 4 });
  page.drawRectangle({ x: 34, y: 34, width: W - 68, height: H - 68, borderColor: gold, borderWidth: 1 });

  const center = (text: string, y: number, size: number, font = regular, color = ink, maxWidth = 700) => {
    const t = safe(text);
    let s = size;
    while (s > 12 && font.widthOfTextAtSize(t, s) > maxWidth) s -= 1;
    page.drawText(t, { x: (W - font.widthOfTextAtSize(t, s)) / 2, y, size: s, font, color });
  };

  const origin = new URL(req.url).origin;
  center("LOLOS KERJA", 500, 16, bold, teal);
  center("SERTIFIKAT KELULUSAN", 450, 34, bold, ink);
  center("Diberikan kepada", 400, 14, regular, grey);
  center(cert.enrollment.user.fullName, 350, 36, bold, teal);
  center("telah dinyatakan lulus pada kelas", 305, 14, regular, grey);
  center(cert.enrollment.course.title, 265, 26, bold, ink);
  center(`Tanggal terbit: ${formatDateId(cert.issuedAt)}`, 200, 13, regular, ink);
  center(`Kode verifikasi: ${cert.code}`, 150, 13, bold, ink);
  center(`Periksa keaslian di ${origin}/verify/${cert.code}`, 125, 11, regular, grey);

  const bytes = await pdf.save();
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="sertifikat-${cert.code}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
