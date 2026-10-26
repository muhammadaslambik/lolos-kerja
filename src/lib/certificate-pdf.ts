import { PDFDocument, PDFFont, PDFPage, StandardFonts, degrees, rgb } from "pdf-lib";
import { qrMatrix } from "@/lib/qr";

// Font bawaan PDF hanya mengenal huruf Latin. Karakter lain diganti tanda tanya.
const safe = (t: string) => t.replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, "?");

export type CertificateInput = {
  name: string;
  course: string;
  score: number | null;
  passScore: number;
  issuedAt: string;
  code: string;
  verifyUrl: string;
};

const W = 842;
const H = 595;

const CREAM = rgb(0.995, 0.978, 0.925);
const TEAL = rgb(0.06, 0.35, 0.37);
const TEAL_DARK = rgb(0.04, 0.22, 0.25);
const GOLD = rgb(0.8, 0.6, 0.12);
const GOLD_LIGHT = rgb(0.93, 0.8, 0.45);
const INK = rgb(0.1, 0.12, 0.14);
const GREY = rgb(0.38, 0.4, 0.43);

function hsv(h: number, s: number, v: number) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return rgb(f(5), f(3), f(1));
}

// Satu motif kawung: empat bulatan lonjong yang bertemu di tengah
function kawung(page: PDFPage, cx: number, cy: number, s: number, fill: ReturnType<typeof rgb>, edge: ReturnType<typeof rgb>) {
  const a = s / 4;
  const b = s / 6;
  const d = s / 4;
  const spots: [number, number, number][] = [
    [cx + d, cy, 0],
    [cx - d, cy, 0],
    [cx, cy + d, 90],
    [cx, cy - d, 90],
  ];
  for (const [x, y, rot] of spots) {
    page.drawEllipse({ x, y, xScale: a, yScale: b, rotate: degrees(rot), color: fill, opacity: 0.9, borderColor: edge, borderWidth: 0.6, borderOpacity: 0.9 });
  }
  page.drawCircle({ x: cx, y: cy, size: s / 16, color: GOLD, opacity: 0.95 });
}

// Sudut berhias batik kawung. (sx, sy) = arah menjauh dari sudut halaman.
function batikCorner(page: PDFPage, x0: number, y0: number, sx: 1 | -1, sy: 1 | -1) {
  const tile = 22;
  const n = 5;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if (i + j > n - 1) continue;
      const cx = x0 + sx * (i + 0.5) * tile;
      const cy = y0 + sy * (j + 0.5) * tile;
      const alt = (i + j) % 2 === 0;
      kawung(page, cx, cy, tile, alt ? TEAL : GOLD, alt ? GOLD_LIGHT : TEAL_DARK);
    }
}

