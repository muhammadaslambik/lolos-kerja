"use client";
import { useEffect, useRef, useState } from "react";
import type { Block, Card, Cell, Detail } from "@/lib/admin-types";

const LINK =
  "text-left underline decoration-dotted underline-offset-2 transition-colors hover:text-emerald-500";

function CellView({ cell, go }: { cell: Cell; go: (ref: string) => void }) {
  if (typeof cell === "string") return <>{cell}</>;
  return (
    <button type="button" onClick={() => go(cell.ref)} className={LINK}>
      {cell.text}
    </button>
  );
}

function Table({ columns, rows, go }: { columns: string[]; rows: Cell[][]; go: (ref: string) => void }) {
  if (rows.length === 0) return <p className="text-sm text-ink/60">Belum ada data.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs text-ink/60">
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-2 py-1 font-semibold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-line">
              {r.map((cell, ci) => (
                <td key={ci} className="px-2 py-1.5 align-top">
                  <CellView cell={cell} go={go} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BlockView({ b, go }: { b: Block; go: (ref: string) => void }) {
  const tone =
    b.tone === "good"
      ? "border-emerald-500/40 bg-emerald-500/10"
      : b.tone === "bad"
        ? "border-red-500/40 bg-red-500/10"
        : "border-line";
  return (
    <section className={`space-y-2 rounded-md border p-3 ${tone}`}>
      {b.title && <h3 className="text-sm font-bold">{b.title}</h3>}
      {b.fields && (
        <dl className="space-y-1">
          {b.fields.map((f) => (
            <div key={f.label} className="grid grid-cols-3 gap-2 text-sm">
              <dt className="text-ink/60">{f.label}</dt>
              <dd className="col-span-2 whitespace-pre-line break-words">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {b.text && <p className="whitespace-pre-line text-sm leading-relaxed">{b.text}</p>}
      {b.list && (
        <ul className="space-y-1.5 text-sm">
          {b.list.map((it, i) => (
            <li key={i}>
              {it.ref ? (
                <button type="button" onClick={() => go(it.ref as string)} className={LINK}>{it.text}</button>
              ) : it.href ? (
                <a href={it.href} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-500">{it.text}</a>
              ) : (
                <span>{it.text}</span>
              )}
              {it.sub && <p className="text-xs text-ink/70">{it.sub}</p>}
            </li>
          ))}
          {b.list.length === 0 && <li className="text-ink/60">Belum ada data.</li>}
        </ul>
      )}
      {b.table && <Table columns={b.table.columns} rows={b.table.rows} go={go} />}
    </section>
  );
}

export default function AdminStats({
  cards,
  details,
  verify,
}: {
  cards: Card[];
  details: Record<string, Detail>;
  verify: (fd: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [stack, setStack] = useState<string[]>([]);
  const panelRef = useRef<HTMLElement>(null);
  const active = cards.find((c) => c.key === open);
  const current = stack.length ? details[stack[stack.length - 1]] : undefined;

  useEffect(() => {
    if (stack.length) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stack]);

  const go = (ref: string) => {
    if (details[ref]) setStack((s) => [...s, ref]);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => {
          const sel = c.key === open;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                setOpen(sel ? null : c.key);
                setStack([]);
              }}
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
            <button type="button" onClick={() => { setOpen(null); setStack([]); }} className="btn btn-ghost !py-1 text-xs">Tutup</button>
          </div>
          {active.note && <p className="text-xs text-ink/60">{active.note}</p>}
          {active.sections.map((sec, i) => (
            <div key={i}>
              {sec.heading && <h3 className="mb-1 text-sm font-semibold">{sec.heading}</h3>}
              <Table columns={sec.columns} rows={sec.rows} go={go} />
            </div>
          ))}
        </section>
      )}

      {current && (
        <section ref={panelRef} className="panel space-y-3 scroll-mt-20">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold">{current.title}</h2>
              {current.subtitle && <p className="text-sm text-ink/70">{current.subtitle}</p>}
            </div>
            <div className="flex gap-2">
              {stack.length > 1 && (
                <button type="button" onClick={() => setStack((s) => s.slice(0, -1))} className="btn btn-ghost !py-1 text-xs">Kembali</button>
              )}
              <button type="button" onClick={() => setStack([])} className="btn btn-ghost !py-1 text-xs">Tutup</button>
            </div>
          </div>

          {current.links && current.links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {current.links.map((l) => (
                <a key={l.href} href={l.href} className="btn btn-primary !py-1 text-sm">{l.label}</a>
              ))}
            </div>
          )}

          {current.blocks.map((b, i) => (
            <BlockView key={i} b={b} go={go} />
          ))}

          {current.verifyCompanyId && (
            <form action={verify} className="space-y-2 rounded-md border border-line p-3">
              <input type="hidden" name="id" value={current.verifyCompanyId} />
              <label htmlFor="verify-note" className="block text-sm font-semibold">Catatan untuk perusahaan (isi alasan bila menolak)</label>
              <textarea id="verify-note" name="note" rows={2} maxLength={1000} className="field" />
              <div className="flex gap-2">
                <button name="status" value="VERIFIED" className="btn btn-primary !py-1">Setujui</button>
                <button name="status" value="REJECTED" className="btn btn-ghost !py-1">Tolak</button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
