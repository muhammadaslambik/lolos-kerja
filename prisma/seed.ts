import { Prisma, PrismaClient } from "@prisma/client";
const db = new PrismaClient();

type ExtraModule = { title: string; sortOrder: number; lessons: { title: string; content: string }[] };

const intro: Record<string, string> = {
  "excel-untuk-admin":
    "Selamat datang di kelas Excel untuk Admin Perkantoran.\n\nDi kelas ini Anda belajar hal-hal yang paling sering dipakai di pekerjaan administrasi: rumus dasar, mencari data, dan merapikan tabel. Setiap pelajaran singkat dan bisa langsung dipraktikkan di Excel Anda sendiri.\n\nSiapkan satu file Excel kosong, lalu lanjut ke pelajaran berikutnya.",
  "dasar-digital-marketing":
    "Selamat datang di kelas Dasar Digital Marketing.\n\nDi kelas ini Anda mengenal cara menentukan target pasar, membuat rencana konten media sosial, dan membaca angka hasilnya. Tidak perlu pengalaman sebelumnya.\n\nLanjut ke pelajaran berikutnya untuk memulai.",
};

const extra: Record<string, ExtraModule[]> = {
  "excel-untuk-admin": [
    {
      title: "Rumus Dasar",
      sortOrder: 2,
      lessons: [
        {
          title: "Menjumlah dan menghitung rata-rata",
          content:
            "Tiga rumus yang paling sering dipakai adalah SUM untuk menjumlah, AVERAGE untuk rata-rata, dan COUNT untuk menghitung banyaknya angka.\n\nContoh: untuk menjumlah angka di sel B2 sampai B10, ketik =SUM(B2:B10) lalu tekan Enter. Untuk rata-rata, ketik =AVERAGE(B2:B10).\n\nCatatan: pada sebagian komputer berpengaturan wilayah Indonesia, pemisah antar-argumen rumus berupa titik koma (;) dan bukan koma (,). Jika rumus Anda ditolak, coba ganti pemisahnya.\n\nLatihan: buat daftar lima angka, lalu hitung jumlah dan rata-ratanya.",
        },
        {
          title: "Mencari data dengan VLOOKUP",
          content:
            "VLOOKUP dipakai untuk mencari satu nilai di kolom paling kiri sebuah tabel, lalu mengambil data dari kolom lain pada baris yang sama.\n\nBentuknya: VLOOKUP(nilai yang dicari, tabel, nomor kolom, FALSE). Isi FALSE agar Excel hanya mencari yang persis sama.\n\nContoh: tabel produk berada di A2:C20 dengan kode di kolom A dan harga di kolom C. Untuk mengambil harga dari kode yang tertulis di E2, ketik =VLOOKUP(E2,A2:C20,3,FALSE).\n\nExcel versi terbaru juga punya XLOOKUP yang lebih fleksibel, tetapi VLOOKUP masih banyak dipakai di kantor.",
        },
      ],
    },
    {
      title: "Merapikan Data",
      sortOrder: 3,
      lessons: [
        {
          title: "Format tabel dan filter",
          content:
            "Data yang rapi lebih mudah dibaca dan dicari. Klik salah satu sel di data Anda, lalu tekan Ctrl + T untuk mengubahnya menjadi tabel. Centang pilihan bahwa tabel memiliki judul kolom.\n\nTabel otomatis mendapat tombol filter di setiap judul kolom. Klik tanda panah kecil itu untuk menampilkan hanya baris yang Anda perlukan.\n\nAgar judul kolom tetap terlihat saat menggulir ke bawah, buka tab View, pilih Freeze Panes, lalu Freeze Top Row.",
        },
        {
          title: "Mengurutkan dan menghapus duplikat",
          content:
            "Untuk mengurutkan, pilih sel di kolom yang ingin diurutkan, buka tab Data, lalu klik Sort A to Z atau Sort Z to A.\n\nUntuk menghapus data ganda, pilih seluruh data, buka tab Data, lalu klik Remove Duplicates. Pilih kolom yang dipakai sebagai patokan data ganda, lalu klik OK.\n\nTips: simpan salinan file sebelum menghapus duplikat, karena baris yang terhapus tidak otomatis kembali.",
        },
      ],
    },
  ],
  "dasar-digital-marketing": [
    {
      title: "Konten Media Sosial",
      sortOrder: 2,
      lessons: [
        {
          title: "Mengenal target pasar",
          content:
            "Sebelum membuat konten, tentukan dulu siapa yang ingin dijangkau. Tulis ciri-ciri targetnya: usia, kota, kebutuhan, dan masalah yang ingin mereka selesaikan.\n\nContoh: toko kue rumahan di Semarang yang menyasar ibu pekerja usia 25 sampai 40 tahun yang butuh kue pesanan untuk acara keluarga.\n\nSemakin jelas targetnya, semakin mudah menentukan gaya bahasa, jenis foto, dan waktu unggah yang cocok.\n\nLatihan: tulis target pasar usaha atau produk yang Anda kenal dalam tiga kalimat.",
        },
        {
          title: "Merencanakan kalender konten",
          content:
            "Kalender konten adalah jadwal unggahan yang dibuat di awal, misalnya untuk satu bulan. Dengan jadwal, Anda tidak kehabisan ide dan akun tetap aktif.\n\nLangkah sederhana: pilih dua atau tiga topik tetap, misalnya tips, produk, dan cerita pelanggan. Bagi topik itu ke hari-hari unggah, misalnya tiga kali seminggu.\n\nCatat tanggal, topik, teks, dan gambar yang dibutuhkan di satu tabel. Lembar kerja biasa sudah cukup.",
        },
      ],
    },
    {
      title: "Mengukur Hasil",
      sortOrder: 3,
      lessons: [
        {
          title: "Metrik dasar",
          content:
            "Beberapa angka dasar yang perlu dikenal:\n\nJangkauan (reach) adalah jumlah akun berbeda yang melihat konten Anda. Tayangan (impressions) adalah berapa kali konten tampil, termasuk tampil berulang pada akun yang sama.\n\nKeterlibatan (engagement) mencakup suka, komentar, bagikan, dan simpan. Rasio klik (CTR) adalah persentase orang yang mengklik tautan dari total yang melihatnya. Konversi adalah orang yang melakukan tindakan akhir, misalnya membeli atau mendaftar.\n\nAngka-angka ini membantu Anda tahu konten mana yang perlu diulang dan mana yang perlu diperbaiki.",
        },
        {
          title: "Membaca laporan sederhana",
          content:
            "Laporan sederhana cukup berisi periode, jumlah unggahan, jangkauan, keterlibatan, dan hasil akhir seperti pesanan atau pendaftar.\n\nBandingkan dengan periode sebelumnya, bukan hanya melihat angka tunggal. Angka 500 jangkauan terasa kecil, tetapi bagus jika bulan lalu hanya 200.\n\nAkhiri laporan dengan satu kesimpulan dan satu tindakan, misalnya: video pendek mendapat keterlibatan tertinggi, maka bulan depan tambah video pendek.",
        },
      ],
    },
  ],
};

