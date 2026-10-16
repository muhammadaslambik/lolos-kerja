import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser } from "@/lib/demo-user";
import { matchScore, matchLabel } from "@/lib/screening";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const user = await getDemoUser("SEEKER");
  const job = await db.job.findUnique({ where: { id: params.id } });
  if (!job || job.status !== "ACTIVE") return NextResponse.json({ message: "Lowongan tidak tersedia." }, { status: 404 });

  const exists = await db.application.findUnique({ where: { jobId_seekerId: { jobId: job.id, seekerId: user.id } } });
  if (exists) return NextResponse.json({ message: "Anda sudah melamar lowongan ini." }, { status: 409 });

  const resume = await db.resume.findFirst({ where: { userId: user.id, isPrimary: true } });
  const score = matchScore(job, user.profile);
  await db.application.create({
    data: { jobId: job.id, seekerId: user.id, resumeId: resume?.id, matchScore: score, events: { create: { toStage: "APPLIED" } } },
  });
  return NextResponse.json({ message: `Kecocokan profil: ${score}% (${matchLabel(score)}).` }, { status: 201 });
}
