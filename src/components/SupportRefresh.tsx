"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Memuat ulang halaman percakapan secara berkala agar pesan baru muncul tanpa menekan refresh
export default function SupportRefresh({ seconds = 8 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
