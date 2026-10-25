// Konstanta dan pembantu untuk profil dan verifikasi perusahaan.

export const ENTITY_TYPES = [
  "PT",
  "PT Perorangan",
  "CV",
  "Firma",
  "Koperasi",
  "Yayasan",
  "UD / Usaha Perorangan",
  "Lainnya",
] as const;

export const EMPLOYEE_RANGES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "Di atas 1000"] as const;

export const DOC_KINDS: { key: string; label: string }[] = [
  { key: "NIB", label: "NIB (Nomor Induk Berusaha)" },
  { key: "NPWP", label: "NPWP perusahaan" },
  { key: "AKTA", label: "Akta pendirian dan SK pengesahan (PT Perorangan: surat pernyataan pendirian)" },
  { key: "IZIN_USAHA", label: "Izin usaha lain atau izin sektoral" },
  { key: "SURAT_KUASA", label: "Surat kuasa atau penunjukan penanggung jawab" },
  { key: "LAINNYA", label: "Dokumen pendukung lain" },
];

export const DOC_LABEL: Record<string, string> = DOC_KINDS.reduce<Record<string, string>>((a, k) => {
  a[k.key] = k.label;
  return a;
}, {});

export const MAX_DOC_MB = 3;
export const MAX_DOC_BYTES = MAX_DOC_MB * 1024 * 1024;
export const MAX_DOCS = 12;

export const digits = (s: string) => s.replace(/\D/g, "");

export function fmtSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// Mengenali jenis berkas dari isinya (bukan dari nama atau tipe yang dikirim browser)
export function sniffMime(b: Uint8Array): "application/pdf" | "image/jpeg" | "image/png" | null {
  if (b.length > 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  return null;
}

type C = { name: string; nib: string | null; npwp: string | null; city: string | null };
type P = {
  legalName?: string | null;
  entityType?: string | null;
  address?: string | null;
  province?: string | null;
  phone?: string | null;
  picName?: string | null;
  picPhone?: string | null;
} | null;

// Daftar kekurangan data sebelum perusahaan boleh mengajukan verifikasi
export function missingFields(c: C, p: P, docKinds: string[]): string[] {
  const m: string[] = [];
  if (!p?.legalName) m.push("Nama resmi badan usaha");
  if (!p?.entityType) m.push("Bentuk usaha");
  if (!c.nib) m.push("Nomor NIB");
  if (!c.npwp) m.push("Nomor NPWP");
  if (!p?.address) m.push("Alamat lengkap");
  if (!c.city) m.push("Kota");
  if (!p?.province) m.push("Provinsi");
  if (!p?.phone) m.push("Telepon perusahaan");
  if (!p?.picName) m.push("Nama penanggung jawab (PIC)");
  if (!p?.picPhone) m.push("Telepon atau WhatsApp PIC");
  if (!docKinds.includes("NIB")) m.push("Dokumen NIB (unggahan)");
  return m;
}
