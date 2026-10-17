import { EDU_LEVELS, JOB_TYPE_LABEL } from "@/lib/constants";
import { WORK_MODE_LABEL } from "@/lib/job-options";

export type JobValues = {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  jobType: string;
  workMode: string;
  city: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  minEducation: string | null;
  minExperienceYears: number;
  requiredSkills: string[];
};

export default function JobForm({
  action,
  job,
  error,
  submitLabel,
}: {
  action: (fd: FormData) => Promise<void>;
  job?: JobValues;
  error?: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="panel space-y-4">
      {job && <input type="hidden" name="id" value={job.id} />}
      {error && (
        <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <label className="block text-sm font-semibold">
        Judul lowongan
        <input name="title" required minLength={3} maxLength={150} defaultValue={job?.title ?? ""} className="field mt-1" placeholder="Contoh: Staf Administrasi" />
      </label>

      <label className="block text-sm font-semibold">
        Deskripsi pekerjaan
        <textarea name="description" required minLength={20} maxLength={5000} rows={6} defaultValue={job?.description ?? ""} className="field mt-1" />
      </label>

      <label className="block text-sm font-semibold">
        Persyaratan (opsional)
        <textarea name="requirements" maxLength={3000} rows={4} defaultValue={job?.requirements ?? ""} className="field mt-1" />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold">
          Tipe pekerjaan
          <select name="jobType" defaultValue={job?.jobType ?? "FULL_TIME"} className="field mt-1">
            {Object.entries(JOB_TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Mode kerja
          <select name="workMode" defaultValue={job?.workMode ?? "ONSITE"} className="field mt-1">
            {Object.entries(WORK_MODE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Kota
          <input name="city" maxLength={100} defaultValue={job?.city ?? ""} className="field mt-1" placeholder="Contoh: Semarang" />
        </label>
        <label className="block text-sm font-semibold">
          Pendidikan minimum
          <select name="minEducation" defaultValue={job?.minEducation ?? ""} className="field mt-1">
            <option value="">Tidak ditentukan</option>
            {EDU_LEVELS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Gaji minimum (Rp, opsional)
          <input name="salaryMin" type="number" min={0} defaultValue={job?.salaryMin ?? ""} className="field mt-1" />
        </label>
        <label className="block text-sm font-semibold">
          Gaji maksimum (Rp, opsional)
          <input name="salaryMax" type="number" min={0} defaultValue={job?.salaryMax ?? ""} className="field mt-1" />
        </label>
        <label className="block text-sm font-semibold">
          Pengalaman minimum (tahun)
          <input name="minExperienceYears" type="number" min={0} max={50} defaultValue={job?.minExperienceYears ?? 0} className="field mt-1" />
        </label>
      </div>

      <label className="block text-sm font-semibold">
        Keahlian yang dibutuhkan
        <input name="requiredSkills" defaultValue={job?.requiredSkills.join(", ") ?? ""} className="field mt-1" placeholder="Contoh: excel, komunikasi, administrasi" />
        <span className="mt-1 block text-xs font-normal text-ink/70">Pisahkan dengan koma. Dipakai untuk menghitung skor kecocokan pelamar.</span>
      </label>

      <button className="btn btn-primary">{submitLabel}</button>
    </form>
  );
}
