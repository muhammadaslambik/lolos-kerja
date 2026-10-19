import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { STAGE_LABEL, StageKey } from "@/lib/constants";
import { canChat, getChatContext } from "@/lib/chat";
import { startCall } from "@/app/actions/messages";
import ChatThread from "@/components/ChatThread";
import ChatComposer from "@/components/ChatComposer";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pesan dari Perusahaan" };

export default async function SeekerChat({ params }: { params: { id: string } }) {
  const s = await requireRole("SEEKER");
  const ctx = await getChatContext(params.id, s);
  if (!ctx || ctx.side !== "seeker") notFound();

  const open = canChat(ctx.app.stage);
  const rows = await db.message.findMany({
    where: { applicationId: ctx.app.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, senderId: true, kind: true, body: true, audioMime: true, audioSeconds: true, createdAt: true },
  });
  const messages = [...rows].reverse();
  const company = ctx.app.job.company.name;

  return (
    <div className="max-w-3xl space-y-4">
      <AutoRefresh />
      <p className="text-sm"><Link href="/dashboard/seeker" className="underline">Kembali ke dasbor</Link></p>
      <div>
        <h1 className="text-2xl font-extrabold">{company}</h1>
        <p className="mt-1 text-sm text-ink/70">
          Lamaran {ctx.app.job.title}. Status: <span className="tag">{STAGE_LABEL[ctx.app.stage as StageKey]}</span>
        </p>
      </div>

      {open && (
        <section className="panel">
          <h2 className="text-sm font-bold">Panggilan</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <form action={startCall}>
              <input type="hidden" name="id" value={ctx.app.id} />
              <input type="hidden" name="mode" value="video" />
              <button className="btn btn-primary !py-1 text-sm">Video call</button>
            </form>
            <form action={startCall}>
              <input type="hidden" name="id" value={ctx.app.id} />
              <input type="hidden" name="mode" value="audio" />
              <button className="btn btn-ghost !py-1 text-sm">Panggilan suara di website</button>
            </form>
          </div>
          <p className="mt-2 text-xs text-ink/60">
            Panggilan terbuka di tab baru lewat layanan Jitsi. Undangan panggilan dari perusahaan muncul di percakapan ini, lalu klik Gabung sekarang. Jitsi membatasi satu rapat sampai 95 menit. Jika panggilan berakhir, klik Video call atau Panggilan suara lagi untuk membuat undangan dan ruang baru.
          </p>
        </section>
      )}

      <ChatThread messages={messages} viewerId={s.uid} applicationId={ctx.app.id} otherName={company} />
      <ChatComposer applicationId={ctx.app.id} disabled={!open} />
    </div>
  );
}
