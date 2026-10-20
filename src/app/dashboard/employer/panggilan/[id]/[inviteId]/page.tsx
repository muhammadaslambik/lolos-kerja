import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { callEmbedUrl, callUrl, canChat, getChatContext } from "@/lib/chat";
import CallRoom from "@/components/CallRoom";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panggilan" };

export default async function Call({ params }: { params: { id: string; inviteId: string } }) {
  const s = await requireRole("EMPLOYER");
  const ctx = await getChatContext(params.id, s);
  if (!ctx || ctx.side !== "employer") notFound();

  const chatPath = `/dashboard/employer/pesan/${ctx.app.id}`;
  if (!canChat(ctx.app.stage)) redirect(chatPath);

  const invite = await db.message.findFirst({
    where: { id: params.inviteId, applicationId: ctx.app.id, kind: "call" },
    select: { body: true },
  });
  if (!invite) notFound();
  const mode = invite.body === "audio" ? "audio" : "video";

  return (
    <CallRoom
      title={`Panggilan dengan ${ctx.app.seeker.fullName}`}
      mode={mode}
      src={callEmbedUrl(ctx.app.id, params.inviteId, mode, s.name)}
      newTabUrl={callUrl(ctx.app.id, params.inviteId, mode)}
      backHref={chatPath}
    />
  );
}
