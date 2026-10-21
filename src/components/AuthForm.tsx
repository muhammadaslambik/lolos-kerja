"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { login, register, type AuthState } from "@/app/actions/auth";

const OAUTH_ERRORS: Record<string, string> = {
  google_belum_diatur: "Masuk dengan Google belum diaktifkan di server.",
  google_dibatalkan: "Masuk dengan Google dibatalkan.",
  google_gagal: "Masuk dengan Google gagal. Coba lagi sebentar lagi.",
  email_belum_terverifikasi: "Email Google Anda belum terverifikasi, jadi tidak bisa dipakai untuk masuk.",
  nama_perusahaan: "Isi nama perusahaan terlebih dulu sebelum mendaftar dengan Google.",
};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="btn btn-primary w-full">{pending ? "Memproses..." : label}</button>;
}

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" width="18" height="18">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action] = useFormState<AuthState, FormData>(mode === "login" ? login : register, {});
  const [role, setRole] = useState("SEEKER");
  const [company, setCompany] = useState("");
  const [oauthMsg, setOauthMsg] = useState("");
  const isRegister = mode === "register";

  // Pesan kesalahan dari proses Google dibawa lewat alamat halaman (?error=...)
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");
    if (code && OAUTH_ERRORS[code]) setOauthMsg(OAUTH_ERRORS[code]);
  }, []);

  function googleStart() {
    if (isRegister && role === "EMPLOYER" && company.trim().length < 2) {
      setOauthMsg(OAUTH_ERRORS.nama_perusahaan);
      return;
    }
    const p = new URLSearchParams({ mode });
    if (isRegister) {
      p.set("role", role);
      if (role === "EMPLOYER") p.set("company", company.trim());
    }
    if (next) p.set("next", next);
    window.location.href = `/api/auth/google/start?${p.toString()}`;
  }

  const message = state.error || oauthMsg;

  return (
    <form action={action} className="panel mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-extrabold">{isRegister ? "Daftar akun" : "Masuk"}</h1>
      {next && <input type="hidden" name="next" value={next} />}

      {isRegister && (
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="mb-1 text-sm font-semibold">Saya mendaftar sebagai</legend>
          {[["SEEKER", "Pelamar kerja"], ["EMPLOYER", "Perusahaan"]].map(([v, l]) => (
            <label key={v} className={`cursor-pointer rounded-md border px-3 py-2 text-center text-sm font-semibold ${role === v ? "border-brand bg-brand-soft text-brand-ink" : "border-line"}`}>
              <input type="radio" name="role" value={v} checked={role === v} onChange={() => setRole(v)} className="sr-only" />
              {l}
            </label>
          ))}
        </fieldset>
      )}
      {isRegister && (
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-semibold">Nama lengkap</label>
          <input id="fullName" name="fullName" required autoComplete="name" className="field" />
        </div>
      )}
      {isRegister && role === "EMPLOYER" && (
        <div>
          <label htmlFor="companyName" className="mb-1 block text-sm font-semibold">Nama perusahaan</label>
          <input id="companyName" name="companyName" required value={company} onChange={(e) => setCompany(e.target.value)} className="field" />
        </div>
      )}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-semibold">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-semibold">Kata sandi</label>
        <input id="password" name="password" type="password" required minLength={isRegister ? 8 : undefined} autoComplete={isRegister ? "new-password" : "current-password"} className="field" />
        {isRegister && <p className="mt-1 text-xs text-ink/60">Minimal 8 karakter.</p>}
      </div>

      {message && <p role="alert" className="rounded-md bg-sun-soft px-3 py-2 text-sm font-medium">{message}</p>}
      <Submit label={isRegister ? "Buat akun" : "Masuk"} />

      <div className="flex items-center gap-3 text-xs text-ink/60">
        <span className="h-px flex-1 bg-line" />
        atau
        <span className="h-px flex-1 bg-line" />
      </div>
      <button type="button" onClick={googleStart} className="btn btn-ghost flex w-full items-center justify-center gap-2">
        <GoogleLogo />
        {isRegister ? "Daftar dengan Google" : "Masuk dengan Google"}
      </button>
      {!isRegister && (
        <p className="text-center text-xs text-ink/60">
          Belum punya akun? Masuk dengan Google otomatis membuat akun pelamar. Untuk akun perusahaan, daftar lewat halaman Daftar.
        </p>
      )}

      <p className="text-center text-sm text-ink/70">
        {isRegister ? "Sudah punya akun? " : "Belum punya akun? "}
        <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-brand-ink underline">
          {isRegister ? "Masuk" : "Daftar"}
        </Link>
      </p>
    </form>
  );
}
