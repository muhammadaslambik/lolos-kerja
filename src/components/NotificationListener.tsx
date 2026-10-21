"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { applicationId: string; title: string; subtitle: string; count: number; href: string };
type Summary = { total: number; inbox: string; items: Item[] };

const POLL_MS = 30_000; // jeda pengecekan pesan baru
const IDLE_MS = 10 * 60 * 1000; // berhenti mengecek setelah 10 menit tanpa aktivitas
const IDLE_GRANTED_MS = 3 * 60 * 60 * 1000; // batas lebih panjang bila notifikasi browser diaktifkan
const CACHE_KEY = "lk_notif";
const EVENTS = ["mousemove", "keydown", "click", "touchstart", "scroll"] as const;

const browserGranted = () => typeof Notification !== "undefined" && Notification.permission === "granted";

function ChatIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-2 shrink-0"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function NotificationListener() {
  const pathname = usePathname();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("unsupported");
  const prevTotal = useRef<number | null>(null);
  const lastActive = useRef(Date.now());
  const pausedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.status === 401) {
        setSummary(null);
        try {
          sessionStorage.removeItem(CACHE_KEY);
        } catch {
          // abaikan
        }
        return;
      }
      if (!res.ok) return;
      const data: Summary = await res.json();
      setSummary(data);
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch {
        // abaikan jika penyimpanan browser tidak tersedia
      }

      const base = document.title.replace(/^\(\d+\)\s*/, "");
      document.title = data.total > 0 ? `(${data.total}) ${base}` : base;

      const prev = prevTotal.current;
      prevTotal.current = data.total;
      if (prev !== null && data.total > prev) {
        const first = data.items[0];
        const text = first ? `Pesan baru dari ${first.title}` : "Ada pesan baru";
        setToast(text);
        setTimeout(() => setToast(""), 7000);
        if (browserGranted() && document.visibilityState === "hidden") {
          new Notification("Lolos Kerja", { body: text });
        }
      }
    } catch {
      // abaikan gangguan jaringan sesaat
    }
  }, []);

  // Saat dimuat: tampilkan data terakhir dari penyimpanan sementara agar tombol tidak berkedip antar halaman
  useEffect(() => {
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as Summary;
        setSummary(cached);
        prevTotal.current = cached.total;
      }
    } catch {
      // abaikan
    }
  }, []);

  // Cek saat pertama dibuka dan setiap berpindah halaman (agar angka langsung turun setelah pesan dibaca)
  useEffect(() => {
    void load();
  }, [pathname, load]);

  useEffect(() => {
    const resume = () => {
      lastActive.current = Date.now();
      if (pausedRef.current) {
        pausedRef.current = false;
        void load();
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") resume();
    };
    EVENTS.forEach((e) => window.addEventListener(e, resume, { passive: true, capture: true }));
    document.addEventListener("visibilitychange", onVisible);

    const id = setInterval(() => {
      const granted = browserGranted();
      if (document.visibilityState !== "visible" && !granted) return;
      if (pausedRef.current) return;
      if (Date.now() - lastActive.current > (granted ? IDLE_GRANTED_MS : IDLE_MS)) {
        pausedRef.current = true;
        return;
      }
      void load();
    }, POLL_MS);

    return () => {
      clearInterval(id);
      EVENTS.forEach((e) => window.removeEventListener(e, resume, true));
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  function enableBrowser() {
    if (typeof Notification === "undefined") return;
    void Notification.requestPermission().then((p) => setPerm(p));
  }

  if (!summary) return null;
  const total = summary.total;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {toast && (
        <div role="status" className="max-w-xs rounded-md border border-line bg-surface px-3 py-2 text-sm shadow-lg">
          {toast}
        </div>
      )}
      {open && (
        <div className="w-72 rounded-lg border border-line bg-surface p-3 text-sm shadow-xl">
          <p className="font-bold">Pesan</p>
          {summary.items.length === 0 ? (
            <p className="mt-2 text-xs text-ink/70">Tidak ada pesan baru.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {summary.items.map((i) => (
                <li key={i.applicationId}>
                  <Link href={i.href} onClick={() => setOpen(false)} className="block rounded-md border border-line p-2 hover:bg-brand-soft">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{i.title}</span>
                      <span className="tag">{i.count}</span>
                    </span>
                    {i.subtitle && <span className="block text-xs text-ink/70">{i.subtitle}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href={summary.inbox} onClick={() => setOpen(false)} className="mt-2 block text-xs underline">
            Lihat semua pesan
          </Link>
          {perm === "default" && (
            <button type="button" onClick={enableBrowser} className="btn btn-ghost mt-2 w-full !py-1 text-xs">
              Aktifkan notifikasi browser
            </button>
          )}
          {perm === "granted" && <p className="mt-2 text-xs text-ink/60">Notifikasi browser aktif.</p>}
          {perm === "denied" && (
            <p className="mt-2 text-xs text-ink/60">Notifikasi browser diblokir. Ubah izin situs di pengaturan browser untuk mengaktifkannya.</p>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={total > 0 ? `Pesan, ${total} belum dibaca` : "Pesan"}
        className="btn btn-primary inline-flex items-center !rounded-full !px-4 !py-2 text-sm"
      >
        <ChatIcon />
        Pesan
        {total > 0 && <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{total}</span>}
      </button>
    </div>
  );
}
