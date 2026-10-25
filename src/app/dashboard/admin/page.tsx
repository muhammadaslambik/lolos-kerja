import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { formatDateId } from "@/lib/certificate";
import { DOC_LABEL, fmtSize, missingFields } from "@/lib/company-profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dasbor Admin" };

const ROLE_LABEL: Record<string, string> = { SEEKER: "Pelamar", EMPLOYER: "Perusahaan", ADMIN: "Admin" };

async function setVerification(fd: FormData) {
  "use server";
  await requireRole("ADMIN");
  const id = String(fd.get("id"));
  const status = String(fd.get("status"));
  const note = String(fd.get("note") ?? "").trim().slice(0, 1000) || null;
  if (status !== "VERIFIED" && status !== "REJECTED") return;
  const now = new Date();
  const saveNote = db.companyProfile.upsert({
    where: { companyId: id },
    update: { reviewNote: note, reviewedAt: now },
    create: { companyId: id, reviewNote: note, reviewedAt: now },
  });
  if (status === "VERIFIED") {
    // Perusahaan disetujui: lowongan yang menunggu peninjauan ikut tayang
    await db.$transaction([
      db.company.update({ where: { id }, data: { verification: "VERIFIED" } }),
      db.job.updateMany({ where: { companyId: id, status: "PENDING_REVIEW" }, data: { status: "ACTIVE" } }),
      saveNote,
    ]);
  } else {
    await db.$transaction([db.company.update({ where: { id }, data: { verification: "REJECTED" } }), saveNote]);
  }
  revalidateTag("jobs");
  revalidatePath("/jobs");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/employer/jobs");
  revalidatePath("/dashboard/employer/perusahaan");
}

function Row({ k, v }: { k: string; v?: string | number | null }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <dt className="text-ink/60">{k}</dt>
      <dd className="col-span-2 break-words">{v === null || v === undefined || v === "" ? "-" : v}</dd>
    </div>
  );
}

