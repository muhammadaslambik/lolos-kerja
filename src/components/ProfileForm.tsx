"use client";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { saveProfile, type ProfileState } from "@/app/actions/profile";
import { EDU_LEVELS } from "@/lib/constants";

export type ProfileData = {
  headline: string | null;
  city: string | null;
  educationLevel: string | null;
  experienceYears: number;
  skills: string[];
  talentVisible: boolean;
} | null;

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="btn btn-primary">
      {pending ? "Menyimpan..." : "Simpan profil"}
    </button>
  );
}

export default function ProfileForm({ profile }: { profile: ProfileData }) {
  const [state, action] = useFormState<ProfileState, FormData>(saveProfile, {});
  const [showOk, setShowOk] = useState(false);

  useEffect(() => {
    if (!state.ok) return;
    setShowOk(true);
    const t = setTimeout(() => setShowOk(false), 3500);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <form action={action} className="mt-4 grid gap-3 md:grid-cols-2">
      <label className="text-sm font-semibold">Headline
        <input name="headline" defaultValue={profile?.headline ?? ""} placeholder="Contoh: Fresh graduate Manajemen" className="field mt-1 font-normal" />
      </label>
      <label className="text-sm font-semibold">Kota
        <input name="city" defaultValue={profile?.city ?? ""} className="field mt-1 font-normal" />
      </label>
      <label className="text-sm font-semibold">Pendidikan terakhir
        <select name="educationLevel" defaultValue={profile?.educationLevel ?? ""} className="field mt-1 font-normal">
          <option value="">Pilih</option>
          {EDU_LEVELS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold">Pengalaman (tahun)
        <input name="experienceYears" type="number" min={0} max={50} defaultValue={profile?.experienceYears ?? 0} className="field mt-1 font-normal" />
      </label>
      <label className="text-sm font-semibold md:col-span-2">Keahlian (pisahkan dengan koma)
        <input name="skills" defaultValue={profile?.skills.join(", ") ?? ""} placeholder="excel, komunikasi, administrasi" className="field mt-1 font-normal" />
      </label>
      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input type="checkbox" name="talentVisible" defaultChecked={profile?.talentVisible ?? false} />
        Izinkan profil saya tampil di Talent Pool perusahaan
      </label>
      <div className="flex items-center gap-3 md:col-span-2" aria-live="polite">
        <SaveButton />
        {showOk && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M7.5 12.5l3 3 6-6.5" />
            </svg>
            Profil tersimpan
          </span>
        )}
        {state.error && <span role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">{state.error}</span>}
      </div>
    </form>
  );
}
