"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Mengunci scroll halaman di belakang jendela dan menutup jendela dengan tombol Escape
export default function ModalBehavior({ closeHref }: { closeHref: string }) {
  const router = useRouter();
  useEffect(() => {
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push(closeHref, { scroll: false });
    };
    window.addEventListener("keydown", onKey);
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
      window.removeEventListener("keydown", onKey);
    };
  }, [router, closeHref]);
  return null;
}
