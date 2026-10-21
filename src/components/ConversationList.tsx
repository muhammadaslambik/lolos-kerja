import Link from "next/link";
import type { ConversationRow } from "@/lib/inbox";

const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Jakarta" });

export default function ConversationList({ rows }: { rows: ConversationRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="panel text-sm">
        Belum ada percakapan. Perusahaan memulainya dari jendela CV pelamar, dan pelamar memulainya lewat tombol Pesan di daftar Status lamaran.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.applicationId}>
          <Link href={r.href} className="panel block text-sm hover:bg-brand-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{r.title}</p>
              <span className="flex items-center gap-2 text-xs text-ink/60">
                {fmt.format(r.at)}
                {r.unread > 0 && <span className="tag">{r.unread} baru</span>}
              </span>
            </div>
            {r.subtitle && <p className="text-xs text-ink/70">{r.subtitle}</p>}
            <p className={`mt-1 ${r.unread > 0 ? "font-semibold" : "text-ink/70"}`}>{r.preview}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
