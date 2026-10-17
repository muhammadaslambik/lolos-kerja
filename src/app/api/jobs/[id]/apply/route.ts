import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { matchScore, matchLabel } from "@/lib/screening";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ message: "Silakan masuk dulu." }, { status: 401 });
  if (s.role !== "SEEKER") return NextResponse.json({ message: "Hanya akun pelamar yang bisa melamar." }, { status: 403 });

  const [job, exists, profile, resume] = await Promise.all([
    db.job.findUnique({ where: { id: params.id } }),
    db.application.findUnique({ where: { jobId_seekerId: { jobId: params.id, seekerId: s.uid } } }),
    db.seekerProfile.findUnique({ where: { userId: s.uid } }),
    db.resume.findFirst({ where: { userId: s.uid, isPrimary: true } }),
  ]);
  if (!job || job.status !== "ACTIVE") return NextResponse.json({ message: "Lowongan tidak tersedia." }, { status: 404 });
  if (exists) return NextResponse.json({ message: "Anda sudah melamar lowongan ini." }, { status: 409 });

  const score = matchScore(job, profile);
  await db.application.create({
    data: { jobId: job.id, seekerId: s.uid, resumeId: resume?.id, matchScore: score, events: { create: { toStage: "APPLIED" } } },
  });
  return NextResponse.json({ message: `Kecocokan profil: ${score}% (${matchLabel(score)}).` }, { status: 201 });
}