export default async function AdminDashboard() {
  await requireRole("ADMIN");
  const [users, jobs, hired, enrolls, done, companies] = await Promise.all([
    db.user.count(),
    db.job.count({ where: { status: "ACTIVE" } }),
    db.application.count({ where: { stage: "HIRED" } }),
    db.enrollment.count(),
    db.enrollment.count({ where: { status: "completed" } }),
    db.company.findMany({
      where: { verification: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { members: { include: { user: { select: { fullName: true, email: true, role: true, createdAt: true } } } } },
    }),
  ]);
  const ids = companies.map((c) => c.id);
  const [profiles, docs] = await Promise.all([
    db.companyProfile.findMany({ where: { companyId: { in: ids } } }),
    db.companyDocument.findMany({
      where: { companyId: { in: ids } },
      select: { id: true, companyId: true, kind: true, fileName: true, size: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const stats: [string, string | number][] = [
    ["Pengguna", users], ["Lowongan aktif", jobs], ["Pelamar diterima", hired],
    ["Tingkat kelulusan kelas", enrolls ? `${Math.round((done / enrolls) * 100)}%` : "0%"],
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Ringkasan platform</h1>
      <div className="grid gap-3 md:grid-cols-4">
        {stats.map(([l, v]) => <div key={l} className="panel"><p className="text-2xl font-extrabold">{v}</p><p className="text-sm text-ink/70">{l}</p></div>)}
      </div>
      <section className="panel">
        <h2 className="font-bold">Perusahaan menunggu verifikasi</h2>
        <p className="mt-1 text-sm text-ink/70">Klik nama perusahaan untuk melihat akun pendaftar, data lengkap, dan dokumennya.</p>
        <ul className="mt-3 space-y-3">
          {companies.map((c) => {
            const p = profiles.find((x) => x.companyId === c.id) ?? null;
            const d = docs.filter((x) => x.companyId === c.id);
            const miss = missingFields(c, p, d.map((x) => x.kind));
            return (
              <li key={c.id}>
                <details className="rounded-md border border-line">
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 p-3 text-sm">
                    <span className="font-semibold">{c.name}</span>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="tag">{miss.length ? `Belum lengkap (${miss.length})` : "Data lengkap"}</span>
                      <span className="text-xs text-ink/60">
                        {p?.submittedAt ? `Diajukan ${formatDateId(p.submittedAt)}` : `Didaftarkan ${formatDateId(c.createdAt)}`}
                      </span>
                    </span>
                  </summary>

                  <div className="space-y-5 border-t border-line p-3">
                    <section>
                      <h3 className="text-sm font-bold">Akun pendaftar</h3>
                      <ul className="mt-2 space-y-2">
                        {c.members.map((m) => (
                          <li key={m.userId} className="rounded-md bg-brand-soft/60 p-2">
                            <dl className="space-y-1">
                              <Row k="Nama akun" v={m.user.fullName} />
                              <Row k="Email akun" v={m.user.email} />
                              <Row k="Peran di perusahaan" v={m.memberRole} />
                              <Row k="Peran akun saat ini" v={ROLE_LABEL[m.user.role] ?? m.user.role} />
                              <Row k="Akun dibuat" v={formatDateId(m.user.createdAt)} />
                            </dl>
                          </li>
                        ))}
                        {c.members.length === 0 && <li className="text-sm text-ink/60">Tidak ada akun terhubung.</li>}
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold">Identitas dan legalitas</h3>
                      <dl className="mt-2 space-y-1">
                        <Row k="Nama tampil" v={c.name} />
                        <Row k="Nama resmi" v={p?.legalName} />
                        <Row k="Bentuk usaha" v={p?.entityType} />
                        <Row k="Bidang usaha" v={c.industry} />
                        <Row k="Tahun berdiri" v={p?.foundedYear} />
                        <Row k="Jumlah karyawan" v={p?.employeeRange} />
                        <Row k="NIB" v={c.nib} />
                        <Row k="NPWP" v={c.npwp} />
                        <Row k="Nomor akta" v={p?.deedNumber} />
                        <Row k="Nomor SK pengesahan" v={p?.skNumber} />
                        <Row k="Izin lain" v={p?.otherLicense} />
                        <Row k="Deskripsi" v={c.description} />
                      </dl>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold">Alamat dan kontak</h3>
                      <dl className="mt-2 space-y-1">
                        <Row k="Alamat" v={p?.address} />
                        <Row k="Kota" v={c.city} />
                        <Row k="Provinsi" v={p?.province} />
                        <Row k="Kode pos" v={p?.postalCode} />
                        <Row k="Telepon" v={p?.phone} />
                        <Row k="Email" v={p?.contactEmail} />
                        <Row k="Situs web" v={c.website} />
                      </dl>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold">Penanggung jawab (PIC)</h3>
                      <dl className="mt-2 space-y-1">
                        <Row k="Nama" v={p?.picName} />
                        <Row k="Jabatan" v={p?.picTitle} />
                        <Row k="Telepon atau WhatsApp" v={p?.picPhone} />
                        <Row k="Email" v={p?.picEmail} />
                      </dl>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold">Kebutuhan tenaga kerja</h3>
                      <dl className="mt-2 space-y-1">
                        <Row k="Posisi dan keterampilan" v={p?.hiringNeeds} />
                        <Row k="Kebutuhan per tahun" v={p?.annualHiring} />
                      </dl>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold">Dokumen</h3>
                      {d.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-sm">
                          {d.map((x) => (
                            <li key={x.id}>
                              <span className="tag">{DOC_LABEL[x.kind]?.split(" (")[0] ?? x.kind}</span>{" "}
                              <a href={`/api/company-docs/${x.id}`} target="_blank" rel="noopener noreferrer" className="underline">{x.fileName}</a>{" "}
                              <span className="text-xs text-ink/60">({fmtSize(x.size)}, {formatDateId(x.createdAt)})</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-ink/60">Belum ada dokumen diunggah.</p>
                      )}
                    </section>

                    {miss.length > 0 && (
                      <p className="rounded-md bg-sun-soft px-3 py-2 text-sm">
                        <span className="font-semibold">Belum lengkap:</span> {miss.join(", ")}.
                      </p>
                    )}

                    <form action={setVerification} className="space-y-2">
                      <input type="hidden" name="id" value={c.id} />
                      <label htmlFor={`note-${c.id}`} className="block text-sm font-semibold">Catatan untuk perusahaan (isi alasan bila menolak)</label>
                      <textarea id={`note-${c.id}`} name="note" rows={2} maxLength={1000} className="field" />
                      <div className="flex gap-2">
                        <button name="status" value="VERIFIED" className="btn btn-primary !py-1">Setujui</button>
                        <button name="status" value="REJECTED" className="btn btn-ghost !py-1">Tolak</button>
                      </div>
                    </form>
                  </div>
                </details>
              </li>
            );
          })}
          {companies.length === 0 && <li className="text-sm">Tidak ada antrean verifikasi.</li>}
        </ul>
      </section>
    </div>
  );
}
