"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

export default function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const matches = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  // Bila beberapa menu cocok (misalnya Dasbor dan Profil perusahaan), hanya yang alamatnya paling spesifik yang aktif
  const best = items
    .filter((i) => matches(i.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <ul className="flex items-stretch gap-1 overflow-x-auto">
      {items.map((item) => {
        const active = item.href === best;
        return (
          <li key={item.href} className="flex">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-t-md px-3 py-3 text-sm font-semibold transition-colors ${
                active ? "bg-brand-soft/70 text-brand-ink" : "text-ink/75 hover:bg-brand-soft/40 hover:text-ink"
              }`}
            >
              {item.href === "/" && (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 11l9-8 9 8M5 10v10h14V10" />
                </svg>
              )}
              {item.label}
              <span
                aria-hidden="true"
                className={`absolute inset-x-2 bottom-0 h-[3px] origin-left rounded-t-full bg-gradient-to-r from-brand to-sun transition-transform duration-300 ${
                  active ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
