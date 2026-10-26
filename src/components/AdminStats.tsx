"use client";
import { useState } from "react";

export type StatSection = { heading?: string; columns: string[]; rows: string[][] };
export type StatCard = {
  key: string;
  label: string;
  value: string | number;
  title: string;
  note?: string;
  sections: StatSection[];
};

export default function AdminStats({ cards }: { cards: StatCard[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const active = cards.find((c) => c.key === open);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-4">
        {cards.map((c) => {
          const sel = c.key === open;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setOpen(sel ? null : c.key)}
              aria-expanded={sel}
              aria-controls="stat-detail"
              className={`group panel text-left transition-colors ${sel ? "!border-brand" : "hover:!border-brand/60"}`}
            >
              <p className="text-2xl font-extrabold transition-colors group-hover:text-emerald-500">{c.value}</p>
              <p className="text-sm text-ink/70 transition-colors group-hover:text-emerald-500">{c.label}</p>
              <p className="mt-1 text-xs text-ink/50">{sel ? "Klik untuk menutup" : "Klik untuk lihat detail"}</p>
            </button>
          );
        })}
      </div>

      {active && (
        <section id="stat-detail" className="panel space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-bold">{active.title}</h2>
            <button type="button" onClick={() => setOpen(null)} className="btn btn-ghost !py-1 text-xs">Tutup</button>
          </div>
          {active.note && <p className="text-xs text-ink/60">{active.note}</p>}
          {active.sections.map((sec, i) => (
            <div key={i}>
              {sec.heading && <h3 className="mb-1 text-sm font-semibold">{sec.heading}</h3>}
              {sec.rows.length === 0 ? (
                <p className="text-sm text-ink/60">Belum ada data.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs text-ink/60">
                        {sec.columns.map((col) => (
                          <th key={col} className="whitespace-nowrap px-2 py-1 font-semibold">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sec.rows.map((r, ri) => (
                        <tr key={ri} className="border-t border-line">
                          {r.map((cell, ci) => (
                            <td key={ci} className="px-2 py-1.5 align-top">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
