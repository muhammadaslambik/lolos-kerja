import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description:
    "Aturan penggunaan Lolos Kerja untuk pelamar dan perusahaan: akun, lowongan, lamaran, komunikasi, dan tanggung jawab.",
};

// Isi alamat email kontak di sini (tampil di bagian "Kontak").
// Contoh: const CONTACT_EMAIL = "halo@loloskerja.eu.org";
const CONTACT_EMAIL = "";

const UPDATED = "25 Oktober 2026";

const H2 = "mt-10 text-xl font-bold text-brand-ink";
const P = "mt-3 leading-relaxed text-ink/80";
const UL = "mt-3 list-disc space-y-1.5 pl-6 text-ink/80";

export default function SyaratKetentuanPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-ink">Syarat &amp; Ketentuan</h1>
      <p className="mt-2 text-sm text-ink/60">Terakhir diperbarui: {UPDATED}</p>

      <p className={P}>
        Selamat datang di Lolos Kerja. Dengan membuat akun atau memakai layanan kami, Anda menyatakan telah membaca,
        memahami, dan menyetujui syarat di bawah ini. Bila tidak setuju, mohon jangan menggunakan layanan. Cara kami
        memproses data pribadi dijelaskan di{" "}
        <Link href="/kebijakan-privasi" className="underline">Kebijakan Privasi</Link>.
      </p>

      <h2 className={H2}>1. Tentang layanan</h2>
      <p className={P}>
        Lolos Kerja adalah platform pelatihan kerja online yang juga membantu Pelamar mencari kerja. Kami bekerja sama dengan perusahaan untuk memahami keterampilan yang mereka butuhkan, lalu menyediakan kelas, pembuat CV, dan fitur pendukung agar Pelamar lebih siap bekerja. Lolos Kerja bukan pemberi kerja dan bukan pihak dalam hubungan kerja antara Pelamar dan perusahaan. Keputusan perekrutan sepenuhnya ada pada perusahaan. Kami tidak menjamin Pelamar akan diterima bekerja, dan tidak menjamin perusahaan akan menemukan kandidat.
      </p>

      <h2 className={H2}>2. Akun</h2>
      <ul className={UL}>
        <li>Anda harus berusia minimal 17 tahun dan mampu secara hukum untuk menyetujui syarat ini.</li>
        <li>Data yang Anda berikan harus benar, lengkap, dan terbaru.</li>
        <li>Anda bertanggung jawab atas keamanan kata sandi dan seluruh aktivitas di akun Anda. Segera beri tahu kami bila akun Anda disalahgunakan.</li>
        <li>
          Satu alamat email dapat memiliki dua peran, yaitu Pelamar dan Perusahaan, dalam satu akun. Anda dapat
          berpindah peran kapan saja. Setiap peran tunduk pada ketentuan yang berlaku untuk peran itu.
        </li>
        <li>Anda tidak boleh memperjualbelikan, meminjamkan, atau mengalihkan akun kepada orang lain.</li>
      </ul>

      <h2 className={H2}>3. Ketentuan untuk Pelamar</h2>
      <ul className={UL}>
        <li>Isi profil dan CV dengan jujur. Memalsukan identitas, pendidikan, pengalaman, atau sertifikat dilarang.</li>
        <li>Saat melamar, perusahaan dapat melihat profil, CV yang Anda pilih, dan pesan Anda dengan mereka.</li>
        <li>
          Talent Pool bersifat pilihan. Profil Anda hanya dapat ditemukan perusahaan terverifikasi bila Anda
          mengaktifkannya, dan dapat dinonaktifkan kapan saja.
        </li>
        <li>Skor kecocokan dan skor CV hanya alat bantu. Skor itu bukan penilaian resmi dan bukan jaminan hasil seleksi.</li>
        <li>Melamar lowongan tidak dipungut biaya. Membeli kelas bukan syarat untuk melamar atau diterima, dan tidak menjamin Anda lolos seleksi.</li>
        <li>Lolos Kerja dapat menyarankan kelas tertentu agar Anda lebih siap untuk suatu posisi. Saran itu tidak menjadi syarat melamar.</li>
        <li>
          Bayarlah hanya lewat metode pembayaran resmi di platform dan sesuai harga yang tertera. Bila ada pihak yang
          mengatasnamakan Lolos Kerja atau perusahaan meminta uang di luar itu (misalnya biaya administrasi, seragam,
          atau jaminan), jangan membayar dan laporkan kepada kami.
        </li>
      </ul>

      <h2 className={H2}>4. Ketentuan untuk Perusahaan</h2>
      <ul className={UL}>
        <li>Anda menyatakan berwenang mewakili perusahaan dan data perusahaan yang Anda isi benar.</li>
        <li>Lowongan baru tampil di publik setelah perusahaan diverifikasi admin. Kami dapat meminta dokumen pendukung seperti NIB atau NPWP, dan dapat menolak atau mencabut verifikasi.</li>
        <li>Lowongan harus nyata, akurat, dan menjelaskan posisi, lokasi, serta kisaran gaji secara jujur.</li>
        <li>Dilarang memungut biaya dari Pelamar dalam bentuk apa pun, atau memasang lowongan yang sebenarnya berupa skema investasi, penjualan berjenjang, atau penipuan.</li>
        <li>Dilarang diskriminasi berdasarkan suku, agama, ras, jenis kelamin, disabilitas, atau alasan lain yang dilarang hukum.</li>
        <li>Lolos Kerja dapat meminta masukan tentang keterampilan yang dibutuhkan untuk posisi Anda guna merancang materi kelas. Kami memakainya sebatas untuk itu dan tidak membuka informasi rahasia perusahaan Anda kepada publik.</li>
        <li>Data Pelamar hanya boleh dipakai untuk keperluan rekrutmen lowongan Anda. Dilarang menyalin, menjual, atau membagikannya kepada pihak lain, dan Anda wajib mematuhi UU PDP.</li>
        <li>Undangan lewat Talent Pool harus relevan dan tidak berupa spam.</li>
      </ul>

      <h2 className={H2}>5. Pesan dan panggilan</h2>
      <p className={P}>
        Pesan, pesan suara, dan panggilan disediakan untuk keperluan rekrutmen. Dilarang menggunakannya untuk
        pelecehan, ancaman, konten bernuansa seksual, penipuan, atau promosi yang tidak diminta. Jangan membagikan data
        yang sangat sensitif seperti kata sandi atau nomor kartu. Panggilan berjalan lewat layanan pihak ketiga
        (Jitsi) dan tunduk pada batas teknis layanan tersebut. Lolos Kerja tidak merekam panggilan.
      </p>

      <h2 className={H2}>6. Konten Anda</h2>
      <p className={P}>
        CV, profil, lowongan, dan pesan yang Anda buat tetap milik Anda. Anda memberi Lolos Kerja izin terbatas untuk
        menyimpan, menampilkan, dan memprosesnya sebatas yang diperlukan untuk menjalankan layanan, termasuk
        menampilkannya kepada perusahaan atau Pelamar sesuai pilihan Anda. Anda menjamin konten Anda tidak melanggar
        hak pihak lain. Kami dapat menghapus konten yang melanggar syarat ini atau hukum.
      </p>

      <h2 className={H2}>7. Kelas pelatihan, pembayaran, dan sertifikat</h2>
      <p className={P}>
        Kelas di Lolos Kerja dapat gratis atau berbayar. Untuk kelas berbayar, harga, isi kelas, dan ketentuan
        pengembalian dana ditampilkan sebelum Anda membayar, dan Anda hanya dikenai biaya setelah menyetujuinya.
        Pembayaran diproses lewat penyedia pembayaran, dan kami tidak menyimpan nomor kartu Anda.
      </p>
      <ul className={UL}>
        <li>Kelas dirancang agar Anda lebih siap bekerja, tetapi tidak menjamin Anda mendapat pekerjaan.</li>
        <li>Sertifikat diberikan setelah Anda memenuhi syarat kelulusan kelas yang bersangkutan dan tidak menjamin pengakuan oleh pihak ketiga.</li>
        <li>Materi kelas dimiliki oleh Lolos Kerja atau pembuatnya dan hanya untuk pemakaian pribadi Anda. Dilarang menyalin atau menyebarkannya.</li>
      </ul>

      <h2 className={H2}>8. Hal yang dilarang</h2>
      <ul className={UL}>
        <li>Menyamar sebagai orang atau perusahaan lain.</li>
        <li>Mengunggah konten ilegal, menyesatkan, atau mengandung malware.</li>
        <li>Mengakses akun atau data yang bukan milik Anda, atau mencoba menembus keamanan layanan.</li>
        <li>Mengambil data secara otomatis (scraping) atau membebani sistem secara berlebihan.</li>
        <li>Membuat banyak akun untuk menghindari pembatasan atau sanksi.</li>
      </ul>

      <h2 className={H2}>9. Moderasi, penangguhan, dan penghentian</h2>
      <p className={P}>
        Kami dapat menolak lowongan, menyembunyikan konten, menangguhkan, atau menghentikan akun yang melanggar syarat
        ini atau membahayakan pengguna lain, dengan atau tanpa pemberitahuan terlebih dahulu bila pelanggarannya berat.
        Anda dapat berhenti memakai layanan dan meminta penghapusan akun kapan saja.
      </p>

      <h2 className={H2}>10. Batas tanggung jawab</h2>
      <p className={P}>
        Layanan disediakan sebagaimana adanya. Kami berupaya menjaga layanan tetap berjalan dan aman, tetapi tidak
        menjamin layanan selalu tersedia tanpa gangguan. Kami tidak bertanggung jawab atas keputusan perekrutan,
        kebenaran informasi yang dibuat pengguna lain, kesepakatan atau perselisihan antara Pelamar dan perusahaan,
        maupun kerugian tidak langsung. Sejauh diizinkan hukum, tanggung jawab kami terbatas pada nilai yang Anda
        bayarkan kepada kami untuk layanan terkait dalam 12 bulan terakhir, atau nol bila Anda memakai layanan gratis.
        Ketentuan ini tidak mengurangi hak Anda yang tidak dapat dikesampingkan menurut hukum.
      </p>

      <h2 className={H2}>11. Laporan dan keluhan</h2>
      <p className={P}>
        Bila menemukan lowongan mencurigakan, perilaku yang melanggar, atau pelanggaran data, segera laporkan kepada
        kami lewat kontak di bawah. Kami akan menindaklanjuti dalam waktu yang wajar.
      </p>

      <h2 className={H2}>12. Perubahan syarat</h2>
      <p className={P}>
        Kami dapat memperbarui syarat ini. Tanggal pembaruan tertera di bagian atas halaman. Bila Anda tetap memakai
        layanan setelah perubahan berlaku, Anda dianggap menyetujui syarat yang baru. Untuk perubahan penting, kami
        akan memberi tahu Anda lewat platform.
      </p>

      <h2 className={H2}>13. Hukum yang berlaku</h2>
      <p className={P}>
        Syarat ini diatur oleh hukum Republik Indonesia. Perselisihan diupayakan diselesaikan secara musyawarah
        terlebih dahulu. Bila tidak berhasil, perselisihan diselesaikan di pengadilan yang berwenang di Indonesia.
      </p>

      <h2 className={H2}>14. Kontak</h2>
      <p className={P}>
        Pertanyaan tentang syarat ini dapat disampaikan
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
        Lihat juga: <Link href="/kebijakan-privasi" className="underline">Kebijakan Privasi</Link>
      </p>
    </article>
  );
}
