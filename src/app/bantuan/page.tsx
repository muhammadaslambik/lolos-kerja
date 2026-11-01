import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { startSupportCall } from "@/app/actions/support";
import SupportThread from "@/components/SupportThread";
import SupportComposer from "@/components/SupportComposer";
import SupportRefresh from "@/components/SupportRefresh";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bantuan" };

// Percakapan pengguna (pelamar atau perusahaan) dengan admin Lolos Kerja
export default async function SupportPage() {
  const s = await getSession();
  if (!s) redirect("/login?next=/bantuan");
  if (s.role !== "SEEKER" && s.role !== "EMPLOYER") redirect("/dashboard/admin/pesan");

  await db.supportMessage.updateMany({ where: { userId: s.uid, fromAdmin: true, readAt: null }, data: { readAt: new Date() } });
  const rows = await db.supportMessage.findMany({
    where: { userId: s.uid },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, fromAdmin: true, kind: true, body: true, audioMime: true, audioSeconds: true, createdAt: true },
  });
  const messages = rows.reverse();

  return (
    <div className="max-w-3xl space-y-4">
      <SupportRefresh />
      <div>
        <h1 className="text-2xl font-extrabold">Bantuan</h1>
        <p className="mt-1 text-sm text-ink/70">
          Ada kendala di Lolos Kerja? Kirim pesan, pesan suara, atau ajak admin berbicara lewat panggilan suara atau video call.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <form action={startSupportCall}>
          <input type="hidden" name="userId" value={s.uid} />
          <input type="hidden" name="mode" value="audio" />
          <button className="btn btn-ghost !py-1 text-sm">Panggilan suara</button>
        </form>
        <form action={startSupportCall}>
          <input type="hidden" name="userId" value={s.uid} />
          <input type="hidden" name="mode" value="video" />
          <button className="btn btn-ghost !py-1 text-sm">Video call</button>
        </form>
      </div>

      <SupportThread messages={messages} viewerIsAdmin={false} userId={s.uid} otherName="Admin Lolos Kerja" />
      <SupportComposer endpoint={`/api/support/${s.uid}/messages`} />
      <p className="text-xs text-ink/60">
        Percakapan ini hanya dapat dibaca oleh Anda dan admin Lolos Kerja. Panggilan berlangsung di halaman ini lewat layanan Jitsi.
      </p>
    </div>
  );
}
