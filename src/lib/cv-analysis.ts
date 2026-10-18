// Mesin Asisten CV: murni aturan, tanpa API eksternal.

export type CvExperience = { role: string; company: string; period: string; bullets: string[] };
export type CvEducation = { school: string; degree: string; period: string };
export type CvContent = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  summary: string;
  experiences: CvExperience[];
  education: CvEducation[];
  skills: string[];
};

export type Check = { label: string; points: number; max: number; tip?: string };
export type BulletTip = { text: string; tips: string[] };
export type Analysis = { score: number; checks: Check[]; bulletTips: BulletTip[] };
export type KeywordResult = { matched: string[]; missing: string[]; percent: number };

export const emptyCv = (): CvContent => ({
  fullName: "", email: "", phone: "", city: "", summary: "", experiences: [], education: [], skills: [],
});

const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

// Membaca data Json dari database dengan aman (data lama bisa kosong)
export function parseCv(raw: unknown): CvContent {
  const r = obj(raw);
  return {
    fullName: s(r.fullName, 120),
    email: s(r.email, 120),
    phone: s(r.phone, 40),
    city: s(r.city, 100),
    summary: s(r.summary, 1000),
    experiences: arr(r.experiences).slice(0, 5).map((e) => {
      const x = obj(e);
      return {
        role: s(x.role, 120),
        company: s(x.company, 120),
        period: s(x.period, 60),
        bullets: arr(x.bullets).map((b) => s(b, 300)).filter(Boolean).slice(0, 8),
      };
    }),
    education: arr(r.education).slice(0, 3).map((e) => {
      const x = obj(e);
      return { school: s(x.school, 150), degree: s(x.degree, 150), period: s(x.period, 60) };
    }),
    skills: arr(r.skills).map((k) => s(k, 60)).filter(Boolean).slice(0, 30),
  };
}

const WEAK = [
  "membantu", "bantu", "bertanggung jawab", "bertugas", "ikut", "turut", "melakukan", "mengerjakan", "menjadi",
  "responsible for", "helped", "assisted", "worked on", "in charge of",
];
const STRONG = new Set([
  "meningkatkan", "menurunkan", "mengurangi", "menghemat", "mengelola", "memimpin", "membuat", "membangun",
  "merancang", "mengembangkan", "menyusun", "mengoptimalkan", "menyelesaikan", "menangani", "melatih",
  "mengoordinasikan", "mengkoordinasikan", "menganalisis", "menerapkan", "mengimplementasikan", "meluncurkan",
  "menjual", "mengatur", "mengawasi", "memproses", "memastikan", "menciptakan", "mempercepat", "menegosiasikan",
  "memperbaiki", "mengotomatisasi", "mempresentasikan", "menulis", "mengadakan", "menyelenggarakan",
  "led", "managed", "built", "increased", "reduced", "created", "developed", "designed", "launched", "improved",
]);
export const SUGGESTED_VERBS = ["meningkatkan", "mengelola", "menyusun", "mengembangkan", "menyelesaikan", "mengurangi"];

function bulletQuality(text: string): { score: number; tips: string[] } {
  const tips: string[] = [];
  const lower = text.toLowerCase().trim();
  const first = lower.split(/\s+/)[0] ?? "";
  const weak = WEAK.find((w) => lower === w || lower.startsWith(`${w} `));
  let score = 0;

  if (STRONG.has(first)) score += 0.5;
  else if (weak) tips.push(`Awalan "${weak}" kurang kuat. Coba mulai dengan kata kerja seperti: ${SUGGESTED_VERBS.join(", ")}.`);
  else {
    score += 0.25;
    tips.push(`Coba mulai dengan kata kerja hasil, misalnya: ${SUGGESTED_VERBS.join(", ")}.`);
  }
  if (/\d/.test(text)) score += 0.35;
  else tips.push("Tambahkan angka (jumlah, persen, nilai rupiah, atau lama waktu). Kerangka: [kata kerja] [apa] sebesar [angka] dengan [cara].");
  if (text.length >= 25 && text.length <= 200) score += 0.15;
  else if (text.length < 25) tips.push("Terlalu singkat. Jelaskan apa yang Anda lakukan dan hasilnya.");
  else tips.push("Terlalu panjang. Pecah menjadi dua poin yang lebih ringkas.");
  return { score, tips };
}

