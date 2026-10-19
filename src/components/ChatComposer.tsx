"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const MAX_SECONDS = 60;

export default function ChatComposer({ applicationId, disabled }: { applicationId: string; disabled?: boolean }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState<{ blob: Blob; url: string; seconds: number } | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const secondsRef = useRef(0);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  async function post(fd: FormData) {
    const res = await fetch(`/api/applications/${applicationId}/messages`, { method: "POST", body: fd });
    if (!res.ok) {
      let msg = "Gagal mengirim. Coba lagi.";
      try {
        const j = await res.json();
        if (j && typeof j.error === "string") msg = j.error;
      } catch {
        // abaikan, pakai pesan bawaan
      }
      throw new Error(msg);
    }
  }

  async function sendText(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("kind", "text");
      fd.set("body", body);
      await post(fd);
      setText("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim.");
    } finally {
      setBusy(false);
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
  }

  async function startRecording() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Browser ini belum mendukung rekam suara.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
      const mimeType = types.find((t) => MediaRecorder.isTypeSupported(t));
      const rec = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 24000 });
      chunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        const type = rec.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        stopStream();
        if (blob.size > 0) {
          setClip({ blob, url: URL.createObjectURL(blob), seconds: Math.max(1, secondsRef.current) });
        }
      };
      rec.start();
      recorderRef.current = rec;
      secondsRef.current = 0;
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        if (secondsRef.current >= MAX_SECONDS) stopRecording();
      }, 1000);
    } catch {
      stopStream();
      setError("Izin mikrofon ditolak atau mikrofon tidak ditemukan.");
    }
  }

  async function sendClip() {
    if (!clip || busy) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("kind", "voice");
      fd.set("audio", clip.blob, "voice");
      fd.set("seconds", String(clip.seconds));
      await post(fd);
      URL.revokeObjectURL(clip.url);
      setClip(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim.");
    } finally {
      setBusy(false);
    }
  }

  function discardClip() {
    if (clip) URL.revokeObjectURL(clip.url);
    setClip(null);
  }

  if (disabled) {
    return (
      <p className="panel text-sm">
        Pesan hanya dapat dikirim saat status lamaran Interview, Penawaran, Diterima, atau Ditolak.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{error}</p>
      )}
      {clip ? (
        <div className="panel space-y-2 text-sm">
          <audio controls src={clip.url} className="w-full" />
          <div className="flex gap-2">
            <button type="button" onClick={sendClip} disabled={busy} className="btn btn-primary !py-1 text-sm">
              {busy ? "Mengirim..." : "Kirim pesan suara"}
            </button>
            <button type="button" onClick={discardClip} disabled={busy} className="btn btn-ghost !py-1 text-sm">Buang</button>
          </div>
        </div>
      ) : recording ? (
        <div className="panel flex items-center justify-between gap-2 text-sm">
          <span>Merekam... {seconds} detik (maksimal {MAX_SECONDS})</span>
          <button type="button" onClick={stopRecording} className="btn btn-primary !py-1 text-sm">Berhenti</button>
        </div>
      ) : (
        <form onSubmit={sendText} className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            rows={2}
            className="field flex-1"
            placeholder="Tulis pesan..."
          />
          <div className="flex flex-col gap-1">
            <button disabled={busy || !text.trim()} className="btn btn-primary !py-1 text-sm">Kirim</button>
            <button type="button" onClick={startRecording} disabled={busy} className="btn btn-ghost !py-1 text-sm">
              Rekam suara
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
