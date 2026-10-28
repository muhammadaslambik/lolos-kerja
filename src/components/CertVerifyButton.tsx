"use client";
import { useEffect, useRef, useState } from "react";

type Result =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "found"; name: string; course: string; score: number | null; issuedAt: string; code: string }
  | { kind: "missing"; message: string }
  | { kind: "error"; message: string };

export default function CertVerifyButton() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Result>({ kind: "idle" });
  const btnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Saat terbuka: kunci gulir halaman, fokus ke isian, dan tutup dengan tombol Esc
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const btn = btnRef.current;
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      btn?.focus();
    };
  }, [open]);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    const v = q.trim();
    if (!v) {
      setRes({ kind: "missing", message: "Tempel URL atau kode sertifikat dulu." });
      return;
    }
    setRes({ kind: "loading" });
    try {
      const r = await fetch(`/api/certificates/check?q=${encodeURIComponent(v)}`, { cache: "no-store" });
      const j = (await r.json().catch(() => ({}))) as {
        found?: boolean;
        message?: string;
        name?: string;
        course?: string;
        score?: number | null;
        issuedAt?: string;
        code?: string;
      };
      if (r.status === 429) {
        setRes({ kind: "error", message: j.message ?? "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." });
      } else if (!r.ok) {
        setRes({ kind: "error", message: "Pemeriksaan gagal. Coba lagi sebentar lagi." });
      } else if (j.found && j.code) {
        setRes({
          kind: "found",
          name: j.name ?? "-",
          course: j.course ?? "-",
          score: j.score ?? null,
          issuedAt: j.issuedAt ?? "-",
          code: j.code,
        });
      } else {
        setRes({ kind: "missing", message: j.message ?? "Sertifikat tidak ditemukan." });
      }
    } catch {
      setRes({ kind: "error", message: "Pemeriksaan gagal. Periksa koneksi Anda." });
    }
  }

  return (
    <>
      <button ref={btnRef} type="button" onClick={() => setOpen(true)} className="btn btn-ghost">
        Verifikasi sertifikat
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="cert-check-title">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-surface p-5 shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md border border-line text-lg leading-none hover:bg-brand-soft"
            >
              &times;
            </button>
            <h2 id="cert-check-title" className="pr-10 text-lg font-extrabold">Verifikasi sertifikat</h2>
            <p className="mt-1 text-sm text-ink/70">Tempel URL atau kode sertifikat untuk mengecek keasliannya.</p>

            <form onSubmit={check} className="mt-3 space-y-2">
              <label htmlFor="cert-q" className="block text-sm font-semibold">URL atau kode sertifikat</label>
              <input
                id="cert-q"
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  if (res.kind !== "idle") setRes({ kind: "idle" });
                }}
                placeholder="LK-ABCDE-FGHJK atau https://.../verify/LK-..."
                maxLength={300}
                autoComplete="off"
                spellCheck={false}
                className="field"
              />
              <button disabled={res.kind === "loading"} className="btn btn-primary w-full">
                {res.kind === "loading" ? "Memeriksa..." : "Periksa"}
              </button>
            </form>

            <div aria-live="polite" className="mt-3">
              {res.kind === "found" && (
                <div className="space-y-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
                  <p className="font-semibold">Sertifikat ASLI dan tercatat di Lolos Kerja.</p>
                  <p><span className="text-ink/70">Penerima:</span> <span className="font-semibold">{res.name}</span></p>
                  <p><span className="text-ink/70">Kelas:</span> <span className="font-semibold">{res.course}</span></p>
                  {res.score !== null && <p><span className="text-ink/70">Nilai akhir:</span> {res.score}</p>}
                  <p><span className="text-ink/70">Tanggal terbit:</span> {res.issuedAt}</p>
                  <p><span className="text-ink/70">Kode:</span> {res.code}</p>
                  <a href={`/verify/${res.code}`} className="mt-1 inline-block underline">Buka halaman verifikasi</a>
                </div>
              )}
              {res.kind === "missing" && (
                <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{res.message}</p>
              )}
              {res.kind === "error" && (
                <p role="alert" className="rounded-md bg-sun-soft p-3 text-sm font-medium">{res.message}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
