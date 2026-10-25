"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function CompanyDocUpload({
  companyId,
  kinds,
  maxMb,
}: {
  companyId: string;
  kinds: { key: string; label: string }[];
  maxMb: number;
}) {
  const router = useRouter();
  const [kind, setKind] = useState(kinds[0].key);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload() {
    const f = fileRef.current?.files?.[0];
    if (!f) {
      setMsg("Pilih berkas terlebih dulu.");
      return;
    }
    if (f.size > maxMb * 1024 * 1024) {
      setMsg(`Ukuran berkas maksimal ${maxMb} MB.`);
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.set("companyId", companyId);
      fd.set("kind", kind);
      fd.set("file", f);
      const r = await fetch("/api/company-docs", { method: "POST", body: fd });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setMsg(j.error || "Unggah gagal.");
      } else {
        if (fileRef.current) fileRef.current.value = "";
        setMsg("Berkas berhasil diunggah.");
        router.refresh();
      }
    } catch {
      setMsg("Unggah gagal. Periksa koneksi Anda.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-3 rounded-md border border-line p-3">
      <div>
        <label htmlFor="docKind" className="mb-1 block text-sm font-semibold">Jenis dokumen</label>
        <select id="docKind" value={kind} onChange={(e) => setKind(e.target.value)} className="field">
          {kinds.map((k) => (
            <option key={k.key} value={k.key}>{k.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="docFile" className="mb-1 block text-sm font-semibold">Berkas (PDF, JPG, atau PNG, maksimal {maxMb} MB)</label>
        <input id="docFile" ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png" className="field" />
      </div>
      <button type="button" onClick={upload} disabled={busy} className="btn btn-primary">
        {busy ? "Mengunggah..." : "Unggah dokumen"}
      </button>
      {msg && <p role="status" className="text-sm">{msg}</p>}
    </div>
  );
}