function hologram(page: PDFPage, hx: number, hy: number, R: number, bold: PDFFont) {
  // Cincin pelangi
  for (let i = 0; i < 90; i++) {
    const ang = (i * 4 * Math.PI) / 180;
    const c = hsv((i * 4 + 20) % 360, 0.55, 1);
    page.drawLine({
      start: { x: hx + Math.cos(ang) * R * 0.7, y: hy + Math.sin(ang) * R * 0.7 },
      end: { x: hx + Math.cos(ang) * R, y: hy + Math.sin(ang) * R },
      thickness: 4.2,
      color: c,
      opacity: 0.85,
    });
  }
  page.drawCircle({ x: hx, y: hy, size: R, borderColor: GOLD, borderWidth: 1.6, opacity: 0 });
  page.drawCircle({ x: hx, y: hy, size: R * 0.7, borderColor: GOLD, borderWidth: 1, opacity: 0 });
  // Cakram dalam
  page.drawCircle({ x: hx, y: hy, size: R * 0.68, color: TEAL_DARK });
  for (let i = 0; i < 36; i++) {
    const ang = (i * 10 * Math.PI) / 180;
    page.drawLine({
      start: { x: hx + Math.cos(ang) * R * 0.2, y: hy + Math.sin(ang) * R * 0.2 },
      end: { x: hx + Math.cos(ang) * R * 0.66, y: hy + Math.sin(ang) * R * 0.66 },
      thickness: 0.5,
      color: i % 2 ? GOLD_LIGHT : hsv((i * 10) % 360, 0.4, 1),
      opacity: 0.45,
    });
  }
  for (let k = 1; k <= 4; k++) {
    page.drawCircle({ x: hx, y: hy, size: R * (0.15 + k * 0.13), borderColor: hsv(k * 70, 0.5, 1), borderWidth: 0.7, borderOpacity: 0.6, opacity: 0 });
  }
  page.drawCircle({ x: hx, y: hy, size: R * 0.3, color: TEAL, borderColor: GOLD_LIGHT, borderWidth: 1 });
  const lk = "LK";
  const lw = bold.widthOfTextAtSize(lk, R * 0.3);
  page.drawText(lk, { x: hx - lw / 2, y: hy - R * 0.1, size: R * 0.3, font: bold, color: rgb(1, 1, 1) });
  const asli = "ASLI";
  const aw = bold.widthOfTextAtSize(asli, R * 0.14) + 3 * 1.5;
  page.drawRectangle({ x: hx - aw / 2 - 4, y: hy - R * 0.47, width: aw + 8, height: R * 0.2, color: TEAL_DARK, opacity: 0.9, borderColor: GOLD_LIGHT, borderWidth: 0.5 });
  let ax = hx - aw / 2;
  for (const ch of asli) {
    page.drawText(ch, { x: ax, y: hy - R * 0.42, size: R * 0.14, font: bold, color: GOLD_LIGHT });
    ax += bold.widthOfTextAtSize(ch, R * 0.14) + 1.5;
  }
  // Kilau
  page.drawEllipse({ x: hx - R * 0.15, y: hy + R * 0.15, xScale: R * 0.75, yScale: R * 0.13, rotate: degrees(35), color: rgb(1, 1, 1), opacity: 0.2 });
  page.drawEllipse({ x: hx + R * 0.2, y: hy - R * 0.2, xScale: R * 0.55, yScale: R * 0.07, rotate: degrees(35), color: rgb(1, 1, 1), opacity: 0.14 });
}

function qr(page: PDFPage, x: number, y: number, size: number, text: string) {
  const m = qrMatrix(text);
  const n = m.length;
  const pad = 6;
  page.drawRectangle({ x: x - pad, y: y - pad, width: size + pad * 2, height: size + pad * 2, color: rgb(1, 1, 1), borderColor: GOLD, borderWidth: 1.2 });
  const u = size / n;
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!m[r][c]) {
        c++;
        continue;
      }
      let e = c;
      while (e < n && m[r][e]) e++;
      page.drawRectangle({ x: x + c * u, y: y + size - (r + 1) * u, width: (e - c) * u + 0.15, height: u + 0.15, color: rgb(0.03, 0.08, 0.1) });
      c = e;
    }
  }
}

