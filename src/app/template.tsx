import type { ReactNode } from "react";
import { getSession } from "@/lib/session";
import NotificationListener from "@/components/NotificationListener";

// Tombol Pesan tampil di semua halaman website bagi pelamar dan perusahaan yang sedang masuk
export default async function Template({ children }: { children: ReactNode }) {
  const s = await getSession();
  const show = !!s && (s.role === "SEEKER" || s.role === "EMPLOYER");
  return (
    <>
      {children}
      {show && <NotificationListener />}
    </>
  );
}