type Q = { q: string; options: string[]; answerIdx: number; explanation: string };

const quizzes: Record<string, Record<string, Q[]>> = {
  "excel-untuk-admin": {
    "Rumus Dasar": [
      { q: "Rumus mana yang menjumlah angka di sel B2 sampai B10?", options: ["=TOTAL(B2:B10)", "=SUM(B2:B10)", "=ADD(B2:B10)", "=COUNT(B2:B10)"], answerIdx: 1, explanation: "SUM adalah rumus untuk menjumlah. COUNT hanya menghitung banyaknya angka." },
      { q: "Apa arti FALSE di rumus VLOOKUP?", options: ["Mencari nilai yang mendekati", "Mengurutkan data", "Hanya mencari nilai yang persis sama", "Menghapus data yang tidak ketemu"], answerIdx: 2, explanation: "FALSE membuat Excel hanya mencari nilai yang persis sama." },
      { q: "Rumus ditolak pada komputer berpengaturan wilayah Indonesia. Apa yang sebaiknya dicoba?", options: ["Mengganti koma dengan titik koma", "Menghapus tanda sama dengan", "Menulis rumus dengan huruf kecil semua", "Menghapus kolom"], answerIdx: 0, explanation: "Pada sebagian pengaturan wilayah, pemisah antar-argumen adalah titik koma." },
    ],
    "Merapikan Data": [
      { q: "Pintasan keyboard untuk mengubah data menjadi tabel adalah...", options: ["Ctrl + P", "Ctrl + S", "Ctrl + T", "Ctrl + Z"], answerIdx: 2, explanation: "Ctrl + T membuat tabel dari data yang dipilih." },
      { q: "Apa yang sebaiknya dilakukan sebelum memakai Remove Duplicates?", options: ["Menutup Excel", "Menyimpan salinan file", "Menghapus judul kolom", "Mengganti nama sheet"], answerIdx: 1, explanation: "Baris yang terhapus tidak otomatis kembali, jadi simpan salinan lebih dulu." },
    ],
  },
  "dasar-digital-marketing": {
    "Konten Media Sosial": [
      { q: "Apa yang sebaiknya ditentukan sebelum membuat konten?", options: ["Warna logo", "Target pasar", "Jumlah pengikut pesaing", "Nama hashtag"], answerIdx: 1, explanation: "Target pasar yang jelas memudahkan memilih gaya bahasa dan jenis konten." },
      { q: "Apa yang dimaksud kalender konten?", options: ["Daftar hari libur nasional", "Laporan penjualan bulanan", "Jadwal unggahan yang dibuat di awal", "Daftar pelanggan"], answerIdx: 2, explanation: "Kalender konten adalah jadwal unggahan yang direncanakan lebih dulu." },
    ],
    "Mengukur Hasil": [
      { q: "Jangkauan (reach) adalah...", options: ["Jumlah akun berbeda yang melihat konten", "Jumlah komentar", "Jumlah pembelian", "Jumlah unggahan dalam sebulan"], answerIdx: 0, explanation: "Reach menghitung akun yang berbeda, bukan berapa kali konten tampil." },
      { q: "Konversi berarti...", options: ["Orang menyukai unggahan", "Orang melakukan tindakan akhir seperti membeli atau mendaftar", "Orang mengikuti akun", "Orang menyimpan unggahan"], answerIdx: 1, explanation: "Konversi adalah tindakan akhir yang diharapkan dari audiens." },
      { q: "Agar angka laporan lebih bermakna, sebaiknya dibandingkan dengan...", options: ["Akun pesaing yang paling besar", "Periode sebelumnya", "Angka tahun lalu saja", "Jumlah pengikut"], answerIdx: 1, explanation: "Membandingkan dengan periode sebelumnya menunjukkan naik atau turunnya hasil." },
    ],
  },
};

