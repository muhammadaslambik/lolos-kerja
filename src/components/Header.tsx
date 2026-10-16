import Link from "next/link";

const links = [
  { href: "/jobs", label: "Lowongan", protectedArea: false },
  { href: "/courses", label: "Kelas", protectedArea: false },
  { href: "/dashboard/seeker", label: "Pelamar", protectedArea: false },
  { href: "/dashboard/employer", label: "Perusahaan", protectedArea: true },
  { href: "/dashboard/admin", label: "Admin", protectedArea: true },
];

export default function Header() {
  return (
    <header className="border-b border-line bg-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="mr-auto text-lg font-extrabold text-brand">
          Lolos Kerja
        </Link>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            prefetch={l.protectedArea ? false : undefined}
            className="text-sm font-medium hover:text-brand"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}