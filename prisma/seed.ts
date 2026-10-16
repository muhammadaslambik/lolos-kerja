import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

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
  const first = await db.course.findUnique({ where: { slug: "excel-untuk-admin" } });
  if (first) await db.enrollment.upsert({ where: { userId_courseId: { userId: seeker.id, courseId: first.id } }, update: {}, create: { userId: seeker.id, courseId: first.id, progressPct: 40 } });
  console.log("Seed selesai.");
}
main().finally(() => db.$disconnect());
