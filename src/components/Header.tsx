import Link from "next/link";
const links = [
  { href: "/jobs", label: "Lowongan" },
  { href: "/courses", label: "Kelas" },
  { href: "/dashboard/seeker", label: "Pelamar" },
  { href: "/dashboard/employer", label: "Perusahaan" },
  { href: "/dashboard/admin", label: "Admin" },
];
export default function Header() {
  return (
    <header className="border-b border-line bg-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="mr-auto text-lg font-extrabold text-brand">Lolos Kerja</Link>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm font-medium hover:text-brand">{l.label}</Link>
        ))}
      </nav>
    </header>
  );
}
