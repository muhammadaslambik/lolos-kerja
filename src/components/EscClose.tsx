"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Menutup jendela CV saat tombol Escape ditekan
export default function EscClose({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push(href, { scroll: false });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, href]);
  return null;
}
