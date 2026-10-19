"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Memuat ulang data halaman secara berkala agar pesan baru muncul tanpa menekan refresh
export default function AutoRefresh({ seconds = 6 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