export async function buildCertificatePdf(i: CertificateInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Sertifikat Kelulusan ${safe(i.course)}`);
  pdf.setAuthor("Lolos Kerja");
  pdf.setSubject(`Kode verifikasi ${i.code}`);
  const page = pdf.addPage([W, H]);
  const reg = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const ital = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const boldItal = await pdf.embedFont(StandardFonts.TimesRomanBoldItalic);

  // Latar dan bingkai
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: CREAM });
  page.drawCircle({ x: W / 2, y: H / 2 - 10, size: 230, borderColor: GOLD_LIGHT, borderWidth: 0.8, borderOpacity: 0.35, opacity: 0 });
  page.drawCircle({ x: W / 2, y: H / 2 - 10, size: 215, borderColor: TEAL, borderWidth: 0.5, borderOpacity: 0.15, opacity: 0 });
  page.drawRectangle({ x: 18, y: 18, width: W - 36, height: H - 36, borderColor: TEAL, borderWidth: 5 });
  page.drawRectangle({ x: 27, y: 27, width: W - 54, height: H - 54, borderColor: GOLD, borderWidth: 1.4 });
  page.drawRectangle({ x: 31, y: 31, width: W - 62, height: H - 62, borderColor: TEAL, borderWidth: 0.5 });

  // Batik di empat sudut
  batikCorner(page, 31, 31, 1, 1);
  batikCorner(page, W - 31, 31, -1, 1);
  batikCorner(page, 31, H - 31, 1, -1);
  batikCorner(page, W - 31, H - 31, -1, -1);

  const spaced = (text: string, y: number, size: number, font: PDFFont, color: ReturnType<typeof rgb>, spacing: number) => {
    const t = safe(text);
    const chars = Array.from(t);
    const total = chars.reduce((a, ch) => a + font.widthOfTextAtSize(ch, size), 0) + spacing * (chars.length - 1);
    let x = (W - total) / 2;
    for (const ch of chars) {
      page.drawText(ch, { x, y, size, font, color });
      x += font.widthOfTextAtSize(ch, size) + spacing;
    }
  };
  const center = (text: string, y: number, size: number, font: PDFFont, color: ReturnType<typeof rgb>, maxWidth = 560) => {
    const t = safe(text);
    let s = size;
    while (s > 11 && font.widthOfTextAtSize(t, s) > maxWidth) s -= 1;
    const w = font.widthOfTextAtSize(t, s);
    page.drawText(t, { x: (W - w) / 2, y, size: s, font, color });
    return w;
  };
  const diamondRule = (y: number, half: number) => {
    page.drawLine({ start: { x: W / 2 - half, y }, end: { x: W / 2 - 10, y }, thickness: 0.9, color: GOLD });
    page.drawLine({ start: { x: W / 2 + 10, y }, end: { x: W / 2 + half, y }, thickness: 0.9, color: GOLD });
    page.drawSquare({ x: W / 2, y: y - 4.5, size: 6.4, rotate: degrees(45), color: GOLD });
  };

  spaced("LOLOS KERJA", 524, 16, bold, TEAL, 6);
  center("Pelatihan Kerja Online", 508, 11, ital, GREY);
  spaced("SERTIFIKAT KELULUSAN", 462, 34, bold, INK, 3.5);
  diamondRule(446, 150);
  center("Diberikan kepada", 418, 15, ital, GREY);
  const nameW = center(i.name, 372, 42, boldItal, TEAL, 580);
  page.drawLine({ start: { x: W / 2 - nameW / 2 - 24, y: 362 }, end: { x: W / 2 + nameW / 2 + 24, y: 362 }, thickness: 0.9, color: GOLD });
  center("telah dinyatakan lulus pada kelas", 336, 14, ital, GREY);
  center(i.course, 303, 26, bold, INK, 580);

  if (i.score !== null) {
    center("dengan nilai akhir", 272, 13, ital, GREY);
    const cy = 238;
    page.drawCircle({ x: W / 2, y: cy, size: 25, color: TEAL, borderColor: GOLD, borderWidth: 2 });
    page.drawCircle({ x: W / 2, y: cy, size: 21, borderColor: GOLD_LIGHT, borderWidth: 0.6, opacity: 0 });
    const sc = String(i.score);
    const sw = bold.widthOfTextAtSize(sc, 22);
    page.drawText(sc, { x: W / 2 - sw / 2, y: cy - 7.5, size: 22, font: bold, color: rgb(1, 1, 1) });
    const note = `Nilai lulus: ${i.passScore}`;
    page.drawText(note, { x: W / 2 + 36, y: cy - 4, size: 11, font: ital, color: GREY });
  }

  // Bagian bawah: QR, keterangan, hologram
  const qrSize = 78;
  const qrX = 158;
  const qrY = 62;
  qr(page, qrX, qrY, qrSize, i.verifyUrl);
  const cap = "Pindai untuk verifikasi";
  const capW = ital.widthOfTextAtSize(cap, 9);
  page.drawText(cap, { x: qrX + qrSize / 2 - capW / 2, y: qrY - 18, size: 9, font: ital, color: GREY });

  center(`Diterbitkan pada ${i.issuedAt}`, 128, 13, reg, INK, 330);
  center(`Kode verifikasi: ${i.code}`, 108, 13, bold, INK, 330);
  center(`Periksa keaslian di ${i.verifyUrl}`, 90, 9, reg, GREY, 330);
  center("Sertifikat ini diterbitkan secara digital dan sah tanpa tanda tangan basah.", 72, 9, ital, GREY, 330);

  hologram(page, W - 196, 104, 46, bold);

  return pdf.save();
}
