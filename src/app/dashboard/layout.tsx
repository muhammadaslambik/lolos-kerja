import type { ReactNode } from "react";
import { getSession } from "@/lib/session";
import NotificationListener from "@/components/NotificationListener";

// Tombol notifikasi pesan tampil di semua halaman dasbor pelamar dan perusahaan
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const s = await getSession();
  const show = !!s && (s.role === "SEEKER" || s.role === "EMPLOYER");
  return (
    <>
      {children}
      {show && <NotificationListener />}
    </>
  );
}
