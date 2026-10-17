import Link from "next/link";
import { getSession } from "@/lib/session";
import { logout } from "@/app/actions/auth";
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
