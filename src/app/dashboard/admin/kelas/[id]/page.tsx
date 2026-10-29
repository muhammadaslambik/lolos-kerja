import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { youtubeId, youtubeWatchUrl } from "@/lib/youtube";
import { moduleQuestions, type Q } from "@/lib/quiz-edit";
import type { VideoItem } from "@/lib/videos";
import {
  addLesson,
  addModule,
  addVideo,
  deleteQuestion,
  deleteVideo,
  saveQuestion,
  updateLesson,
  updateModule,
} from "@/app/actions/admin-courses";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kelola Isi Kelas" };

function VideoManager({ kind, refId, items }: { kind: "LESSON" | "QUIZ"; refId: string; items: VideoItem[] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">Video ({items.length})</h4>
      {items.length === 0 ? (
        <p className="text-xs text-ink/60">Belum ada video.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {items.map((v, i) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line p-2">
              <span>
                {i + 1}. {v.title ? `${v.title}: ` : ""}
                <a href={youtubeWatchUrl(v.youtubeId)} target="_blank" rel="noopener noreferrer" className="underline">
                  youtube.com/watch?v={v.youtubeId}
                </a>
              </span>
              <form action={deleteVideo}>
                <input type="hidden" name="id" value={v.id} />
                <button className="btn btn-ghost !py-1 text-xs">Hapus</button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form action={addVideo} className="grid gap-2 md:grid-cols-[1fr_12rem_auto] md:items-end">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="refId" value={refId} />
        <div>
          <label className="mb-1 block text-xs font-semibold">Link YouTube</label>
          <input name="url" required maxLength={300} placeholder="https://www.youtube.com/watch?v=..." aria-label="Link video YouTube" className="field" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">Judul (opsional)</label>
          <input name="title" maxLength={120} aria-label="Judul video" className="field" />
        </div>
        <button className="btn btn-primary !py-2 text-sm">Tambah video</button>
      </form>
    </div>
  );
}

function QuestionForm({ moduleId, index, item }: { moduleId: string; index: number | "new"; item?: Q }) {
  return (
    <form action={saveQuestion} className="space-y-2">
      <input type="hidden" name="moduleId" value={moduleId} />
      <input type="hidden" name="index" value={String(index)} />
      <div>
        <label className="mb-1 block text-xs font-semibold">Soal</label>
        <textarea name="q" rows={2} required maxLength={500} defaultValue={item?.q ?? ""} aria-label="Teks soal" className="field" />
      </div>
      <fieldset className="space-y-1">
        <legend className="text-xs font-semibold">Pilihan jawaban (isi minimal 2, lalu pilih bulatan di samping jawaban yang benar)</legend>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="answer"
              value={i}
              defaultChecked={item ? item.answerIdx === i : i === 0}
              aria-label={`Pilihan ${i + 1} adalah jawaban benar`}
            />
            <input name={`opt${i}`} defaultValue={item?.options[i] ?? ""} maxLength={300} placeholder={`Pilihan ${i + 1}`} aria-label={`Teks pilihan ${i + 1}`} className="field" />
          </div>
        ))}
      </fieldset>
      <div>
        <label className="mb-1 block text-xs font-semibold">Pembahasan (opsional)</label>
        <textarea name="explanation" rows={2} maxLength={800} defaultValue={item?.explanation ?? ""} aria-label="Pembahasan" className="field" />
      </div>
      <button className="btn btn-primary !py-1 text-sm">{index === "new" ? "Tambah soal" : "Simpan soal"}</button>
    </form>
  );
}

export default async function CourseEditor({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { ok?: string; error?: string };
}) {
  await requireRole("ADMIN");
  const course = await db.course.findUnique({
    where: { id: params.id },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: { lessons: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  if (!course) notFound();

  const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const moduleIds = course.modules.map((m) => m.id);
  const videoRows = await db.learningVideo.findMany({
    where: { OR: [{ kind: "LESSON", refId: { in: lessonIds } }, { kind: "QUIZ", refId: { in: moduleIds } }] },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const quizByModule = new Map<string, Q[]>();
  for (const m of course.modules) quizByModule.set(m.id, (await moduleQuestions(m.id)).list);

  const lessonVideoItems = (l: { id: string; videoRef: string | null }): VideoItem[] => {
    const out: VideoItem[] = [];
    const legacy = l.videoRef ? youtubeId(l.videoRef) : null;
    if (legacy) out.push({ id: `legacy:${l.id}`, youtubeId: legacy, title: null });
    for (const r of videoRows) if (r.kind === "LESSON" && r.refId === l.id) out.push({ id: r.id, youtubeId: r.youtubeId, title: r.title });
    return out;
  };
  const quizVideoItems = (moduleId: string): VideoItem[] =>
    videoRows.filter((r) => r.kind === "QUIZ" && r.refId === moduleId).map((r) => ({ id: r.id, youtubeId: r.youtubeId, title: r.title }));

  return (
    <div className="max-w-4xl space-y-5">
      <p className="text-sm">
        <Link href="/dashboard/admin/kelas" className="underline">Kembali ke daftar kelas</Link>
      </p>
      <div>
        <h1 className="text-2xl font-extrabold">{course.title}</h1>
        <p className="mt-1 text-sm text-ink/70">
          <span className="tag">{course.published ? "Tayang" : "Draf"}</span>{" "}
          <Link href={`/courses/${course.slug}`} className="underline">Lihat sebagai peserta</Link>
        </p>
      </div>

      {searchParams.ok && <p role="status" className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">{searchParams.ok}</p>}
      {searchParams.error && <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{searchParams.error}</p>}

      {course.modules.map((m, mi) => {
        const questions = quizByModule.get(m.id) ?? [];
        return (
          <section key={m.id} id={`m-${m.id}`} className="panel space-y-5">
            <form action={updateModule} className="grid gap-2 md:grid-cols-[1fr_6rem_auto] md:items-end">
              <input type="hidden" name="id" value={m.id} />
              <div>
                <label className="mb-1 block text-xs font-semibold">Modul {mi + 1}: judul</label>
                <input name="title" defaultValue={m.title} maxLength={120} required aria-label="Judul modul" className="field" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Urutan</label>
                <input name="sortOrder" type="number" min={0} defaultValue={m.sortOrder} aria-label="Urutan modul" className="field" />
              </div>
              <button className="btn btn-ghost !py-2 text-sm">Simpan modul</button>
            </form>

            <div className="space-y-2">
              <h3 className="font-bold">Materi tertulis</h3>
              {m.lessons.map((l) => {
                const items = lessonVideoItems(l);
                return (
                  <details key={l.id} id={`l-${l.id}`} className="rounded-md border border-line">
                    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 p-3 text-sm">
                      <span className="font-semibold">{l.title}</span>
                      <span className="tag">{items.length} video</span>
                    </summary>
                    <div className="space-y-4 border-t border-line p-3">
                      <form action={updateLesson} className="space-y-2">
                        <input type="hidden" name="id" value={l.id} />
                        <div className="grid gap-2 md:grid-cols-[1fr_6rem]">
                          <div>
                            <label className="mb-1 block text-xs font-semibold">Judul pelajaran</label>
                            <input name="title" defaultValue={l.title} required maxLength={150} aria-label="Judul pelajaran" className="field" />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold">Urutan</label>
                            <input name="sortOrder" type="number" min={0} defaultValue={l.sortOrder} aria-label="Urutan pelajaran" className="field" />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold">Isi materi (teks)</label>
                          <textarea name="content" rows={10} maxLength={20000} defaultValue={l.content ?? ""} aria-label="Isi materi" className="field" />
                          <p className="mt-1 text-xs text-ink/60">Baris kosong akan tampil sebagai pemisah paragraf.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button className="btn btn-primary !py-1 text-sm">Simpan pelajaran</button>
                          <Link href={`/courses/${course.slug}/belajar/${l.id}`} className="btn btn-ghost !py-1 text-sm">Lihat sebagai peserta</Link>
                        </div>
                      </form>
                      <VideoManager kind="LESSON" refId={l.id} items={items} />
                    </div>
                  </details>
                );
              })}
              {m.lessons.length === 0 && <p className="text-sm text-ink/60">Belum ada pelajaran di modul ini.</p>}

              <details className="rounded-md border border-dashed border-line">
                <summary className="cursor-pointer p-3 text-sm font-semibold">Tambah pelajaran baru</summary>
                <form action={addLesson} className="space-y-2 border-t border-line p-3">
                  <input type="hidden" name="moduleId" value={m.id} />
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Judul pelajaran</label>
                    <input name="title" required maxLength={150} aria-label="Judul pelajaran baru" className="field" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Isi materi (teks)</label>
                    <textarea name="content" rows={8} maxLength={20000} aria-label="Isi materi baru" className="field" />
                  </div>
                  <button className="btn btn-primary !py-1 text-sm">Tambah pelajaran</button>
                </form>
              </details>
            </div>

            <div id={`q-${m.id}`} className="space-y-3">
              <h3 className="font-bold">Kuis modul ({questions.length} soal)</h3>
              {questions.map((q, qi) => (
                <details key={qi} className="rounded-md border border-line">
                  <summary className="cursor-pointer p-3 text-sm font-semibold">{qi + 1}. {q.q}</summary>
                  <div className="space-y-3 border-t border-line p-3">
                    <QuestionForm moduleId={m.id} index={qi} item={q} />
                    <form action={deleteQuestion}>
                      <input type="hidden" name="moduleId" value={m.id} />
                      <input type="hidden" name="index" value={String(qi)} />
                      <button className="btn btn-ghost !py-1 text-xs">Hapus soal ini</button>
                    </form>
                  </div>
                </details>
              ))}
              {questions.length === 0 && <p className="text-sm text-ink/60">Belum ada soal di modul ini.</p>}
              <details className="rounded-md border border-dashed border-line">
                <summary className="cursor-pointer p-3 text-sm font-semibold">Tambah soal baru</summary>
                <div className="border-t border-line p-3">
                  <QuestionForm moduleId={m.id} index="new" />
                </div>
              </details>
              <VideoManager kind="QUIZ" refId={m.id} items={quizVideoItems(m.id)} />
            </div>
          </section>
        );
      })}

      <section className="panel">
        <form action={addModule} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="courseId" value={course.id} />
          <div className="min-w-[14rem] flex-1">
            <label className="mb-1 block text-sm font-semibold">Tambah modul baru</label>
            <input name="title" required maxLength={120} placeholder="Judul modul" aria-label="Judul modul baru" className="field" />
          </div>
          <button className="btn btn-primary">Tambah modul</button>
        </form>
      </section>
    </div>
  );
}