async function main() {
  await db.user.upsert({ where: { email: "admin@loloskerja.id" }, update: {}, create: { email: "admin@loloskerja.id", fullName: "Admin Lolos Kerja", role: "ADMIN" } });
  const seeker = await db.user.upsert({
    where: { email: "rina@example.com" }, update: {},
    create: { email: "rina@example.com", fullName: "Rina Pratiwi", role: "SEEKER",
      profile: { create: { headline: "Fresh graduate Manajemen", city: "Semarang", educationLevel: "S1", experienceYears: 1, skills: ["excel", "komunikasi", "administrasi"], talentVisible: true } },
      resumes: { create: { title: "CV Utama", isPrimary: true, content: {} } } },
  });
  const employer = await db.user.upsert({ where: { email: "hrd@majujaya.co.id" }, update: {}, create: { email: "hrd@majujaya.co.id", fullName: "HRD Maju Jaya", role: "EMPLOYER" } });
  const company = await db.company.upsert({
    where: { slug: "pt-maju-jaya" }, update: {},
    create: { name: "PT Maju Jaya", slug: "pt-maju-jaya", industry: "Distribusi", city: "Semarang", verification: "VERIFIED",
      members: { create: { userId: employer.id, memberRole: "owner" } } },
  });
  const jobs = [
    { title: "Staff Administrasi", slug: "staff-administrasi-maju-jaya", jobType: "FULL_TIME" as const, city: "Semarang", salaryMin: 4000000, salaryMax: 5000000, minEducation: "S1", minExperienceYears: 0, requiredSkills: ["excel", "administrasi"] },
    { title: "Customer Service", slug: "customer-service-maju-jaya", jobType: "FULL_TIME" as const, city: "Semarang", salaryMin: 3800000, salaryMax: 4800000, minEducation: "D3", minExperienceYears: 1, requiredSkills: ["komunikasi"] },
    { title: "Magang Digital Marketing", slug: "magang-digital-marketing", jobType: "INTERNSHIP" as const, city: "Remote", salaryMin: 1500000, salaryMax: 2000000, minEducation: "SMA", minExperienceYears: 0, requiredSkills: ["konten", "canva"] },
  ];
  for (const j of jobs) {
    await db.job.upsert({ where: { slug: j.slug }, update: {}, create: { ...j, companyId: company.id, status: "ACTIVE", description: `Kami membuka posisi ${j.title}. Bergabunglah dengan tim yang suportif dan berkembang bersama.`, requirements: "Teliti, mau belajar, dan dapat bekerja dalam tim." } });
  }
  const courses = [
    { title: "Excel untuk Admin Perkantoran", slug: "excel-untuk-admin", category: "Administrasi", price: 0 },
    { title: "Dasar Digital Marketing", slug: "dasar-digital-marketing", category: "Pemasaran", price: 99000 },
  ];
  for (const c of courses) {
    await db.course.upsert({ where: { slug: c.slug }, update: {}, create: { ...c, published: true, description: "Belajar langkah demi langkah, lengkap dengan kuis dan sertifikat digital.",
      modules: { create: [{ title: "Pengenalan", sortOrder: 1, lessons: { create: [{ title: "Mulai dari sini", type: "text", content: "Materi pengantar.", sortOrder: 1 }] } }] } } });
  }

  // Isi materi kelas. Aman dijalankan berulang: modul yang sudah ada dilewati.
  for (const [slug, text] of Object.entries(intro)) {
    const course = await db.course.findUnique({ where: { slug } });
    if (!course) continue;
    await db.lesson.updateMany({
      where: { title: "Mulai dari sini", content: "Materi pengantar.", module: { courseId: course.id } },
      data: { content: text },
    });
  }
  for (const [slug, mods] of Object.entries(extra)) {
    const course = await db.course.findUnique({ where: { slug } });
    if (!course) continue;
    for (const m of mods) {
      const exists = await db.module.findFirst({ where: { courseId: course.id, title: m.title } });
      if (exists) continue;
      await db.module.create({
        data: {
          courseId: course.id,
          title: m.title,
          sortOrder: m.sortOrder,
          lessons: { create: m.lessons.map((l, i) => ({ title: l.title, type: "text", content: l.content, sortOrder: i + 1 })) },
        },
      });
    }
  }

  // Soal kuis. Aman dijalankan berulang: modul yang sudah punya kuis dilewati.
  for (const [slug, byModule] of Object.entries(quizzes)) {
    const course = await db.course.findUnique({ where: { slug } });
    if (!course) continue;
    for (const [title, questions] of Object.entries(byModule)) {
      const mod = await db.module.findFirst({ where: { courseId: course.id, title } });
      if (!mod) continue;
      const has = await db.quiz.findFirst({ where: { moduleId: mod.id } });
      if (has) continue;
      await db.quiz.create({ data: { moduleId: mod.id, questions: questions as unknown as Prisma.InputJsonValue } });
    }
  }

  const first = await db.course.findUnique({ where: { slug: "excel-untuk-admin" } });
  if (first) await db.enrollment.upsert({ where: { userId_courseId: { userId: seeker.id, courseId: first.id } }, update: {}, create: { userId: seeker.id, courseId: first.id, progressPct: 40 } });
  console.log("Seed selesai.");
}
main().finally(() => db.$disconnect());