export function analyzeCv(cv: CvContent): Analysis {
  const checks: Check[] = [];
  const add = (label: string, points: number, max: number, tip?: string) =>
    checks.push({ label, points: Math.round(points), max, tip: points < max ? tip : undefined });

  // 1. Kontak (15)
  const emailOk = /^\S+@\S+\.\S+$/.test(cv.email);
  const phoneOk = cv.phone.replace(/\D/g, "").length >= 8;
  const contactMissing = [!cv.fullName && "nama", !emailOk && "email", !phoneOk && "nomor telepon", !cv.city && "kota"].filter(Boolean);
  add("Data kontak", (cv.fullName && emailOk ? 8 : 0) + (phoneOk ? 4 : 0) + (cv.city ? 3 : 0), 15,
    `Lengkapi: ${contactMissing.join(", ")}.`);

  // 2. Ringkasan (10)
  const sl = cv.summary.length;
  add("Ringkasan profil", sl >= 100 && sl <= 500 ? 10 : sl > 0 ? 5 : 0, 10,
    sl === 0 ? "Tulis ringkasan 2 sampai 3 kalimat tentang diri dan tujuan karier Anda." : "Idealnya 100 sampai 500 karakter.");

  // 3. Pengalaman (15)
  const exps = cv.experiences.filter((e) => e.role && e.company);
  add("Pengalaman, magang, organisasi, atau proyek", exps.length >= 2 ? 15 : exps.length === 1 ? 10 : 0, 15,
    "Isi jabatan dan nama organisasi. Fresh graduate boleh mengisi magang, organisasi kampus, atau proyek.");

  // 4. Kualitas poin (20)
  const bullets = cv.experiences.flatMap((e) => e.bullets);
  const bulletTips: BulletTip[] = [];
  let sum = 0;
  for (const b of bullets) {
    const q = bulletQuality(b);
    sum += q.score;
    if (q.tips.length) bulletTips.push({ text: b, tips: q.tips });
  }
  add("Kualitas poin pencapaian", bullets.length ? (sum / bullets.length) * 20 : 0, 20,
    bullets.length ? "Perbaiki poin yang ditandai di bawah." : "Tambahkan poin pencapaian di setiap pengalaman.");

  // 5. Pendidikan (10)
  const edus = cv.education.filter((e) => e.school);
  add("Pendidikan", edus.some((e) => e.degree) ? 10 : edus.length ? 5 : 0, 10, "Isi nama sekolah atau kampus beserta jurusan atau gelar.");

  // 6. Keahlian (15)
  const k = cv.skills.length;
  add("Keahlian", k >= 6 ? 15 : k >= 3 ? 10 : k >= 1 ? 5 : 0, 15, "Cantumkan minimal 6 keahlian yang relevan.");

  // 7. Periode (10)
  const entries = [...exps, ...edus];
  const withPeriod = entries.filter((e) => e.period).length;
  add("Periode waktu tertulis", entries.length ? (withPeriod / entries.length) * 10 : 0, 10,
    "Tulis periode di setiap pengalaman dan pendidikan, misalnya Jan 2023 - Des 2024.");

  // 8. Panjang (5)
  const total = [cv.summary, ...cv.skills, ...cv.experiences.flatMap((e) => [e.role, e.company, ...e.bullets]), ...cv.education.flatMap((e) => [e.school, e.degree])].join(" ").length;
  add("Panjang isi CV", total >= 600 && total <= 4500 ? 5 : total > 0 ? 2 : 0, 5,
    total < 600 ? "Isi CV masih terlalu singkat." : "Isi CV terlalu panjang. Usahakan muat di 1 sampai 2 halaman.");

  const score = Math.min(100, checks.reduce((n, c) => n + c.points, 0));
  return { score, checks, bulletTips };
}

export function matchKeywords(cv: CvContent, required: string[]): KeywordResult {
  const text = [cv.summary, ...cv.skills, ...cv.experiences.flatMap((e) => [e.role, e.company, ...e.bullets]), ...cv.education.flatMap((e) => [e.school, e.degree])]
    .join(" ")
    .toLowerCase();
  const req = Array.from(new Set(required.map((x) => x.trim().toLowerCase()).filter(Boolean)));
  const matched = req.filter((x) => text.includes(x));
  const missing = req.filter((x) => !text.includes(x));
  return { matched, missing, percent: req.length ? Math.round((matched.length / req.length) * 100) : 0 };
}

// Ringkasan awal dari templat, untuk diedit pengguna
export function buildSummary(p: { educationLevel?: string | null; experienceYears?: number; skills?: string[] }) {
  const edu = p.educationLevel ? `Lulusan ${p.educationLevel}` : "Pencari kerja";
  const yrs = p.experienceYears ?? 0;
  const exp = yrs > 0 ? ` dengan pengalaman ${yrs} tahun` : " yang siap memulai karier";
  const sk = (p.skills ?? []).slice(0, 4);
  const list = sk.length <= 1 ? sk.join("") : `${sk.slice(0, -1).join(", ")} dan ${sk[sk.length - 1]}`;
  const skills = sk.length ? `, terampil dalam ${list}` : "";
  return `${edu}${exp}${skills}. Siap berkontribusi dan terus belajar di posisi yang dituju.`;
}
