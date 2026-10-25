import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { VERIFICATION_LABEL } from "@/lib/constants";
import { formatDateId } from "@/lib/certificate";
import CompanyDocUpload from "@/components/CompanyDocUpload";
import {
  DOC_KINDS,
  DOC_LABEL,
  EMPLOYEE_RANGES,
  ENTITY_TYPES,
  MAX_DOC_MB,
  digits,
  fmtSize,
  missingFields,
} from "@/lib/company-profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profil Perusahaan" };

const PATH = "/dashboard/employer/perusahaan";

const OK_MSG: Record<string, string> = {
  saved: "Data tersimpan.",
  submitted: "Permohonan verifikasi terkirim. Admin akan meninjau data Anda.",
};
const ERR_MSG: Record<string, string> = {
  nib: "NIB harus 13 digit angka.",
  npwp: "NPWP harus 15 atau 16 digit angka.",
  tahun: "Tahun berdiri tidak valid.",
  web: "Alamat situs web tidak valid.",
  email: "Format email tidak valid.",
  lengkapi: "Data belum lengkap. Lengkapi dulu bagian yang tercantum di daftar kekurangan.",
  ditangguhkan: "Perusahaan Anda sedang ditangguhkan. Hubungi admin.",
  perusahaan: "Akun ini belum memiliki perusahaan.",
};

