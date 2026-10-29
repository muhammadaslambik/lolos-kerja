import { db } from "@/lib/db";
import { formatDateId } from "@/lib/certificate";
import { JOB_TYPE_LABEL, VERIFICATION_LABEL, STAGE_LABEL, rupiah } from "@/lib/constants";
import { JOB_STATUS_LABEL } from "@/lib/job-options";
import { companyFields } from "@/lib/company-view";
import { DOC_LABEL, fmtSize, missingFields } from "@/lib/company-profile";
import type { Block, Card, Cell, Detail } from "@/lib/admin-types";

const ROLE_LABEL: Record<string, string> = { SEEKER: "Pelamar", EMPLOYER: "Perusahaan", ADMIN: "Admin" };
const MODE_LABEL: Record<string, string> = { ONSITE: "Di kantor", HYBRID: "Hibrid", REMOTE: "Jarak jauh" };
const ROWS = 50;

type AttemptRow = { enrollmentId: string; score: number; correct: number; total: number; answers: unknown; createdAt: Date };

// Tabel riwayat kuis baru ada setelah Setup Database dijalankan; sebelum itu dianggap kosong
async function loadAttempts(ids: string[]): Promise<AttemptRow[]> {
  try {
    return await db.quizAttempt.findMany({ where: { enrollmentId: { in: ids } }, orderBy: { createdAt: "asc" } });
  } catch {
    return [];
  }
}

type Answer = { topic: string; q: string; chosen: string | null; right: string; ok: boolean };

function parseAnswers(raw: unknown): Answer[] {
  if (!Array.isArray(raw)) return [];
  const out: Answer[] = [];
  for (const r of raw) {
    const o = r as Record<string, unknown> | null;
    if (!o || typeof o.q !== "string") continue;
    out.push({
      topic: typeof o.topic === "string" ? o.topic : "Umum",
      q: o.q,
      chosen: typeof o.chosen === "string" ? o.chosen : null,
      right: typeof o.right === "string" ? o.right : "",
      ok: o.ok === true,
    });
  }
  return out;
}

