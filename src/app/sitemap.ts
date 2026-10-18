import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/jobs`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/courses`, changeFrequency: "weekly", priority: 0.8 },
  ];
  try {
    const [jobs, courses] = await Promise.all([
      db.job.findMany({ where: { status: "ACTIVE" }, select: { slug: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 1000 }),
      db.course.findMany({ where: { published: true }, select: { slug: true } }),
    ]);
    for (const j of jobs) entries.push({ url: `${SITE_URL}/jobs/${j.slug}`, lastModified: j.createdAt, changeFrequency: "weekly", priority: 0.7 });
    for (const c of courses) entries.push({ url: `${SITE_URL}/courses/${c.slug}`, changeFrequency: "weekly", priority: 0.6 });
  } catch {
    // Jika database sedang tidak bisa dihubungi, tetap tampilkan halaman utama saja
  }
  return entries;
}
