import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Cara Lolos Kerja mengumpulkan, menggunakan, dan melindungi data pribadi pelamar dan perusahaan.",
};

// Isi alamat email kontak privasi di sini (tampil di bagian "Kontak").
// Contoh: const CONTACT_EMAIL = "privasi@loloskerja.eu.org";
const CONTACT_EMAIL = "";

const UPDATED = "25 Oktober 2026";

const H2 = "mt-10 text-xl font-bold text-brand-ink";
const P = "mt-3 leading-relaxed text-ink/80";
const UL = "mt-3 list-disc space-y-1.5 pl-6 text-ink/80";

export default function KebijakanPrivasiPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-ink">Kebijakan Privasi</h1>
      <p className="mt-2 text-sm text-ink/60">Terakhir diperbarui: {UPDATED}</p>

      <p className={P}>
        Lolos Kerja adalah platform yang mempertemukan pencari kerja dengan perusahaan, dilengkapi pembuat CV,
        kelas belajar, pesan, dan panggilan. Halaman ini menjelaskan data pribadi apa yang kami proses, untuk apa,
        dan hak Anda atasnya, sesuai Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
        Dengan memakai Lolos Kerja, Anda menyatakan telah membaca kebijakan ini.
      </p>

      <h2 className={H2}>1. Data yang kami kumpulkan</h2>
      <p className={P}>Semua pengguna:</p>
      <ul className={UL}>
        <li>Nama lengkap dan alamat email.</li>
        <li>Kata sandi, bila Anda mendaftar dengan email. Kata sandi disimpan dalam bentuk hash, bukan teks asli.</li>
        <li>Data akun dari Google bila Anda masuk dengan Google (lihat bagian 3).</li>
        <li>Pesan, pesan suara, dan catatan panggilan yang Anda kirim di dalam platform.</li>
        <li>Riwayat pesanan dan pembayaran kelas (tanpa nomor kartu).</li>
        <li>Data teknis untuk keamanan, misalnya pembatasan percobaan masuk yang gagal.</li>
      </ul>
      <p className={P}>Pelamar, tambahan yang Anda isi sendiri:</p>
      <ul className={UL}>
        <li>Profil: headline, kota, pendidikan terakhir, lama pengalaman, keahlian, dan gaji yang diharapkan.</li>
        <li>CV dan isinya (ringkasan, pengalaman, pendidikan, keahlian), serta skor kesesuaian CV.</li>
        <li>Riwayat lamaran, tahap seleksi, dan kemajuan belajar di kelas.</li>
      </ul>
      <p className={P}>Perusahaan, tambahan yang Anda isi sendiri:</p>
      <ul className={UL}>
        <li>Nama perusahaan, industri, kota, situs web, dan deskripsi.</li>
        <li>Dokumen verifikasi badan usaha seperti NIB dan NPWP, bila Anda mengisinya.</li>
        <li>Lowongan yang dipasang dan undangan yang dikirim ke pelamar.</li>
      </ul>

      <h2 className={H2}>2. Untuk apa data dipakai</h2>
      <ul className={UL}>
        <li>Membuat dan menjalankan akun Anda, serta menjaga keamanannya.</li>
        <li>Memproses lamaran, menghitung kecocokan, dan mempertemukan pelamar dengan lowongan.</li>
        <li>Memungkinkan komunikasi antara pelamar dan perusahaan lewat pesan dan panggilan.</li>
        <li>Memverifikasi perusahaan agar lowongan yang tampil lebih tepercaya.</li>
        <li>Menyediakan kelas, progres belajar, dan sertifikat.</li>
        <li>Mengirim pemberitahuan layanan, misalnya pesan baru.</li>
        <li>Mencegah penyalahgunaan dan memenuhi kewajiban hukum.</li>
      </ul>
      <p className={P}>Kami tidak menjual data pribadi Anda.</p>

      <h2 className={H2}>3. Masuk dengan Google</h2>
      <p className={P}>
        Bila Anda memilih masuk atau mendaftar dengan Google, kami menerima alamat email, nama, dan status
        verifikasi email dari akun Google Anda. Kami hanya memakainya untuk membuat atau mencocokkan akun Lolos Kerja
        Anda. Kami tidak membaca email, kontak, berkas Drive, atau data Google lain.
      </p>
      <p className={P}>
        Penggunaan dan pengalihan informasi yang diterima dari Google oleh Lolos Kerja mematuhi Kebijakan Data
        Pengguna Layanan Google API, termasuk persyaratan Penggunaan Terbatas.
      </p>
      <p className={P}>
        Satu alamat email dapat dipakai untuk dua peran, yaitu Pelamar dan Perusahaan, dalam satu akun. Anda dapat
        berpindah peran dari menu di bagian atas halaman.
      </p>

      <h2 className={H2}>4. Dengan siapa data dibagikan</h2>
      <ul className={UL}>
        <li>
          <strong>Perusahaan yang Anda lamar:</strong> saat Anda melamar, perusahaan tersebut dapat melihat profil,
          CV yang Anda pilih, dan pesan Anda dengan mereka.
        </li>
        <li>
          <strong>Perusahaan di Talent Pool:</strong> hanya bila Anda mengaktifkan persetujuan (bagian 5).
        </li>
        <li>
          <strong>Penyedia layanan teknis:</strong> hosting aplikasi (Vercel), basis data (Neon, PostgreSQL), layanan
          masuk Google, dan layanan panggilan video Jitsi. Mereka memproses data hanya untuk menjalankan layanan
          kami.
        </li>
        <li>
          <strong>Penyedia pembayaran:</strong> bila Anda membeli layanan berbayar, pembayaran diproses oleh penyedia
          pembayaran. Kami tidak menyimpan nomor kartu Anda.
        </li>
        <li>
          <strong>Pihak berwenang:</strong> bila diwajibkan oleh hukum atau perintah yang sah.
        </li>
        <li>
          <strong>Administrator Lolos Kerja:</strong> untuk memverifikasi perusahaan, moderasi lowongan, dan
          menangani laporan penyalahgunaan.
        </li>
      </ul>

      <h2 className={H2}>5. Talent Pool dan persetujuan Anda</h2>
      <p className={P}>
        Profil Anda tidak tampil di Talent Pool secara bawaan. Profil hanya dapat ditemukan perusahaan terverifikasi
        bila Anda menyetujuinya, dan Anda dapat mencabut persetujuan itu kapan saja dari halaman profil. Setelah
        dicabut, profil Anda tidak lagi muncul untuk pencarian baru. Undangan yang sudah terkirim tetap tercatat.
      </p>

      <h2 className={H2}>6. Pesan, pesan suara, dan panggilan</h2>
      <p className={P}>
        Pesan teks dan pesan suara disimpan agar percakapan dapat dibaca kembali oleh pihak yang terlibat. Panggilan
        suara dan video berjalan lewat layanan Jitsi di dalam halaman website. Lolos Kerja tidak merekam panggilan.
        Jangan membagikan data yang sangat sensitif (misalnya nomor kartu atau kata sandi) lewat pesan.
      </p>

      <h2 className={H2}>7. Cookie dan penyimpanan di perangkat</h2>
      <ul className={UL}>
        <li>Cookie sesi untuk menjaga Anda tetap masuk (berlaku sekitar 7 hari). Cookie ini tidak bisa dibaca oleh skrip halaman.</li>
        <li>Cookie sementara saat proses masuk dengan Google, dihapus setelah proses selesai.</li>
        <li>Preferensi tampilan, misalnya tema terang atau gelap, di perangkat Anda.</li>
        <li>Notifikasi browser, hanya bila Anda mengizinkannya. Anda dapat mencabut izin di pengaturan browser.</li>
      </ul>
      <p className={P}>Kami tidak memakai cookie iklan pihak ketiga.</p>

      <h2 className={H2}>8. Penyimpanan dan keamanan</h2>
      <p className={P}>
        Data disimpan selama akun Anda aktif dan selama diperlukan untuk tujuan di atas atau diwajibkan hukum.
        Setelah Anda meminta penghapusan akun, data pribadi Anda dihapus atau dianonimkan, kecuali data yang wajib
        kami simpan menurut hukum. Kami menggunakan koneksi terenkripsi (HTTPS), menyimpan kata sandi dalam bentuk
        hash, dan membatasi akses ke data. Tidak ada sistem yang sepenuhnya bebas risiko. Bila terjadi kegagalan
        pelindungan data pribadi, kami akan memberitahu Anda dan pihak berwenang sesuai batas waktu yang ditetapkan
        UU PDP.
      </p>

      <h2 className={H2}>9. Hak Anda</h2>
      <p className={P}>Menurut UU PDP, Anda berhak untuk:</p>
      <ul className={UL}>
        <li>Mengetahui dan mengakses data pribadi Anda yang kami proses.</li>
        <li>Memperbarui atau memperbaiki data yang tidak akurat.</li>
        <li>Meminta penghapusan data dan akun Anda.</li>
        <li>Menarik persetujuan yang pernah diberikan, termasuk persetujuan Talent Pool.</li>
        <li>Mengajukan keberatan atas pemrosesan tertentu dan meminta salinan data Anda.</li>
      </ul>
      <p className={P}>
        Sebagian besar data profil dan CV dapat Anda ubah sendiri dari dasbor. Untuk permintaan lain, hubungi kami
        lewat kontak di bawah. Kami akan menanggapi dalam waktu yang wajar.
      </p>

      <h2 className={H2}>10. Anak-anak</h2>
      <p className={P}>
        Lolos Kerja tidak ditujukan bagi anak di bawah 17 tahun. Bila Anda mengetahui ada anak yang mendaftar tanpa
        pendampingan orang tua atau wali, beritahu kami agar akunnya kami tinjau.
      </p>

      <h2 className={H2}>11. Perubahan kebijakan</h2>
      <p className={P}>
        Kami dapat memperbarui kebijakan ini. Tanggal pembaruan terakhir selalu tertera di bagian atas halaman. Untuk
        perubahan yang penting, kami akan memberi tahu Anda lewat platform.
      </p>

      <h2 className={H2}>12. Kontak</h2>
      <p className={P}>
        Pertanyaan atau permintaan terkait data pribadi dapat disampaikan
        {CONTACT_EMAIL ? (
          <>
            {" "}ke{" "}
            <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </>
        ) : (
          <> lewat menu Pesan di akun Anda.</>
        )}
      </p>

      <p className="mt-10 text-sm text-ink/60">
        Lihat juga: <Link href="/syarat-ketentuan" className="underline">Syarat &amp; Ketentuan</Link>
      </p>
    </article>
  );
}
