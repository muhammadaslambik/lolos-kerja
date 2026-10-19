import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { formatDateId } from "@/lib/certificate";
import { INVITE_LABEL, shortName } from "@/lib/talent";

export const dynamic = "force-dynamic";
export const metadata = { title: "Undangan Talent Pool" };

export default async function Invitations({ searchParams }: { searchParams: { ok?: string } }) {
  const s = await requireRole("EMPLOYER");
  const invites = await db.talentInvite.findMany({
    where: { company: { members: { some: { userId: s.uid } } } },
    include: {
      seeker: { select: { fullName: true, email: true } },
      job: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="max-w-3xl">
      <p className="mb-2 text-sm"><Link href="/dashboard/employer/talent" className="underline">Kembali ke Talent Pool</Link></p>
      <h1 className="mb-3 text-2xl font-extrabold">Undangan saya</h1>
      {searchParams.ok === "terkirim" && (
        <p role="status" className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-ink">Undangan terkirim.</p>
      )}
      {invites.length === 0 && <p className="panel text-sm">Belum ada undangan.</p>}
      <div className="space-y-3">
        {invites.map((i) => (
          <section key={i.id} className="panel text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{i.status === "accepted" ? i.seeker.fullName : shortName(i.seeker.fullName)}</p>
              <span className="tag">{INVITE_LABEL[i.status] ?? i.status}</span>
            </div>
            <p className="mt-1 text-xs text-ink/70">
              {i.job ? `Untuk posisi ${i.job.title}. ` : "Undangan umum. "}Dikirim {formatDateId(i.createdAt)}.
            </p>
            <p className="mt-1 text-xs">{i.message}</p>
            {i.status === "accepted" && (
              <p className="mt-2 font-medium">Kontak (dibagikan oleh pelamar): {i.seeker.email}</p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
