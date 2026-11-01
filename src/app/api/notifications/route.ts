import { getSession } from "@/lib/session";
import { unreadSummary } from "@/lib/inbox";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const ADMIN_INBOX = "/dashboard/admin/pesan";

// Ringkasan untuk admin: pesan bantuan yang belum dibaca, dikelompokkan per pengguna.
async function adminSummary() {
  try {
    const groups = await db.supportMessage.groupBy({
      by: ["userId"],
      where: { fromAdmin: false, readAt: null },
      _count: { _all: true },
    });
    const ids = groups.map((g) => g.userId);
    const users = ids.length
      ? await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
      : [];
    const names = new Map(users.map((u) => [u.id, u.name]));
    const items = groups.map((g) => ({
      applicationId: g.userId,
      title: names.get(g.userId) ?? "Pengguna",
      subtitle: "Pesan bantuan",
      count: g._count._all,
      href: ADMIN_INBOX,
    }));
    const total = items.reduce((n, i) => n + i.count, 0);
    return { total, inbox: ADMIN_INBOX, items };
  } catch {
    // Tabel belum ada atau galat sesaat: tombol tetap tampil tanpa angka.
    return { total: 0, inbox: ADMIN_INBOX, items: [] };
  }
}

export async function GET() {
  const s = await getSession();
  if (!s) return json({ error: "Silakan masuk." }, 401);
  if (s.role === "ADMIN") return json(await adminSummary());
  if (s.role !== "SEEKER" && s.role !== "EMPLOYER") return json({ error: "Silakan masuk." }, 401);
  return json(await unreadSummary(s.role, s.uid));
}
