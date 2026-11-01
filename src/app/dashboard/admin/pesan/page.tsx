import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import SupportRefresh from "@/components/SupportRefresh";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pesan Admin" };

const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Jakarta" });
const ROLE_LABEL: Record<string, string> = { SEEKER: "Pelamar", EMPLOYER: "Perusahaan" };

function preview(m: { kind: string; body: string | null }) {
  if (m.kind === "voice") return "Pesan suara";
  if (m.kind === "call") return m.body === "audio" ? "Ajakan panggilan suara" : "Ajakan video call";
  return m.body ?? "";
}

export default async function AdminInbox() {
  await requireRole("ADMIN");
  const recent = await db.supportMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: { userId: true, fromAdmin: true, kind: true, body: true, createdAt: true, readAt: true },
  });
  const byUser = new Map<string, { last: (typeof recent)[number]; unread: number }>();
  for (const m of recent) {
    const cur = byUser.get(m.userId);
    const isUnread = !m.fromAdmin && m.readAt === null;
    if (!cur) byUser.set(m.userId, { last: m, unread: isUnread ? 1 : 0 });
    else if (isUnread) cur.unread += 1;
  }
  const ids = [...byUser.keys()];
  const [people, everyone] = await Promise.all([
    db.user.findMany({ where: { id: { in: ids } }, select: { id: true, fullName: true, role: true, email: true } }),
    db.user.findMany({
      where: { role: { in: ["SEEKER", "EMPLOYER"] } },
      orderBy: { fullName: "asc" },
      take: 200,
      select: { id: true, fullName: true, role: true, email: true },
    }),
  ]);
  const nameOf = new Map(people.map((p) => [p.id, p]));
  const rows = [...byUser.entries()].sort((a, b) => b[1].last.createdAt.getTime() - a[1].last.createdAt.getTime());

  return (
    <div className="max-w-3xl space-y-5">
      <SupportRefresh />
      <p className="text-sm"><Link href="/dashboard/admin" className="underline">Kembali ke dasbor admin</Link></p>
      <h1 className="text-2xl font-extrabold">Pesan</h1>
      <p className="text-sm text-ink/70">Percakapan dengan pelamar dan perusahaan yang mengalami kendala.</p>

      {rows.length === 0 ? (
        <p className="panel text-sm">Belum ada percakapan. Mulailah dari daftar pengguna di bawah.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map(([uid, v]) => {
            const p = nameOf.get(uid);
            return (
              <li key={uid}>
                <Link href={`/dashboard/admin/pesan/${uid}`} className="panel block text-sm hover:bg-brand-soft">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      {p?.fullName ?? "Pengguna"} <span className="tag">{ROLE_LABEL[p?.role ?? ""] ?? "Pengguna"}</span>
                    </p>
                    <span className="flex items-center gap-2 text-xs text-ink/60">
                      {fmt.format(v.last.createdAt)}
                      {v.unread > 0 && <span className="tag">{v.unread} baru</span>}
                    </span>
                  </div>
                  <p className={`mt-1 ${v.unread > 0 ? "font-semibold" : "text-ink/70"}`}>
                    {v.last.fromAdmin ? "Anda: " : ""}{preview(v.last)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <section className="panel space-y-2 text-sm">
        <h2 className="font-bold">Mulai percakapan baru</h2>
        <ul className="space-y-1">
          {everyone.map((u) => (
            <li key={u.id}>
              <Link href={`/dashboard/admin/pesan/${u.id}`} className="underline hover:text-emerald-500">{u.fullName}</Link>{" "}
              <span className="tag">{ROLE_LABEL[u.role] ?? u.role}</span>{" "}
              <span className="text-xs text-ink/60">{u.email}</span>
            </li>
          ))}
          {everyone.length === 0 && <li className="text-ink/60">Belum ada pengguna.</li>}
        </ul>
      </section>
    </div>
  );
}
