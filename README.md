# Lolos Kerja

Platform pelatihan kerja, lowongan, dan penghubung perusahaan dengan pelamar di Indonesia.

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma, PostgreSQL

## Yang sudah berfungsi (MVP awal)
- Landing page, pencarian lowongan (kota, tipe, gaji), detail lowongan + JSON-LD `JobPosting`
- One-click apply dengan skor kecocokan otomatis (`src/lib/screening.ts`)
- Dashboard pelamar (progres kelas, status lamaran)
- Dashboard perusahaan: papan tahap pelamar (Applied sampai Hired) dengan riwayat perubahan
- Dashboard admin: statistik dan verifikasi perusahaan
- Skema database lengkap (user, perusahaan, lowongan, lamaran, kelas, modul, kuis, sertifikat, order)

## Belum dibuat (urutan pengerjaan disarankan)
1. Login nyata (Auth.js / Clerk). Saat ini `src/lib/demo-user.ts` memakai pengguna contoh dari seed.
2. Pendaftaran kelas, pemutar materi, kuis, sertifikat PDF
3. Form pasang lowongan dan upload dokumen NIB/NPWP (Cloudflare R2 / S3)
4. AI Resume Builder (Claude API) dan skor ATS
5. Talent Pool, pembayaran (Midtrans / Xendit), notifikasi email/WhatsApp
6. Drag-and-drop kanban (`dnd-kit`)

> Penting: sebelum rilis publik, **aktifkan autentikasi** dan lindungi semua route `/dashboard/*` serta server action.

## Menjalankan di komputer
Prasyarat: Node.js 20+, Docker (atau PostgreSQL lokal).

```bash
npm install
cp .env.example .env       # Windows: copy .env.example .env
npm run db:up              # menyalakan PostgreSQL via Docker
npm run db:push            # membuat tabel
npm run db:seed            # data contoh
npm run dev                # http://localhost:3000
```

## Deploy gratis
Lihat **PANDUAN-GRATIS.md** (Vercel + Neon, tanpa kartu, jalan terus saat laptop mati).

## Deploy (ringkas)
1. Push ke GitHub (langkah di bawah).
2. Buat database PostgreSQL terkelola (Neon / Supabase / Railway).
3. Import repo di Vercel, isi `DATABASE_URL`, lalu deploy.
4. Dari komputer, jalankan sekali: `DATABASE_URL="..." npx prisma db push` (seed hanya untuk demo).

## Push ke GitHub
```bash
git init
git add .
git commit -m "feat: initial commit Lolos Kerja"
git branch -M main
git remote add origin https://github.com/USERNAME/lolos-kerja.git
git push -u origin main
```

## Struktur
```
prisma/            skema dan seed
src/app/           halaman dan API route
src/components/    komponen UI
src/lib/           db, screening, konstanta
.github/workflows/ CI (typecheck, lint, build)
```