// Menyimpan isi formulir. Data legalitas dikunci setelah perusahaan terverifikasi.
async function persist(fd: FormData, uid: string): Promise<{ companyId: string } | { error: string }> {
  const company = await db.company.findFirst({ where: { members: { some: { userId: uid } } }, orderBy: { createdAt: "asc" } });
  if (!company) return { error: "perusahaan" };
  const locked = company.verification === "VERIFIED";
  const g = (k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
  const nz = (v: string) => (v === "" ? null : v);

  const nib = digits(g("nib", 40));
  if (!locked && nib && nib.length !== 13) return { error: "nib" };
  const npwp = digits(g("npwp", 40));
  if (!locked && npwp && npwp.length !== 15 && npwp.length !== 16) return { error: "npwp" };

  let year: number | null = null;
  const y = g("foundedYear", 4);
  if (y) {
    const n = Number(y);
    if (!Number.isInteger(n) || n < 1900 || n > new Date().getFullYear()) return { error: "tahun" };
    year = n;
  }
  let website = g("website", 200);
  if (website) {
    if (!/^https?:\/\//i.test(website)) website = `https://${website}`;
    try {
      new URL(website);
    } catch {
      return { error: "web" };
    }
  }
  const emailOk = (v: string) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const contactEmail = g("contactEmail", 120);
  const picEmail = g("picEmail", 120);
  if (!emailOk(contactEmail) || !emailOk(picEmail)) return { error: "email" };

  const name = g("name", 120);
  const entity = g("entityType", 40);
  const range = g("employeeRange", 20);
  const phoneClean = (k: string) => g(k, 30).replace(/[^\d+\-\s()]/g, "");

  await db.company.update({
    where: { id: company.id },
    data: {
      ...(locked ? {} : { name: name.length >= 2 ? name : company.name, nib: nz(nib), npwp: nz(npwp) }),
      industry: nz(g("industry", 80)),
      city: nz(g("city", 80)),
      website: nz(website),
      description: nz(g("description", 1500)),
    },
  });

  const base = {
    foundedYear: year,
    employeeRange: (EMPLOYEE_RANGES as readonly string[]).includes(range) ? range : null,
    address: nz(g("address", 300)),
    province: nz(g("province", 80)),
    postalCode: nz(digits(g("postalCode", 10)).slice(0, 5)),
    phone: nz(phoneClean("phone")),
    contactEmail: nz(contactEmail),
    picName: nz(g("picName", 120)),
    picTitle: nz(g("picTitle", 80)),
    picPhone: nz(phoneClean("picPhone")),
    picEmail: nz(picEmail),
    hiringNeeds: nz(g("hiringNeeds", 1500)),
    annualHiring: nz(g("annualHiring", 80)),
  };
  const legal = locked
    ? {}
    : {
        legalName: nz(g("legalName", 160)),
        entityType: (ENTITY_TYPES as readonly string[]).includes(entity) ? entity : null,
        deedNumber: nz(g("deedNumber", 80)),
        skNumber: nz(g("skNumber", 80)),
        otherLicense: nz(g("otherLicense", 200)),
      };
  const data = { ...base, ...legal };
  await db.companyProfile.upsert({ where: { companyId: company.id }, update: data, create: { companyId: company.id, ...data } });
  return { companyId: company.id };
}

async function saveProfile(fd: FormData) {
  "use server";
  const s = await requireRole("EMPLOYER");
  const r = await persist(fd, s.uid);
  revalidatePath(PATH);
  redirect(`${PATH}?${"error" in r ? `error=${r.error}` : "ok=saved"}`);
}

async function submitVerification() {
  "use server";
  const s = await requireRole("EMPLOYER");
  const company = await db.company.findFirst({ where: { members: { some: { userId: s.uid } } }, orderBy: { createdAt: "asc" } });
  if (!company) redirect(`${PATH}?error=perusahaan`);
  if (company.verification === "SUSPENDED") redirect(`${PATH}?error=ditangguhkan`);
  if (company.verification === "VERIFIED") redirect(`${PATH}?ok=saved`);
  const [profile, docs] = await Promise.all([
    db.companyProfile.findUnique({ where: { companyId: company.id } }),
    db.companyDocument.findMany({ where: { companyId: company.id }, select: { kind: true } }),
  ]);
  if (missingFields(company, profile, docs.map((d) => d.kind)).length) redirect(`${PATH}?error=lengkapi`);
  const now = new Date();
  await db.$transaction([
    db.company.update({ where: { id: company.id }, data: { verification: "PENDING" } }),
    db.companyProfile.upsert({
      where: { companyId: company.id },
      update: { submittedAt: now, reviewNote: null },
      create: { companyId: company.id, submittedAt: now },
    }),
  ]);
  revalidatePath(PATH);
  revalidatePath("/dashboard/admin");
  redirect(`${PATH}?ok=submitted`);
}

async function deleteDoc(fd: FormData) {
  "use server";
  const s = await requireRole("EMPLOYER");
  const id = String(fd.get("id"));
  const doc = await db.companyDocument.findUnique({ where: { id }, select: { id: true, companyId: true } });
  if (!doc) return;
  const company = await db.company.findFirst({
    where: { id: doc.companyId, members: { some: { userId: s.uid } } },
    select: { verification: true },
  });
  // Dokumen perusahaan yang sudah terverifikasi tidak dapat dihapus
  if (!company || company.verification === "VERIFIED") return;
  await db.companyDocument.delete({ where: { id } });
  revalidatePath(PATH);
}

function Field({
  label,
  name,
  defaultValue,
  disabled,
  type = "text",
  placeholder,
  hint,
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  hint?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-semibold">{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} disabled={disabled} placeholder={placeholder} maxLength={maxLength} className="field" />
      {hint && <p className="mt-1 text-xs text-ink/60">{hint}</p>}
    </div>
  );
}

export default async function CompanyProfilePage({ searchParams }: { searchParams: { ok?: string; error?: string } }) {
  const s = await requireRole("EMPLOYER");
  const company = await db.company.findFirst({ where: { members: { some: { userId: s.uid } } }, orderBy: { createdAt: "asc" } });
  if (!company) return <p className="panel text-sm">Akun ini belum memiliki perusahaan.</p>;

  const [profile, docs] = await Promise.all([
    db.companyProfile.findUnique({ where: { companyId: company.id } }),
    db.companyDocument.findMany({
      where: { companyId: company.id },
      select: { id: true, kind: true, fileName: true, size: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const locked = company.verification === "VERIFIED";
  const missing = missingFields(company, profile, docs.map((d) => d.kind));
  const okMsg = searchParams.ok ? OK_MSG[searchParams.ok] : "";
  const errMsg = searchParams.error ? ERR_MSG[searchParams.error] : "";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/employer" className="text-sm underline">Kembali ke dasbor</Link>
        <h1 className="mt-2 text-2xl font-extrabold">Profil dan verifikasi perusahaan</h1>
        <p className="mt-1 text-sm text-ink/70">
          Lengkapi data dan dokumen legalitas agar perusahaan Anda dapat diverifikasi dan lowongan tampil di publik.
        </p>
      </div>

      {okMsg && <p role="status" className="rounded-md bg-brand-soft px-3 py-2 text-sm font-medium">{okMsg}</p>}
      {errMsg && <p role="alert" className="rounded-md bg-sun-soft px-3 py-2 text-sm font-medium">{errMsg}</p>}

      <section className="panel space-y-2 text-sm">
        <p>
          Status verifikasi: <span className="tag">{VERIFICATION_LABEL[company.verification]}</span>
          {profile?.submittedAt && <span className="text-ink/60"> (diajukan {formatDateId(profile.submittedAt)})</span>}
        </p>
        {company.verification === "REJECTED" && (
          <p className="rounded-md bg-sun-soft px-3 py-2">
            <span className="font-semibold">Permohonan ditolak.</span>{" "}
            {profile?.reviewNote ? `Catatan admin: ${profile.reviewNote}` : "Perbaiki data lalu ajukan kembali."}
          </p>
        )}
        {locked && (
          <p className="text-ink/70">
            Perusahaan sudah terverifikasi. Nama, NIB, NPWP, dan data legalitas dikunci. Hubungi admin bila perlu mengubahnya.
          </p>
        )}
      </section>

      <form action={saveProfile} className="space-y-6">
        <section className="panel space-y-4">
          <h2 className="font-bold">1. Identitas dan legalitas</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nama perusahaan (tampil di lowongan)" name="name" defaultValue={company.name} disabled={locked} maxLength={120} />
            <Field label="Nama resmi badan usaha" name="legalName" defaultValue={profile?.legalName} disabled={locked} placeholder="Sesuai akta atau NIB" maxLength={160} />
            <div>
              <label htmlFor="entityType" className="mb-1 block text-sm font-semibold">Bentuk usaha</label>
              <select id="entityType" name="entityType" defaultValue={profile?.entityType ?? ""} disabled={locked} className="field">
                <option value="">Pilih</option>
                {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Field label="Bidang usaha" name="industry" defaultValue={company.industry} placeholder="Contoh: Teknologi informasi" maxLength={80} />
            <Field label="Tahun berdiri" name="foundedYear" type="number" defaultValue={profile?.foundedYear} placeholder="2024" />
            <div>
              <label htmlFor="employeeRange" className="mb-1 block text-sm font-semibold">Jumlah karyawan</label>
              <select id="employeeRange" name="employeeRange" defaultValue={profile?.employeeRange ?? ""} className="field">
                <option value="">Pilih</option>
                {EMPLOYEE_RANGES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Field label="NIB (13 digit)" name="nib" defaultValue={company.nib} disabled={locked} maxLength={40} />
            <Field label="NPWP perusahaan (15 atau 16 digit)" name="npwp" defaultValue={company.npwp} disabled={locked} maxLength={40} />
            <Field label="Nomor akta pendirian" name="deedNumber" defaultValue={profile?.deedNumber} disabled={locked} maxLength={80} />
            <Field label="Nomor SK pengesahan (Kemenkumham/AHU)" name="skNumber" defaultValue={profile?.skNumber} disabled={locked} maxLength={80} />
          </div>
          <Field label="Izin usaha lain atau izin sektoral (bila ada)" name="otherLicense" defaultValue={profile?.otherLicense} disabled={locked} placeholder="Contoh: izin penempatan, izin pelatihan, SIUP lama" maxLength={200} />
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-semibold">Deskripsi perusahaan</label>
            <textarea id="description" name="description" rows={4} maxLength={1500} defaultValue={company.description ?? ""} className="field" />
          </div>
        </section>

        <section className="panel space-y-4">
          <h2 className="font-bold">2. Alamat dan kontak perusahaan</h2>
          <div>
            <label htmlFor="address" className="mb-1 block text-sm font-semibold">Alamat lengkap</label>
            <textarea id="address" name="address" rows={2} maxLength={300} defaultValue={profile?.address ?? ""} className="field" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Kota" name="city" defaultValue={company.city} maxLength={80} />
            <Field label="Provinsi" name="province" defaultValue={profile?.province} maxLength={80} />
            <Field label="Kode pos" name="postalCode" defaultValue={profile?.postalCode} maxLength={10} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Telepon perusahaan" name="phone" defaultValue={profile?.phone} maxLength={30} />
            <Field label="Email perusahaan" name="contactEmail" type="email" defaultValue={profile?.contactEmail} maxLength={120} />
            <Field label="Situs web" name="website" defaultValue={company.website} placeholder="https://" maxLength={200} />
          </div>
        </section>

        <section className="panel space-y-4">
          <h2 className="font-bold">3. Penanggung jawab (PIC) kerja sama</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nama PIC" name="picName" defaultValue={profile?.picName} maxLength={120} />
            <Field label="Jabatan" name="picTitle" defaultValue={profile?.picTitle} maxLength={80} />
            <Field label="Telepon atau WhatsApp PIC" name="picPhone" defaultValue={profile?.picPhone} maxLength={30} />
            <Field label="Email PIC" name="picEmail" type="email" defaultValue={profile?.picEmail} maxLength={120} />
          </div>
        </section>

        <section className="panel space-y-4">
          <h2 className="font-bold">4. Kebutuhan tenaga kerja</h2>
          <p className="text-sm text-ink/70">Informasi ini membantu Lolos Kerja merancang kelas yang sesuai kebutuhan Anda.</p>
          <div>
            <label htmlFor="hiringNeeds" className="mb-1 block text-sm font-semibold">Posisi dan keterampilan yang sering dibutuhkan</label>
            <textarea id="hiringNeeds" name="hiringNeeds" rows={4} maxLength={1500} defaultValue={profile?.hiringNeeds ?? ""} placeholder="Contoh: Staf administrasi (Excel, korespondensi), AI automation (n8n, API)" className="field" />
          </div>
          <Field label="Perkiraan kebutuhan karyawan per tahun" name="annualHiring" defaultValue={profile?.annualHiring} placeholder="Contoh: 10 sampai 20 orang" maxLength={80} />
        </section>

        <button className="btn btn-primary">Simpan data</button>
      </form>

      <section className="panel space-y-4">
        <h2 className="font-bold">5. Dokumen legalitas</h2>
        <p className="text-sm text-ink/70">
          Dokumen hanya dapat dibuka oleh admin Lolos Kerja dan anggota perusahaan Anda. Dokumen NIB wajib diunggah.
        </p>
        {docs.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {docs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line p-2">
                <span>
                  <span className="tag">{DOC_LABEL[d.kind]?.split(" (")[0] ?? d.kind}</span>{" "}
                  <a href={`/api/company-docs/${d.id}`} target="_blank" rel="noopener noreferrer" className="underline">{d.fileName}</a>{" "}
                  <span className="text-xs text-ink/60">({fmtSize(d.size)}, {formatDateId(d.createdAt)})</span>
                </span>
                {!locked && (
                  <form action={deleteDoc}>
                    <input type="hidden" name="id" value={d.id} />
                    <button className="btn btn-ghost !py-1 text-xs">Hapus</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink/60">Belum ada dokumen.</p>
        )}
        <CompanyDocUpload companyId={company.id} kinds={DOC_KINDS} maxMb={MAX_DOC_MB} />
      </section>

      {!locked && company.verification !== "SUSPENDED" && (
        <section className="panel space-y-3">
          <h2 className="font-bold">6. Ajukan verifikasi</h2>
          {missing.length > 0 ? (
            <div className="text-sm">
              <p>Lengkapi dulu data berikut (simpan data setelah mengisi):</p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                {missing.map((m) => <li key={m}>{m}</li>)}
              </ul>
            </div>
          ) : (
            <p className="text-sm">Data sudah lengkap. Pastikan sudah tersimpan, lalu ajukan ke admin.</p>
          )}
          <form action={submitVerification}>
            <button disabled={missing.length > 0} className="btn btn-primary">
              {company.verification === "REJECTED" ? "Ajukan ulang verifikasi" : "Ajukan verifikasi"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
