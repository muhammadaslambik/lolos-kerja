import type { ReactNode } from "react";

// Tombol Pesan kini dipasang untuk seluruh website di src/app/template.tsx, jadi layout ini hanya meneruskan isi halaman
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
