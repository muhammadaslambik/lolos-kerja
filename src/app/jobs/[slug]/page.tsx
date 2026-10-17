import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { JOB_TYPE_LABEL, rupiah } from "@/lib/constants";
import ApplyButton from "@/components/ApplyButton";

export const dynamic = "force-dynamic";

const getJob = cache((slug: string) => db.job.findUnique({ where: { slug }, include: { company: true } }));

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const job = await getJob(params.slug);
  return { title: job ? `${job.title} di ${job.company.name}` : "Lowongan" };
}

export default async function JobDetail({ params }: { params: { slug: string } }) {
  const job = await getJob(params.slug);
  if (!job || job.status !== "ACTIVE") notFound();
  const jsonLd = {
    "@context": "https://schema.org", "@type": "JobPosting", title: job.title, description: job.description,
    datePosted: job.createdAt.toISOString(), employmentType: job.jobType,
    hiringOrganization: { "@type": "Organization", name: job.company.name },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.city, addressCountry: "ID" } },
    baseSalary: job.salaryMin ? { "@type": "MonetaryAmount", currency: "IDR", value: { "@type": "QuantitativeValue", minValue: job.salaryMin, maxValue: job.salaryMax, unitText: "MONTH" } } : undefined,
  };
  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header>
        <h1 className="text-3xl font-extrabold">{job.title}</h1>
        <p className="mt-1 text-ink/70">{job.company.name}, {job.city}. {JOB_TYPE_LABEL[job.jobType]}</p>
        <p className="mt-1 font-semibold">{rupiah(job.salaryMin)} sampai {rupiah(job.salaryMax)} per bulan</p>
      </header>
      <section className="panel"><h2 className="font-bold">Deskripsi</h2><p className="mt-2 whitespace-pre-line text-sm">{job.description}</p></section>
      <section className="panel">
        <h2 className="font-bold">Kualifikasi</h2>
        <p className="mt-2 text-sm">{job.requirements}</p>
        <p className="mt-2 text-sm">Pendidikan minimal {job.minEducation ?? "-"}, pengalaman minimal {job.minExperienceYears} tahun.</p>
        <div className="mt-3 flex flex-wrap gap-2">{job.requiredSkills.map((s) => <span key={s} className="tag">{s}</span>)}</div>
      </section>
      <ApplyButton jobId={job.id} />
    </article>
  );
}
