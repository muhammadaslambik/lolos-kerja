"use client";
import { useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { login, register, type AuthState } from "@/app/actions/auth";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="btn btn-primary w-full">{pending ? "Memproses..." : label}</button>;
}

export default function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action] = useFormState<AuthState, FormData>(mode === "login" ? login : register, {});
  const [role, setRole] = useState("SEEKER");
  const isRegister = mode === "register";

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
          <input id="companyName" name="companyName" required className="field" />
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

      {state.error && <p role="alert" className="rounded-md bg-sun-soft px-3 py-2 text-sm font-medium">{state.error}</p>}
      <Submit label={isRegister ? "Buat akun" : "Masuk"} />
      <p className="text-center text-sm text-ink/70">
        {isRegister ? "Sudah punya akun? " : "Belum punya akun? "}
        <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-brand-ink underline">
          {isRegister ? "Masuk" : "Daftar"}
        </Link>
      </p>
    </form>
  );
}
