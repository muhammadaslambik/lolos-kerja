import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { parseCv } from "@/lib/cv-analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Font bawaan PDF hanya mengenal huruf Latin. Karakter lain diganti tanda tanya.
const safe = (t: string) => t.replace(/[^\u0020-\u007E\u00A0-\u00FF\n]/g, "?");

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== "SEEKER") return new Response("Silakan masuk sebagai pelamar.", { status: 401 });
  const resume = await db.resume.findFirst({ where: { id: params.id, userId: s.uid } });
  if (!resume) return new Response("CV tidak ditemukan.", { status: 404 });
  const cv = parseCv(resume.content);

  const W = 595;
  const H = 842;
  const M = 50;
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.1, 0.12, 0.14);
  const grey = rgb(0.35, 0.38, 0.42);
  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;

  const ensure = (need: number) => {
    if (y - need < M) {
      page = pdf.addPage([W, H]);
      y = H - M;
    }
  };

  const wrap = (text: string, font: PDFFont, size: number, maxW: number): string[] => {
    const out: string[] = [];
    for (const para of safe(text).split("\n")) {
      let cur = "";
      for (const word of para.split(/\s+/).filter(Boolean)) {
        let w = word;
        while (font.widthOfTextAtSize(w, size) > maxW) {
          let cut = w.length - 1;
          while (cut > 1 && font.widthOfTextAtSize(w.slice(0, cut), size) > maxW) cut--;
          if (cur) {
            out.push(cur);
            cur = "";
          }
          out.push(w.slice(0, cut));
          w = w.slice(cut);
        }
        const trial = cur ? `${cur} ${w}` : w;
        if (font.widthOfTextAtSize(trial, size) <= maxW) cur = trial;
        else {
          out.push(cur);
          cur = w;
        }
      }
      if (cur) out.push(cur);
    }
    return out;
  };

  const text = (t: string, font: PDFFont, size: number, color = ink, indent = 0) => {
    const lh = size * 1.4;
    for (const ln of wrap(t, font, size, W - 2 * M - indent)) {
      ensure(lh);
      y -= lh;
      page.drawText(ln, { x: M + indent, y, size, font, color });
    }
  };

  const bullet = (t: string) => {
    const size = 10;
    const lh = size * 1.4;
    wrap(t, regular, size, W - 2 * M - 14).forEach((ln, i) => {
      ensure(lh);
      y -= lh;
      if (i === 0) page.drawText("-", { x: M + 3, y, size, font: regular, color: ink });
      page.drawText(ln, { x: M + 14, y, size, font: regular, color: ink });
    });
  };

  const heading = (t: string) => {
    ensure(34);
    y -= 20;
    page.drawText(safe(t).toUpperCase(), { x: M, y, size: 11, font: bold, color: ink });
    y -= 5;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.7, color: grey });
  };

  text(cv.fullName, bold, 20);
  const contact = [cv.email, cv.phone, cv.city].filter(Boolean).join(" | ");
  if (contact) text(contact, regular, 10, grey);

  if (cv.summary) {
    heading("Ringkasan");
    text(cv.summary, regular, 10);
  }
  const exps = cv.experiences.filter((e) => e.role || e.company || e.bullets.length);
  if (exps.length) {
    heading("Pengalaman");
    exps.forEach((e, i) => {
      if (i > 0) y -= 6;
      text([e.role, e.company].filter(Boolean).join(", "), bold, 10.5);
      if (e.period) text(e.period, regular, 9.5, grey);
      e.bullets.forEach(bullet);
    });
  }
  const edus = cv.education.filter((e) => e.school || e.degree);
  if (edus.length) {
    heading("Pendidikan");
    edus.forEach((e, i) => {
      if (i > 0) y -= 6;
      text([e.degree, e.school].filter(Boolean).join(", "), bold, 10.5);
      if (e.period) text(e.period, regular, 9.5, grey);
    });
  }
  if (cv.skills.length) {
    heading("Keahlian");
    text(cv.skills.join(", "), regular, 10);
  }

  const bytes = await pdf.save();
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="cv.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}
