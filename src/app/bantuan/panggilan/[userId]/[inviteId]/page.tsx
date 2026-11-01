import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { supportEmbedUrl, supportCallUrl } from "@/lib/support";
import CallRoom from "@/components/CallRoom";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panggilan" };

// Ruang panggilan bantuan: hanya admin dan pemilik percakapan yang boleh masuk
export default async function SupportCallPage({ params }: { params: { userId: string; inviteId: string } }) {
  const s = await getSession();
  if (!s) redirect("/login");
  const isAdmin = s.role === "ADMIN";
  if (!isAdmin && s.uid !== params.userId) notFound();

  const invite = await db.supportMessage.findFirst({
    where: { id: params.inviteId, userId: params.userId, kind: "call" },
    select: { id: true, body: true },
  });
  if (!invite) notFound();
  const mode = invite.body === "audio" ? "audio" : "video";

  const owner = await db.user.findUnique({ where: { id: params.userId }, select: { fullName: true } });
  const myName = isAdmin ? "Admin Lolos Kerja" : s.name;
  const title = isAdmin ? `Panggilan dengan ${owner?.fullName ?? "pengguna"}` : "Panggilan dengan Admin Lolos Kerja";

  return (
    <CallRoom
      title={title}
      mode={mode}
      src={supportEmbedUrl(params.userId, invite.id, mode, myName)}
      newTabUrl={supportCallUrl(params.userId, invite.id, mode)}
      backHref={isAdmin ? `/dashboard/admin/pesan/${params.userId}` : "/bantuan"}
    />
  );
}
