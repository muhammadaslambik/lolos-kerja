import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { STAGE_LABEL, StageKey } from "@/lib/constants";
import { applicantPhone, canChat, getChatContext } from "@/lib/chat";
import { startCall } from "@/app/actions/messages";
import ChatThread from "@/components/ChatThread";
import ChatComposer from "@/components/ChatComposer";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pesan Pelamar" };

export default async function EmployerChat({ params }: { params: { id: string } }) {
  const s = await requireRole("EMPLOYER");
  const ctx = await getChatContext(params.id, s);
  if (!ctx || ctx.side !== "employer") notFound();

  const open = canChat(ctx.app.stage);
  const [rows, phone] = await Promise.all([
    db.message.findMany({
      where: { applicationId: ctx.app.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, senderId: true, kind: true, body: true, audioMime: true, audioSeconds: true, createdAt: true },
    }),
    open ? applicantPhone(ctx.app.id) : Promise.resolve(null),
  ]);
  const messages = [...rows].reverse();

  return (
    <div className="max-w-3xl space-y-4">
      <AutoRefresh />
      <p className="text-sm">
        <Link href={`/dashboard/employer?pelamar=${ctx.app.id}`} className="underline">Kembali ke CV pelamar</Link>
      </p>
      <div>
        <h1 className="text-2xl font-extrabold">{ctx.app.seeker.fullName}</h1>
        <p className="mt-1 text-sm text-ink/70">
          Melamar sebagai {ctx.app.job.title}. Status: <span className="tag">{STAGE_LABEL[ctx.app.stage as StageKey]}</span>
        </p>
      </div>

      {open && (
        <section className="panel">
          <h2 className="text-sm font-bold">Hubungi pelamar</h2>
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
            {phone && (
              <>
                <a href={`tel:+${phone.intl}`} className="btn btn-ghost !py-1 text-sm">Telepon lewat HP ({phone.raw})</a>
                <a href={`https://wa.me/${phone.intl}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !py-1 text-sm">WhatsApp</a>
              </>
            )}
          </div>
          <p className="mt-2 text-xs text-ink/60">
            {phone
              ? "Nomor diambil dari CV pelamar. Telepon lewat HP dan WhatsApp dilakukan di aplikasi perangkat Anda."
              : "Pelamar belum mencantumkan nomor telepon di CV, jadi telepon lewat HP dan WhatsApp belum tersedia."}{" "}
            Panggilan suara dan video call terbuka di tab baru lewat layanan Jitsi. Jitsi membatasi satu rapat sampai 95 menit. Jika panggilan berakhir, klik Video call atau Panggilan suara lagi untuk membuat undangan dan ruang baru.
          </p>
        </section>
      )}

      <ChatThread messages={messages} viewerId={s.uid} applicationId={ctx.app.id} otherName={ctx.app.seeker.fullName} />
      <ChatComposer applicationId={ctx.app.id} disabled={!open} />
    </div>
  );
}
