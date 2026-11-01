import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { startSupportCall } from "@/app/actions/support";
import { userPhone } from "@/lib/support";
import SupportThread from "@/components/SupportThread";
import SupportComposer from "@/components/SupportComposer";
import SupportRefresh from "@/components/SupportRefresh";

export const dynamic = "force-dynamic";
export const metadata = { title: "Percakapan" };

const ROLE_LABEL: Record<string, string> = { SEEKER: "Pelamar", EMPLOYER: "Perusahaan" };

export default async function AdminChat({ params }: { params: { userId: string } }) {
  await requireRole("ADMIN");
  const user = await db.user.findUnique({
    where: { id: params.userId },
    select: { id: true, fullName: true, email: true, role: true },
  });
  if (!user || user.role === "ADMIN") notFound();

  await db.supportMessage.updateMany({ where: { userId: user.id, fromAdmin: false, readAt: null }, data: { readAt: new Date() } });
  const [rows, phone] = await Promise.all([
    db.supportMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, fromAdmin: true, kind: true, body: true, audioMime: true, audioSeconds: true, createdAt: true },
    }),
    userPhone(user.id),
  ]);
  const messages = rows.reverse();

  return (
    <div className="max-w-3xl space-y-4">
      <SupportRefresh />
      <p className="text-sm"><Link href="/dashboard/admin/pesan" className="underline">Kembali ke daftar pesan</Link></p>
      <div>
        <h1 className="text-2xl font-extrabold">{user.fullName}</h1>
        <p className="mt-1 text-sm text-ink/70">
          <span className="tag">{ROLE_LABEL[user.role] ?? user.role}</span> {user.email}
        </p>
      </div>

      <section className="panel space-y-2 text-sm">
        <h2 className="font-bold">Hubungi pengguna</h2>
        <div className="flex flex-wrap items-start gap-2">
          <form action={startSupportCall}>
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="mode" value="audio" />
            <button className="btn btn-ghost !py-1 text-sm">Panggilan suara di website</button>
          </form>
          <form action={startSupportCall}>
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="mode" value="video" />
            <button className="btn btn-primary !py-1 text-sm">Video call</button>
          </form>
          {phone && (
            <>
              <a href={`tel:+${phone.intl}`} className="btn btn-ghost !py-1 text-sm">Telepon lewat HP ({phone.raw})</a>
              <a href={`https://wa.me/${phone.intl}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !py-1 text-sm">WhatsApp</a>
            </>
          )}
        </div>
        {!phone && (
          <p className="text-xs text-ink/60">Pengguna ini belum mencantumkan nomor telepon di CV atau data perusahaan, jadi telepon lewat HP dan WhatsApp belum tersedia.</p>
        )}
        <p className="text-xs text-ink/60">Undangan panggilan muncul di halaman Bantuan pengguna. Pengguna perlu membukanya untuk bergabung.</p>
      </section>

      <SupportThread messages={messages} viewerIsAdmin userId={user.id} otherName={user.fullName} />
      <SupportComposer endpoint={`/api/support/${user.id}/messages`} />
    </div>
  );
}