export async function loadAdminOverview(): Promise<{ cards: Card[]; details: Record<string, Detail> }> {
  const [users, jobs, companies, courses, enrollments, userCount, activeJobs, hiredCount, enrollCount, doneCount, completedRows] =
    await Promise.all([
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 300,
        select: {
          id: true, fullName: true, email: true, role: true, createdAt: true,
          profile: { select: { headline: true, city: true, educationLevel: true, experienceYears: true, skills: true, expectedSalary: true, talentVisible: true } },
          memberships: { select: { companyId: true, memberRole: true } },
          resumes: { select: { id: true } },
        },
      }),
      db.job.findMany({
        orderBy: { createdAt: "desc" },
        take: 300,
        include: {
          company: { select: { id: true, name: true } },
          applications: { select: { id: true, stage: true, matchScore: true, createdAt: true, seekerId: true, seeker: { select: { fullName: true } } } },
        },
      }),
      db.company.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          members: { include: { user: { select: { id: true, fullName: true, email: true } } } },
          jobs: { select: { id: true, title: true, status: true } },
        },
      }),
      db.course.findMany({
        orderBy: { createdAt: "asc" },
        include: { modules: { select: { id: true, lessons: { select: { id: true } } } }, _count: { select: { enrollments: true } } },
      }),
      db.enrollment.findMany({
        orderBy: { enrolledAt: "desc" },
        take: 300,
        include: {
          user: { select: { id: true, fullName: true } },
          course: { select: { id: true, title: true, passScore: true } },
          certificate: { select: { code: true } },
        },
      }),
      db.user.count(),
      db.job.count({ where: { status: "ACTIVE" } }),
      db.application.count({ where: { stage: "HIRED" } }),
      db.enrollment.count(),
      db.enrollment.count({ where: { status: "completed" } }),
      db.enrollment.groupBy({ by: ["courseId"], where: { status: "completed" }, _count: { _all: true } }),
    ]);

  const companyIds = companies.map((c) => c.id);
  const enrollIds = enrollments.map((e) => e.id);
  const [profiles, docs, attempts] = await Promise.all([
    db.companyProfile.findMany({ where: { companyId: { in: companyIds } } }),
    db.companyDocument.findMany({
      where: { companyId: { in: companyIds } },
      select: { id: true, companyId: true, kind: true, fileName: true, size: true },
      orderBy: { createdAt: "asc" },
    }),
    loadAttempts(enrollIds),
  ]);

  const completedBy = new Map<string, number>(completedRows.map((r) => [r.courseId, r._count._all]));
  const profileOf = new Map(profiles.map((p) => [p.companyId, p]));
  const companyById = new Map(companies.map((c) => [c.id, c]));
  const details: Record<string, Detail> = {};

  const U = (id: string, text: string): Cell => ({ text, ref: `u:${id}` });
  const J = (id: string, text: string): Cell => ({ text, ref: `j:${id}` });
  const C = (id: string, text: string): Cell => ({ text, ref: `c:${id}` });
  const K = (id: string, text: string): Cell => ({ text, ref: `k:${id}` });
  const E = (id: string, text: string): Cell => ({ text, ref: `e:${id}` });

  // ---------- Kelas ----------
  for (const c of courses) {
    const lessonCount = c.modules.reduce((a, m) => a + m.lessons.length, 0);
    const done = completedBy.get(c.id) ?? 0;
    details[`k:${c.id}`] = {
      title: c.title,
      subtitle: c.category ?? undefined,
      blocks: [
        {
          title: "Ringkasan",
          fields: [
            { label: "Status", value: c.published ? "Tayang" : "Draf" },
            { label: "Tingkat", value: c.level },
            { label: "Harga", value: c.price === 0 ? "Gratis" : rupiah(c.price) },
            { label: "Nilai lulus", value: String(c.passScore) },
            { label: "Modul", value: String(c.modules.length) },
            { label: "Pelajaran", value: String(lessonCount) },
            { label: "Peserta", value: String(c._count.enrollments) },
            { label: "Peserta lulus", value: String(done) },
          ],
        },
        { title: "Deskripsi kelas", text: c.description || "Belum ada deskripsi." },
      ],
      links: [
        { label: "Lihat kelas", href: `/courses/${c.slug}` },
        { label: "Kelola isi kelas", href: `/dashboard/admin/kelas/${c.id}` },
      ],
    };
  }

  // ---------- Pengguna ----------
  for (const u of users) {
    const apps = jobs.flatMap((j) => j.applications.filter((a) => a.seekerId === u.id).map((a) => ({ a, j })));
    const myEnroll = enrollments.filter((e) => e.user.id === u.id);
    const blocks: Block[] = [
      {
        title: "Identitas akun",
        fields: [
          { label: "Nama", value: u.fullName },
          { label: "Email", value: u.email },
          { label: "Peran akun saat ini", value: ROLE_LABEL[u.role] ?? u.role },
          { label: "Terdaftar", value: formatDateId(u.createdAt) },
          { label: "Jumlah CV", value: String(u.resumes.length) },
        ],
      },
    ];
    if (u.profile) {
      blocks.push({
        title: "Profil pelamar",
        fields: [
          { label: "Headline", value: u.profile.headline || "-" },
          { label: "Kota", value: u.profile.city || "-" },
          { label: "Pendidikan terakhir", value: u.profile.educationLevel || "-" },
          { label: "Pengalaman", value: `${u.profile.experienceYears} tahun` },
          { label: "Keahlian", value: u.profile.skills.length ? u.profile.skills.join(", ") : "-" },
          { label: "Gaji yang diharapkan", value: u.profile.expectedSalary ? rupiah(u.profile.expectedSalary) : "-" },
          { label: "Tampil di Talent Pool", value: u.profile.talentVisible ? "Ya (sudah menyetujui)" : "Tidak" },
        ],
      });
    }
    if (u.memberships.length) {
      blocks.push({
        title: "Perusahaan yang dikelola",
        list: u.memberships.map((m) => ({
          text: companyById.get(m.companyId)?.name ?? "Perusahaan",
          sub: `Peran: ${m.memberRole}`,
          ref: `c:${m.companyId}`,
        })),
      });
    }
    if (apps.length) {
      blocks.push({
        title: `Lamaran (${apps.length})`,
        table: {
          columns: ["Lowongan", "Perusahaan", "Tahap", "Kecocokan"],
          rows: apps.map(({ a, j }) => [J(j.id, j.title), C(j.company.id, j.company.name), STAGE_LABEL[a.stage], a.matchScore === null ? "-" : `${a.matchScore}%`]),
        },
      });
    }
    if (myEnroll.length) {
      blocks.push({
        title: `Kelas yang diikuti (${myEnroll.length})`,
        table: {
          columns: ["Kelas", "Nilai terbaik", "Status"],
          rows: myEnroll.map((e) => [K(e.course.id, e.course.title), E(e.id, e.finalScore === null ? "-" : String(e.finalScore)), E(e.id, e.status === "completed" ? "Lulus" : "Belajar")]),
        },
      });
    }
    details[`u:${u.id}`] = { title: u.fullName, subtitle: u.email, blocks };
  }

  // ---------- Lowongan ----------
  for (const j of jobs) {
    const applicants = j.applications;
    const appTable: Block = {
      title: `Pelamar (${applicants.length})`,
      table: {
        columns: ["Pelamar", "Tahap", "Kecocokan", "Melamar pada"],
        rows: applicants.map((a) => [U(a.seekerId, a.seeker.fullName), STAGE_LABEL[a.stage], a.matchScore === null ? "-" : `${a.matchScore}%`, formatDateId(a.createdAt)]),
      },
    };
    details[`ja:${j.id}`] = { title: `Pelamar: ${j.title}`, subtitle: j.company.name, blocks: [appTable] };
    const salary =
      j.salaryMin || j.salaryMax
        ? `${j.salaryMin ? rupiah(j.salaryMin) : "?"} sampai ${j.salaryMax ? rupiah(j.salaryMax) : "?"}`
        : "Tidak dicantumkan";
    details[`j:${j.id}`] = {
      title: j.title,
      subtitle: j.company.name,
      blocks: [
        {
          title: "Ringkasan lowongan",
          fields: [
            { label: "Status", value: JOB_STATUS_LABEL[j.status] },
            { label: "Tipe pekerjaan", value: JOB_TYPE_LABEL[j.jobType] },
            { label: "Mode kerja", value: MODE_LABEL[j.workMode] ?? j.workMode },
            { label: "Kota", value: j.city || "-" },
            { label: "Gaji", value: salary },
            { label: "Pendidikan minimal", value: j.minEducation || "-" },
            { label: "Pengalaman minimal", value: `${j.minExperienceYears} tahun` },
            { label: "Keahlian yang dibutuhkan", value: j.requiredSkills.length ? j.requiredSkills.join(", ") : "-" },
            { label: "Dipasang", value: formatDateId(j.createdAt) },
          ],
        },
        { title: "Deskripsi pekerjaan", text: j.description },
        ...(j.requirements ? [{ title: "Persyaratan", text: j.requirements } as Block] : []),
        { title: "Perusahaan", list: [{ text: j.company.name, ref: `c:${j.company.id}` }] },
        appTable,
      ],
    };
  }

  // ---------- Perusahaan (admin melihat semuanya) ----------
  for (const c of companies) {
    const p = profileOf.get(c.id) ?? null;
    const myDocs = docs.filter((d) => d.companyId === c.id);
    const miss = missingFields(c, p, myDocs.map((d) => d.kind));
    const fields = companyFields(c, p, "admin");
    const blocks: Block[] = [
      {
        title: "Status",
        fields: [
          { label: "Verifikasi", value: VERIFICATION_LABEL[c.verification] },
          { label: "Didaftarkan", value: formatDateId(c.createdAt) },
          { label: "Diajukan verifikasi", value: p?.submittedAt ? formatDateId(p.submittedAt) : "-" },
          { label: "Catatan peninjauan", value: p?.reviewNote || "-" },
        ],
      },
      ...(c.description ? [{ title: "Deskripsi", text: c.description } as Block] : []),
      { title: "Identitas, legalitas, dan kontak", fields: fields.map((f) => ({ label: f.label, value: f.value })) },
      {
        title: "Akun pendaftar dan anggota",
        list: c.members.map((m) => ({ text: `${m.user.fullName} (${m.user.email})`, sub: `Peran: ${m.memberRole}`, ref: `u:${m.user.id}` })),
      },
      {
        title: `Lowongan (${c.jobs.length})`,
        list: c.jobs.map((j) => ({ text: j.title, sub: JOB_STATUS_LABEL[j.status], ref: `j:${j.id}` })),
      },
      {
        title: `Dokumen (${myDocs.length})`,
        list: myDocs.map((d) => ({
          text: `${DOC_LABEL[d.kind]?.split(" (")[0] ?? d.kind}: ${d.fileName}`,
          sub: fmtSize(d.size),
          href: `/api/company-docs/${d.id}`,
        })),
      },
    ];
    if (miss.length) blocks.push({ title: "Belum lengkap", text: miss.join(", "), tone: "bad" });
    details[`c:${c.id}`] = {
      title: c.name,
      subtitle: VERIFICATION_LABEL[c.verification],
      blocks,
      links: [{ label: "Buka halaman profil publik", href: `/perusahaan/${c.slug}` }],
      verifyCompanyId: c.verification === "PENDING" ? c.id : undefined,
    };
  }

  // ---------- Hasil peserta (nilai dan status) ----------
  for (const e of enrollments) {
    const mine = attempts.filter((a) => a.enrollmentId === e.id);
    let best: AttemptRow | undefined;
    for (const a of mine) if (!best || a.score >= best.score) best = a;
    const pass = e.course.passScore;
    const passed = e.status === "completed";
    const answers = best ? parseAnswers(best.answers) : [];

    let why: string;
    if (e.finalScore === null) {
      why = `Status Belajar karena peserta belum mengerjakan kuis akhir (progres belajar ${e.progressPct}%).`;
    } else if (passed) {
      why = `Status Lulus karena nilai terbaik ${e.finalScore} sudah mencapai nilai lulus ${pass}.`;
    } else {
      why = `Status Belum lulus karena nilai terbaik ${e.finalScore} masih di bawah nilai lulus ${pass}.`;
    }
    if (best) {
      why += ` Nilai ${best.score} berasal dari ${best.correct} jawaban benar dan ${best.total - best.correct} salah dari ${best.total} soal (benar dibagi total, dikali 100).`;
    } else if (e.finalScore !== null) {
      why += " Rincian jawaban per soal belum tercatat untuk hasil ini; rincian hanya tercatat untuk kuis yang dikerjakan setelah pembaruan ini.";
    }

    const blocks: Block[] = [
      {
        title: "Ringkasan",
        fields: [
          { label: "Status", value: e.finalScore === null ? "Belajar" : passed ? "Lulus" : "Belum lulus" },
          { label: "Nilai terbaik", value: e.finalScore === null ? "-" : String(e.finalScore) },
          { label: "Nilai lulus", value: String(pass) },
          { label: "Progres belajar", value: `${e.progressPct}%` },
          { label: "Terdaftar", value: formatDateId(e.enrolledAt) },
          { label: "Selesai", value: e.completedAt ? formatDateId(e.completedAt) : "-" },
          { label: "Kode sertifikat", value: e.certificate?.code ?? "-" },
        ],
      },
      { title: "Mengapa status dan nilainya begini", text: why, tone: passed ? "good" : undefined },
    ];

    if (answers.length) {
      const topics = new Map<string, Answer[]>();
      for (const a of answers) topics.set(a.topic, [...(topics.get(a.topic) ?? []), a]);
      const strengths = [...topics.entries()]
        .filter(([, list]) => list.some((a) => a.ok))
        .map(([topic, list]) => {
          const ok = list.filter((a) => a.ok);
          return {
            text: `${topic}: ${ok.length} dari ${list.length} soal benar${ok.length === list.length ? " (dikuasai)" : ""}`,
            sub: `Alasan: menjawab benar soal tentang ${ok.map((a) => `"${a.q}"`).join("; ")}.`,
          };
        });
      const weaknesses = [...topics.entries()]
        .filter(([, list]) => list.some((a) => !a.ok))
        .map(([topic, list]) => {
          const bad = list.filter((a) => !a.ok);
          return {
            text: `${topic}: ${bad.length} dari ${list.length} soal salah`,
            sub: `Alasan: menjawab salah soal ${bad.map((a) => `"${a.q}" (jawaban peserta: ${a.chosen ?? "tidak dijawab"}; yang benar: ${a.right})`).join("; ")}.`,
          };
        });
      blocks.push({
        title: "Kemampuan yang terlihat",
        list: strengths.length ? strengths : [{ text: "Belum ada soal yang dijawab benar." }],
        tone: "good",
      });
      blocks.push({
        title: "Perlu ditingkatkan",
        list: weaknesses.length ? weaknesses : [{ text: "Tidak ada soal yang dijawab salah." }],
        tone: weaknesses.length ? "bad" : undefined,
      });
    }
    if (mine.length) {
      blocks.push({
        title: `Riwayat percobaan kuis (${mine.length})`,
        table: {
          columns: ["Tanggal", "Nilai", "Benar", "Salah"],
          rows: mine.map((a) => [formatDateId(a.createdAt), String(a.score), String(a.correct), String(a.total - a.correct)]),
        },
      });
    }
    blocks.push({ title: "Peserta", list: [{ text: e.user.fullName, ref: `u:${e.user.id}` }] });
    blocks.push({ title: "Kelas", list: [{ text: e.course.title, ref: `k:${e.course.id}` }] });

    details[`e:${e.id}`] = { title: `Hasil ${e.user.fullName}`, subtitle: e.course.title, blocks };
  }

  // ---------- Kartu ringkasan ----------
  const pending = companies.filter((c) => c.verification === "PENDING");
  const cards: Card[] = [
    {
      key: "users",
      label: "Pengguna",
      value: userCount,
      title: "Daftar pengguna",
      note: `Klik nama untuk melihat identitas, atau peran untuk melihat perusahaannya.${userCount > ROWS ? ` Menampilkan ${ROWS} terbaru dari ${userCount}.` : ""}`,
      sections: [
        {
          columns: ["Nama", "Email", "Peran", "Terdaftar"],
          rows: users.slice(0, ROWS).map((u) => {
            const firstCompany = u.memberships[0]?.companyId;
            return [
              U(u.id, u.fullName),
              u.email,
              firstCompany ? C(firstCompany, ROLE_LABEL[u.role] ?? u.role) : U(u.id, ROLE_LABEL[u.role] ?? u.role),
              formatDateId(u.createdAt),
            ];
          }),
        },
      ],
    },
    {
      key: "jobs",
      label: "Lowongan aktif",
      value: activeJobs,
      title: "Lowongan yang sedang tayang",
      note: "Klik nama lowongan untuk deskripsinya, perusahaan untuk profilnya, atau jumlah pelamar untuk daftar pelamar.",
      sections: [
        {
          columns: ["Lowongan", "Perusahaan", "Kota", "Tipe", "Pelamar"],
          rows: jobs
            .filter((j) => j.status === "ACTIVE")
            .slice(0, ROWS)
            .map((j) => [J(j.id, j.title), C(j.company.id, j.company.name), j.city ?? "-", JOB_TYPE_LABEL[j.jobType], { text: String(j.applications.length), ref: `ja:${j.id}` }]),
        },
      ],
    },
    {
      key: "hired",
      label: "Pelamar diterima",
      value: hiredCount,
      title: "Pelamar yang diterima bekerja",
      sections: [
        {
          columns: ["Pelamar", "Lowongan", "Perusahaan", "Melamar pada"],
          rows: jobs
            .flatMap((j) => j.applications.filter((a) => a.stage === "HIRED").map((a) => [U(a.seekerId, a.seeker.fullName), J(j.id, j.title), C(j.company.id, j.company.name), formatDateId(a.createdAt)] as Cell[]))
            .slice(0, ROWS),
        },
      ],
    },
    {
      key: "courses",
      label: "Tingkat kelulusan kelas",
      value: enrollCount ? `${Math.round((doneCount / enrollCount) * 100)}%` : "0%",
      title: "Kelulusan kelas",
      note: `${doneCount} lulus dari ${enrollCount} pendaftaran kelas. Klik nama kelas, nama peserta, atau nilai dan status untuk penjelasannya.`,
      sections: [
        {
          heading: "Per kelas",
          columns: ["Kelas", "Peserta", "Lulus", "Tingkat"],
          rows: courses.map((c) => {
            const total = c._count.enrollments;
            const ok = completedBy.get(c.id) ?? 0;
            return [K(c.id, c.title), String(total), String(ok), total ? `${Math.round((ok / total) * 100)}%` : "-"];
          }),
        },
        {
          heading: "Peserta terbaru",
          columns: ["Peserta", "Kelas", "Nilai terbaik", "Status"],
          rows: enrollments.slice(0, ROWS).map((e) => [
            U(e.user.id, e.user.fullName),
            K(e.course.id, e.course.title),
            E(e.id, e.finalScore === null ? "-" : `${e.finalScore} (lulus ${e.course.passScore})`),
            E(e.id, e.status === "completed" ? "Lulus" : "Belajar"),
          ]),
        },
      ],
    },
    {
      key: "verify",
      label: "Perusahaan menunggu verifikasi",
      value: pending.length,
      title: "Perusahaan menunggu verifikasi",
      note: "Klik nama perusahaan untuk melihat data lengkap, dokumen, lalu menyetujui atau menolak.",
      sections: [
        {
          columns: ["Perusahaan", "Kelengkapan data", "Akun pendaftar", "Waktu"],
          rows: pending.map((c) => {
            const p = profileOf.get(c.id) ?? null;
            const miss = missingFields(c, p, docs.filter((d) => d.companyId === c.id).map((d) => d.kind));
            const owner = c.members[0]?.user;
            return [
              C(c.id, c.name),
              miss.length ? `Belum lengkap (${miss.length})` : "Lengkap",
              owner ? U(owner.id, `${owner.fullName} (${owner.email})`) : "-",
              p?.submittedAt ? `Diajukan ${formatDateId(p.submittedAt)}` : `Didaftarkan ${formatDateId(c.createdAt)}`,
            ];
          }),
        },
      ],
    },
  ];

  return { cards, details };
}
