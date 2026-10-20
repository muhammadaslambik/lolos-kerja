import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type InboxRole = "SEEKER" | "EMPLOYER";

// Lamaran yang boleh dilihat pengguna: milik pelamar sendiri, atau lowongan perusahaan tempat ia menjadi anggota
export function appFilter(role: InboxRole, uid: string): Prisma.ApplicationWhereInput {
  return role === "SEEKER" ? { seekerId: uid } : { job: { company: { members: { some: { userId: uid } } } } };
}

export const inboxBase = (role: InboxRole) => (role === "SEEKER" ? "/dashboard/seeker/pesan" : "/dashboard/employer/pesan");

export type UnreadItem = { applicationId: string; title: string; subtitle: string; count: number; href: string };

// Ringkasan pesan belum dibaca untuk tombol notifikasi
export async function unreadSummary(role: InboxRole, uid: string) {
  const where: Prisma.MessageWhereInput = { readAt: null, senderId: { not: uid }, application: appFilter(role, uid) };
  const [total, rows] = await Promise.all([
    db.message.count({ where }),
    db.message.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, select: { applicationId: true } }),
  ]);
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.applicationId, (counts.get(r.applicationId) ?? 0) + 1);
  const ids = Array.from(counts.keys()).slice(0, 5);
  const apps = ids.length
    ? await db.application.findMany({
        where: { id: { in: ids } },
        select: { id: true, seeker: { select: { fullName: true } }, job: { select: { title: true, company: { select: { name: true } } } } },
      })
    : [];
  const byId = new Map(apps.map((a) => [a.id, a]));
  const base = inboxBase(role);
  const items: UnreadItem[] = ids.map((id) => {
    const a = byId.get(id);
    return {
      applicationId: id,
      title: a ? (role === "SEEKER" ? a.job.company.name : a.seeker.fullName) : "Percakapan",
      subtitle: a ? a.job.title : "",
      count: counts.get(id) ?? 0,
      href: `${base}/${id}`,
    };
  });
  return { total, inbox: base, items };
}

export type ConversationRow = {
  applicationId: string;
  title: string;
  subtitle: string;
  preview: string;
  at: Date;
  unread: number;
  href: string;
};

// Daftar percakapan (kotak masuk), diurutkan dari yang terbaru
export async function conversations(role: InboxRole, uid: string): Promise<ConversationRow[]> {
  const rows = await db.message.findMany({
    where: { application: appFilter(role, uid) },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { applicationId: true, kind: true, body: true, senderId: true, createdAt: true, readAt: true },
  });
  const latest = new Map<string, (typeof rows)[number]>();
  const unread = new Map<string, number>();
  for (const r of rows) {
    if (!latest.has(r.applicationId)) latest.set(r.applicationId, r);
    if (r.readAt === null && r.senderId !== uid) unread.set(r.applicationId, (unread.get(r.applicationId) ?? 0) + 1);
  }
  const ids = Array.from(latest.keys()).slice(0, 50);
  const apps = ids.length
    ? await db.application.findMany({
        where: { id: { in: ids } },
        select: { id: true, seeker: { select: { fullName: true } }, job: { select: { title: true, company: { select: { name: true } } } } },
      })
    : [];
  const byId = new Map(apps.map((a) => [a.id, a]));
  const base = inboxBase(role);
  return ids.map((id) => {
    const m = latest.get(id)!;
    const a = byId.get(id);
    const text = m.kind === "text" ? (m.body ?? "").slice(0, 80) : m.kind === "voice" ? "Pesan suara" : "Undangan panggilan";
    return {
      applicationId: id,
      title: a ? (role === "SEEKER" ? a.job.company.name : a.seeker.fullName) : "Percakapan",
      subtitle: a ? a.job.title : "",
      preview: `${m.senderId === uid ? "Anda: " : ""}${text}`,
      at: m.createdAt,
      unread: unread.get(id) ?? 0,
      href: `${base}/${id}`,
    };
  });
}
