"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type State = "idle" | "loading" | "done" | "error" | "login";

export default function ApplyButton({ jobId }: { jobId: string }) {
  const pathname = usePathname();
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");

  async function apply() {
    setState("loading");
    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      setMsg(data.message ?? "");
      setState(res.ok ? "done" : res.status === 401 ? "login" : "error");
    } catch {
      setMsg("Koneksi bermasalah. Coba lagi.");
      setState("error");
    }
  }

  if (state === "done") return <p className="text-sm font-semibold text-brand-ink">Lamaran terkirim. {msg}</p>;
  if (state === "login")
    return (
      <p className="text-sm">
        Silakan{" "}
        <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="font-semibold text-brand-ink underline">masuk</Link>
        {" "}atau{" "}
        <Link href="/register" className="font-semibold text-brand-ink underline">daftar</Link>
        {" "}sebagai pelamar untuk melamar.
      </p>
    );
  return (
    <div>
      <button onClick={apply} disabled={state === "loading"} className="btn btn-primary">
        {state === "loading" ? "Mengirim..." : "Lamar sekarang"}
      </button>
      {state === "error" && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{msg || "Gagal melamar. Coba lagi."}</p>}
    </div>
  );
}
