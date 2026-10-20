"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const IDLE_MS = 10 * 60 * 1000; // berhenti memperbarui setelah 10 menit tanpa aktivitas
const EVENTS = ["mousemove", "keydown", "click", "touchstart", "scroll"] as const;

// Memuat ulang data halaman secara berkala agar pesan baru muncul tanpa menekan refresh.
// Pembaruan berhenti jika halaman tidak disentuh 10 menit, dan lanjut sendiri saat ada aktivitas.
export default function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();
  const lastActive = useRef(Date.now());
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);

  const resume = useCallback(() => {
    lastActive.current = Date.now();
    if (pausedRef.current) {
      pausedRef.current = false;
      setPaused(false);
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") resume();
    };
    EVENTS.forEach((e) => window.addEventListener(e, resume, { passive: true, capture: true }));
    document.addEventListener("visibilitychange", onVisible);

    const id = setInterval(() => {
      if (document.visibilityState !== "visible" || pausedRef.current) return;
      if (Date.now() - lastActive.current > IDLE_MS) {
        pausedRef.current = true;
        setPaused(true);
        return;
      }
      router.refresh();
    }, seconds * 1000);

    return () => {
      clearInterval(id);
      EVENTS.forEach((e) => window.removeEventListener(e, resume, true));
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, seconds, resume]);

  if (!paused) return null;
  return (
    <p role="status" className="rounded-md border border-line bg-brand-soft p-2 text-xs">
      Pembaruan otomatis dihentikan karena tidak ada aktivitas. Gerakkan mouse atau tekan tombol apa saja untuk melanjutkan dan memuat pesan terbaru.
    </p>
  );
}
