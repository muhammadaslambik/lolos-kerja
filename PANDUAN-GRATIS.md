# Deploy Gratis, Tanpa Kartu, Tetap Hidup Saat Laptop Mati

Semua langkah dilakukan lewat browser. Laptop hanya dipakai untuk mengunggah kode, setelah itu boleh dimatikan.

| Bagian | Layanan | Kartu kredit |
|---|---|---|
| Kode | GitHub | Tidak perlu |
| Website | Vercel (paket Hobby) | Tidak perlu |
| Database | Neon (paket Free) | Tidak perlu |

## Langkah 1. Unggah kode ke GitHub
1. Buat akun di github.com, lalu klik **New repository**, beri nama `lolos-kerja`, pilih Private atau Public, jangan centang opsi README.
2. Di terminal VS Code pada folder proyek:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/lolos-kerja.git
   git push -u origin main
   ```

## Langkah 2. Buat database di Neon
1. Daftar di neon.com (bisa dengan akun GitHub), buat project baru, pilih region **Singapore** (terdekat dengan Indonesia).
2. Di dashboard Neon klik **Connect**. Salin dua string:
   - **Pooled connection**: untuk `DATABASE_URL`
   - **Direct connection** (tanpa `-pooler`): untuk `DIRECT_URL`

## Langkah 3. Isi tabel database (tanpa laptop)
1. Di GitHub, buka repo, lalu **Settings > Secrets and variables > Actions > New repository secret**.
2. Nama `DATABASE_URL`, nilai: string **Direct** dari Neon.
3. Buka tab **Actions > Setup Database > Run workflow**. Biarkan "seed" tercentang untuk data contoh. Tunggu hingga hijau.

## Langkah 4. Deploy ke Vercel
1. Daftar di vercel.com dengan akun GitHub, klik **Add New > Project**, pilih repo `lolos-kerja`.
2. Buka **Environment Variables** dan isi:
   - `DATABASE_URL`: string Pooled
   - `DIRECT_URL`: string Direct
   - `ADMIN_USER`: misalnya `admin`
   - `ADMIN_PASSWORD`: kata sandi panjang buatan Anda
3. Klik **Deploy**. Hasilnya: `https://lolos-kerja-xxxx.vercel.app`, aktif 24 jam walau laptop mati. Setiap `git push` ke `main` otomatis memperbarui website.
4. Di Vercel, buka **Settings > Functions**, lalu atur region ke Singapore (`sin1`) bila tersedia agar lebih cepat.

## Batasan paket gratis yang perlu Anda tahu
- **Vercel Hobby hanya untuk penggunaan non-komersial.** Cocok untuk portofolio, demo, dan uji coba. Begitu website menerima pembayaran atau iklan, Vercel mewajibkan paket Pro (sekitar US$20 per bulan). Alternatif untuk tahap komersial: Netlify atau Cloudflare, atau tetap Vercel Pro.
- **Neon Free:** 0,5 GB per project dan 100 jam komputasi per bulan. Database tidur setelah 5 menit tanpa akses, jadi permintaan pertama bisa terasa lambat beberapa detik.
- Batas gratis bisa berubah. Cek halaman harga masing-masing layanan sebelum peluncuran.
- Alamat `*.vercel.app` gratis. Domain sendiri (misalnya `.id`) berbayar di registrar.

## Keamanan sebelum dibagikan ke publik
- Dashboard admin dan perusahaan sudah dilindungi kata sandi (Basic Auth). Dashboard pelamar dan tombol "Lamar" masih memakai pengguna contoh, sehingga cocok untuk **demo**, bukan untuk data pelamar sungguhan.
- Untuk menerima pengguna nyata, pasang login (Auth.js atau Clerk, keduanya punya paket gratis) dan patuhi UU PDP.
