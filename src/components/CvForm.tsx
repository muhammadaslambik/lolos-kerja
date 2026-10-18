import type { CvContent } from "@/lib/cv-analysis";

export default function CvForm({
  action,
  cv,
  title,
  id,
  error,
  submitLabel,
}: {
  action: (fd: FormData) => Promise<void>;
  cv: CvContent;
  title: string;
  id?: string;
  error?: string;
  submitLabel: string;
}) {
  const exps = [0, 1, 2].map((i) => cv.experiences[i] ?? { role: "", company: "", period: "", bullets: [] as string[] });
  const edus = [0, 1].map((i) => cv.education[i] ?? { school: "", degree: "", period: "" });

  return (
    <form action={action} className="space-y-4">
      {id && <input type="hidden" name="id" value={id} />}
      {error && (
        <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{error}</p>
      )}

      <section className="panel space-y-3">
        <h2 className="font-bold">Data diri</h2>
        <label className="block text-sm font-semibold">
          Nama CV (hanya untuk Anda)
          <input name="title" maxLength={100} defaultValue={title} className="field mt-1" />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm font-semibold">
            Nama lengkap
            <input name="fullName" required maxLength={120} defaultValue={cv.fullName} className="field mt-1" />
          </label>
          <label className="block text-sm font-semibold">
            Email
            <input name="email" type="email" required maxLength={120} defaultValue={cv.email} className="field mt-1" />
          </label>
          <label className="block text-sm font-semibold">
            Nomor telepon
            <input name="phone" maxLength={40} defaultValue={cv.phone} className="field mt-1" placeholder="Contoh: 0812 3456 7890" />
          </label>
          <label className="block text-sm font-semibold">
            Kota
            <input name="city" maxLength={100} defaultValue={cv.city} className="field mt-1" />
          </label>
        </div>
        <label className="block text-sm font-semibold">
          Ringkasan profil
          <textarea name="summary" rows={4} maxLength={1000} defaultValue={cv.summary} className="field mt-1" />
          <span className="mt-1 block text-xs font-normal text-ink/70">2 sampai 3 kalimat. Ubah agar sesuai posisi yang Anda tuju.</span>
        </label>
      </section>

      {exps.map((e, i) => (
        <fieldset key={i} className="panel space-y-3">
          <legend className="px-1 font-bold">Pengalaman {i + 1}{i > 0 ? " (opsional)" : ""}</legend>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block text-sm font-semibold">
              Jabatan atau peran
              <input name={`exp${i}_role`} maxLength={120} defaultValue={e.role} className="field mt-1" />
            </label>
            <label className="block text-sm font-semibold">
              Perusahaan atau organisasi
              <input name={`exp${i}_company`} maxLength={120} defaultValue={e.company} className="field mt-1" />
            </label>
            <label className="block text-sm font-semibold">
              Periode
              <input name={`exp${i}_period`} maxLength={60} defaultValue={e.period} className="field mt-1" placeholder="Jan 2023 - Des 2024" />
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Poin pencapaian (satu poin per baris)
            <textarea name={`exp${i}_bullets`} rows={4} defaultValue={e.bullets.join("\n")} className="field mt-1" placeholder="Contoh: Meningkatkan penjualan toko 20% dalam 3 bulan" />
            <span className="mt-1 block text-xs font-normal text-ink/70">Mulai dengan kata kerja (meningkatkan, mengelola, menyusun) dan sertakan angka bila ada.</span>
          </label>
        </fieldset>
      ))}

      {edus.map((e, i) => (
        <fieldset key={i} className="panel space-y-3">
          <legend className="px-1 font-bold">Pendidikan {i + 1}{i > 0 ? " (opsional)" : ""}</legend>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block text-sm font-semibold">
              Sekolah atau kampus
              <input name={`edu${i}_school`} maxLength={150} defaultValue={e.school} className="field mt-1" />
            </label>
            <label className="block text-sm font-semibold">
              Jurusan atau gelar
              <input name={`edu${i}_degree`} maxLength={150} defaultValue={e.degree} className="field mt-1" />
            </label>
            <label className="block text-sm font-semibold">
              Periode
              <input name={`edu${i}_period`} maxLength={60} defaultValue={e.period} className="field mt-1" placeholder="2019 - 2023" />
            </label>
          </div>
        </fieldset>
      ))}

      <section className="panel">
        <label className="block text-sm font-semibold">
          Keahlian (pisahkan dengan koma)
          <input name="skills" maxLength={600} defaultValue={cv.skills.join(", ")} className="field mt-1" placeholder="Contoh: excel, komunikasi, administrasi" />
        </label>
      </section>

      <button className="btn btn-primary">{submitLabel}</button>
    </form>
  );
}
