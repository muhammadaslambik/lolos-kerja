import type { Metadata } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: { default: "Lolos Kerja", template: "%s | Lolos Kerja" },
  description: "Belajar skill, bangun CV, dan lamar kerja di satu tempat.",
};

// Dijalankan sebelum halaman tampil agar tidak berkedip saat mode gelap dipakai.
const themeScript = `(function(){try{var t=localStorage.getItem('lk-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${jakarta.variable} font-sans`}>
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-line py-6 text-center text-sm text-ink/60">
          <nav aria-label="Tautan hukum" className="mb-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/kebijakan-privasi" className="underline hover:text-ink">Kebijakan Privasi</Link>
            <Link href="/syarat-ketentuan" className="underline hover:text-ink">Syarat &amp; Ketentuan</Link>
          </nav>
          <p>© {new Date().getFullYear()} Lolos Kerja</p>
        </footer>
      </body>
    </html>
  );
}
