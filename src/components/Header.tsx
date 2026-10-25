import Link from "next/link";
import { getSession } from "@/lib/session";
import { logout } from "@/app/actions/auth";
import { switchRole } from "@/app/actions/role";
import { db } from "@/lib/db";
import { dashboardPath } from "@/lib/constants";
import NavLinks, { type NavItem } from "./NavLinks";
import ThemeToggle from "./ThemeToggle";

export default async function Header() {
  const s = await getSession();
  const items: NavItem[] = [
    { href: "/", label: "Beranda" },
    { href: "/jobs", label: "Lowongan" },
    { href: "/courses", label: "Kelas" },
  ];
  if (s) items.push({ href: dashboardPath(s.role), label: "Dasbor" });

  // Tombol ganti peran: Pelamar boleh ke Perusahaan bila sudah punya perusahaan;
  // Perusahaan boleh ke Pelamar kapan saja. Admin tidak mendapat tombol ini.
  let switchTo: "SEEKER" | "EMPLOYER" | null = null;
  if (s?.role === "EMPLOYER") {
    switchTo = "SEEKER";
  } else if (s?.role === "SEEKER") {
    try {
      const member = await db.companyMember.findFirst({ where: { userId: s.uid }, select: { userId: true } });
      if (member) switchTo = "EMPLOYER";
    } catch {
      switchTo = null;
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 px-4">
        <Link href="/" className="py-3 text-lg font-extrabold text-brand-ink">Lolos Kerja</Link>
        <div className="order-last w-full md:order-none md:w-auto">
          <NavLinks items={items} />
        </div>
        <div className="ml-auto flex items-center gap-2 py-2">
          <ThemeToggle />
          {s ? (
            <>
              <span className="hidden text-sm text-ink/70 sm:inline">Halo, {s.name.split(" ")[0]}</span>
              {switchTo && (
                <form action={switchRole.bind(null, switchTo)}>
                  <button className="btn btn-ghost">
                    {switchTo === "EMPLOYER" ? "Ganti ke Perusahaan" : "Ganti ke Pelamar"}
                  </button>
                </form>
              )}
              <form action={logout}>
                <button className="btn btn-ghost">Keluar</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Masuk</Link>
              <Link href="/register" className="btn btn-primary">Daftar</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
