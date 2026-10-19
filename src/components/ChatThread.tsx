import { callUrl } from "@/lib/chat";

export type ChatMessage = {
  id: string;
  senderId: string;
  kind: string;
  body: string | null;
  audioMime: string | null;
  audioSeconds: number | null;
  createdAt: Date;
};

const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Jakarta" });

export default function ChatThread({
  messages,
  viewerId,
  applicationId,
  otherName,
}: {
  messages: ChatMessage[];
  viewerId: string;
  applicationId: string;
  otherName: string;
}) {
  if (messages.length === 0) {
    return <p className="panel text-sm">Belum ada pesan. Mulailah dengan menyapa.</p>;
  }
  return (
    // flex-col-reverse menjaga daftar tetap terscroll ke pesan terbaru
    <div className="flex max-h-[55vh] flex-col-reverse overflow-y-auto rounded-lg border border-line p-3">
      <ul className="space-y-3">
        {messages.map((m) => {
          const mine = m.senderId === viewerId;
          const mode = m.body === "audio" ? "audio" : "video";
          return (
            <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg border border-line px-3 py-2 text-sm ${mine ? "bg-brand-soft" : "bg-surface"}`}>
                <p className="text-xs font-semibold text-ink/70">{mine ? "Anda" : otherName}</p>

                {m.kind === "text" && <p className="mt-1 whitespace-pre-line break-words">{m.body}</p>}

                {m.kind === "voice" &&
                  (m.audioMime ? (
                    <div className="mt-1">
                      <audio controls preload="none" src={`/api/messages/${m.id}/audio`} className="w-56 max-w-full" />
                      <p className="text-xs text-ink/60">{m.audioSeconds ?? 0} detik</p>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-ink/60">Pesan suara sudah dihapus (lebih dari 30 hari).</p>
                  ))}

                {m.kind === "call" && (
                  <div className="mt-1">
                    <p>
                      {mine ? "Anda mengajak" : `${otherName} mengajak`} {mode === "audio" ? "panggilan suara" : "video call"}.
                    </p>
                    <a
                      href={callUrl(applicationId, m.id, mode)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary mt-2 inline-block !py-1 text-xs"
                    >
                      Gabung sekarang
                    </a>
                  </div>
                )}

                <p className="mt-1 text-right text-[10px] text-ink/50">{fmt.format(m.createdAt)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
