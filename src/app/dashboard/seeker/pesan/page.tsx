import Link from "next/link";
import { requireRole } from "@/lib/session";
import { conversations } from "@/lib/inbox";
import ConversationList from "@/components/ConversationList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pesan" };

export default async function SeekerInbox() {
  const s = await requireRole("SEEKER");
  const rows = await conversations("SEEKER", s.uid);
  return (
    <div className="max-w-3xl space-y-3">
      <p className="text-sm"><Link href="/dashboard/seeker" className="underline">Kembali ke dasbor</Link></p>
      <h1 className="text-2xl font-extrabold">Pesan</h1>
      <ConversationList rows={rows} />
    </div>
  );
}
