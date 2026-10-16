"use client";
import { useState } from "react";
export default function ApplyButton({ jobId }: { jobId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  async function apply() {
    setState("loading");
    const res = await fetch(`/api/jobs/${jobId}/apply`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setMsg(data.message ?? "");
    setState(res.ok ? "done" : "error");
  }
  if (state === "done") return <p className="text-sm font-semibold text-brand">Lamaran terkirim. {msg}</p>;
  return (
    <div>
      <button onClick={apply} disabled={state === "loading"} className="btn btn-primary">
        {state === "loading" ? "Mengirim…" : "Lamar sekarang"}
      </button>
      {state === "error" && <p className="mt-2 text-sm text-red-700">{msg || "Gagal melamar. Coba lagi."}</p>}
    </div>
  );
}
