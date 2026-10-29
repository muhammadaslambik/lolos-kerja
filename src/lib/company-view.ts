// Aturan data perusahaan: apa yang boleh dilihat publik, pemilik perusahaan, dan admin.
//
// publik   : identitas dagang yang memang dimaksudkan untuk dilihat calon pelamar
// pemilik  : anggota perusahaan itu sendiri (data legalitas, kontak, PIC, rencana rekrutmen)
// admin    : semuanya
export type Tier = "public" | "owner" | "admin";
const RANK: Record<Tier, number> = { public: 0, owner: 1, admin: 2 };

type C = {
  industry: string | null;
  city: string | null;
  website: string | null;
  nib: string | null;
  npwp: string | null;
};
type P = {
  legalName?: string | null;
  entityType?: string | null;
  foundedYear?: number | null;
  employeeRange?: string | null;
  deedNumber?: string | null;
  skNumber?: string | null;
  otherLicense?: string | null;
  address?: string | null;
  province?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  picName?: string | null;
  picTitle?: string | null;
  picPhone?: string | null;
  picEmail?: string | null;
  hiringNeeds?: string | null;
  annualHiring?: string | null;
} | null;

export type CompanyField = { label: string; value: string; min: Tier };

export function companyFields(c: C, p: P, tier: Tier): CompanyField[] {
  const rows: [string, string | number | null | undefined, Tier][] = [
    ["Bentuk usaha", p?.entityType, "public"],
    ["Bidang usaha", c.industry, "public"],
    ["Kota", c.city, "public"],
    ["Provinsi", p?.province, "public"],
    ["Tahun berdiri", p?.foundedYear, "public"],
    ["Jumlah karyawan", p?.employeeRange, "public"],
    ["Situs web", c.website, "public"],

    ["Nama resmi badan usaha", p?.legalName, "owner"],
    ["NIB", c.nib, "owner"],
    ["NPWP", c.npwp, "owner"],
    ["Nomor akta pendirian", p?.deedNumber, "owner"],
    ["Nomor SK pengesahan", p?.skNumber, "owner"],
    ["Izin usaha lain", p?.otherLicense, "owner"],
    ["Alamat lengkap", p?.address, "owner"],
    ["Kode pos", p?.postalCode, "owner"],
    ["Telepon perusahaan", p?.phone, "owner"],
    ["Email perusahaan", p?.contactEmail, "owner"],
    ["Nama PIC", p?.picName, "owner"],
    ["Jabatan PIC", p?.picTitle, "owner"],
    ["Telepon atau WhatsApp PIC", p?.picPhone, "owner"],
    ["Email PIC", p?.picEmail, "owner"],
    ["Posisi dan keterampilan yang dibutuhkan", p?.hiringNeeds, "owner"],
    ["Perkiraan kebutuhan karyawan per tahun", p?.annualHiring, "owner"],
  ];
  const out: CompanyField[] = [];
  for (const [label, v, min] of rows) {
    if (RANK[tier] < RANK[min]) continue;
    const value = v === null || v === undefined || v === "" ? "" : String(v);
    // Admin melihat semua kolom (kosong ditulis "-"); lainnya hanya yang terisi
    if (!value && tier !== "admin") continue;
    out.push({ label, value: value || "-", min });
  }
  return out;
}
