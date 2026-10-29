"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { youtubeId } from "@/lib/youtube";
import { moduleQuestions, writeQuestions, type Q } from "@/lib/quiz-edit";

const BASE = "/dashboard/admin/kelas";

const str = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
const num = (fd: FormData, k: string, def: number) => {
  const n = parseInt(String(fd.get(k) ?? ""), 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 9999) : def;
};

function go(courseId: string, kind: "ok" | "error", msg: string, anchor = ""): never {
  revalidatePath(`${BASE}/${courseId}`);
  redirect(`${BASE}/${courseId}?${kind}=${encodeURIComponent(msg)}${anchor ? `#${anchor}` : ""}`);
}

async function courseOfModule(moduleId: string): Promise<string> {
  const m = await db.module.findUnique({ where: { id: moduleId }, select: { courseId: true } });
  if (!m) redirect(BASE);
  return m.courseId;
}

// ---------- Modul ----------
export async function addModule(fd: FormData): Promise<void> {
  await requireRole("ADMIN");
  const courseId = str(fd, "courseId", 60);
  const course = await db.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) return redirect(BASE);
  const title = str(fd, "title", 120);
  if (title.length < 2) return go(courseId, "error", "Judul modul minimal 2 karakter.");
  const last = await db.module.aggregate({ where: { courseId }, _max: { sortOrder: true } });
  const m = await db.module.create({ data: { courseId, title, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
  return go(courseId, "ok", "Modul ditambahkan.", `m-${m.id}`);
}

export async function updateModule(fd: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = str(fd, "id", 60);
  const courseId = await courseOfModule(id);
  const title = str(fd, "title", 120);
  if (title.length < 2) return go(courseId, "error", "Judul modul minimal 2 karakter.", `m-${id}`);
  await db.module.update({ where: { id }, data: { title, sortOrder: num(fd, "sortOrder", 0) } });
  return go(courseId, "ok", "Modul disimpan.", `m-${id}`);
}

// ---------- Pelajaran (materi tertulis) ----------
export async function addLesson(fd: FormData): Promise<void> {
  await requireRole("ADMIN");
  const moduleId = str(fd, "moduleId", 60);
  const courseId = await courseOfModule(moduleId);
  const title = str(fd, "title", 150);
  if (title.length < 2) return go(courseId, "error", "Judul pelajaran minimal 2 karakter.", `m-${moduleId}`);
  const content = str(fd, "content", 20000);
  const last = await db.lesson.aggregate({ where: { moduleId }, _max: { sortOrder: true } });
  const l = await db.lesson.create({
    data: { moduleId, title, type: "text", content: content || null, sortOrder: (last._max.sortOrder ?? 0) + 1 },
  });
  return go(courseId, "ok", "Pelajaran ditambahkan.", `l-${l.id}`);
}

export async function updateLesson(fd: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = str(fd, "id", 60);
  const lesson = await db.lesson.findUnique({ where: { id }, select: { module: { select: { courseId: true } } } });
  if (!lesson) return redirect(BASE);
  const courseId = lesson.module.courseId;
  const title = str(fd, "title", 150);
  if (title.length < 2) return go(courseId, "error", "Judul pelajaran minimal 2 karakter.", `l-${id}`);
  const content = str(fd, "content", 20000);
  await db.lesson.update({ where: { id }, data: { title, content: content || null, sortOrder: num(fd, "sortOrder", 0) } });
  return go(courseId, "ok", "Pelajaran disimpan.", `l-${id}`);
}

// ---------- Video (pelajaran dan kuis) ----------
export async function addVideo(fd: FormData): Promise<void> {
  await requireRole("ADMIN");
  const kind = str(fd, "kind", 10);
  const refId = str(fd, "refId", 60);
  let courseId: string;
  let anchor: string;
  if (kind === "LESSON") {
    const l = await db.lesson.findUnique({ where: { id: refId }, select: { module: { select: { courseId: true } } } });
    if (!l) return redirect(BASE);
    courseId = l.module.courseId;
    anchor = `l-${refId}`;
  } else if (kind === "QUIZ") {
    courseId = await courseOfModule(refId);
    anchor = `q-${refId}`;
  } else {
    return redirect(BASE);
  }
  const yt = youtubeId(str(fd, "url", 300));
  if (!yt) return go(courseId, "error", "Link tidak valid. Gunakan link video YouTube.", anchor);
  const dup = await db.learningVideo.findFirst({ where: { kind, refId, youtubeId: yt }, select: { id: true } });
  if (dup) return go(courseId, "error", "Video itu sudah ada di bagian ini.", anchor);
  const last = await db.learningVideo.aggregate({ where: { kind, refId }, _max: { sortOrder: true } });
  await db.learningVideo.create({
    data: { kind, refId, youtubeId: yt, title: str(fd, "title", 120) || null, sortOrder: (last._max.sortOrder ?? 0) + 1 },
  });
  return go(courseId, "ok", "Video ditambahkan.", anchor);
}

export async function deleteVideo(fd: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = str(fd, "id", 80);
  if (id.startsWith("legacy:")) {
    const lessonId = id.slice(7);
    const l = await db.lesson.findUnique({ where: { id: lessonId }, select: { module: { select: { courseId: true } } } });
    if (!l) return redirect(BASE);
    await db.lesson.update({ where: { id: lessonId }, data: { videoRef: null, type: "text" } });
    return go(l.module.courseId, "ok", "Video dihapus.", `l-${lessonId}`);
  }
  const v = await db.learningVideo.findUnique({ where: { id } });
  if (!v) return redirect(BASE);
  let courseId: string;
  if (v.kind === "LESSON") {
    const l = await db.lesson.findUnique({ where: { id: v.refId }, select: { module: { select: { courseId: true } } } });
    if (!l) {
      await db.learningVideo.delete({ where: { id } });
      return redirect(BASE);
    }
    courseId = l.module.courseId;
  } else {
    courseId = await courseOfModule(v.refId);
  }
  await db.learningVideo.delete({ where: { id } });
  return go(courseId, "ok", "Video dihapus.", v.kind === "LESSON" ? `l-${v.refId}` : `q-${v.refId}`);
}

// ---------- Soal kuis ----------
export async function saveQuestion(fd: FormData): Promise<void> {
  await requireRole("ADMIN");
  const moduleId = str(fd, "moduleId", 60);
  const courseId = await courseOfModule(moduleId);
  const anchor = `q-${moduleId}`;
  const q = str(fd, "q", 500);
  if (q.length < 3) return go(courseId, "error", "Teks soal minimal 3 karakter.", anchor);

  const opts: { text: string; i: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const t = str(fd, `opt${i}`, 300);
    if (t) opts.push({ text: t, i });
  }
  if (opts.length < 2) return go(courseId, "error", "Isi minimal 2 pilihan jawaban.", anchor);
  const ans = Number(fd.get("answer"));
  const pos = opts.findIndex((o) => o.i === ans);
  if (pos < 0) return go(courseId, "error", "Pilih jawaban yang benar dari pilihan yang terisi.", anchor);
  const item: Q = { q, options: opts.map((o) => o.text), answerIdx: pos, explanation: str(fd, "explanation", 800) };

  const { rows, list } = await moduleQuestions(moduleId);
  const idxRaw = str(fd, "index", 8);
  if (idxRaw === "new") {
    list.push(item);
  } else {
    const idx = parseInt(idxRaw, 10);
    if (!Number.isInteger(idx) || idx < 0 || idx >= list.length) return go(courseId, "error", "Soal tidak ditemukan.", anchor);
    list[idx] = item;
  }
  await writeQuestions(moduleId, rows, list);
  return go(courseId, "ok", idxRaw === "new" ? "Soal ditambahkan." : "Soal disimpan.", anchor);
}

export async function deleteQuestion(fd: FormData): Promise<void> {
  await requireRole("ADMIN");
  const moduleId = str(fd, "moduleId", 60);
  const courseId = await courseOfModule(moduleId);
  const anchor = `q-${moduleId}`;
  const { rows, list } = await moduleQuestions(moduleId);
  const idx = parseInt(str(fd, "index", 8), 10);
  if (!Number.isInteger(idx) || idx < 0 || idx >= list.length) return go(courseId, "error", "Soal tidak ditemukan.", anchor);
  list.splice(idx, 1);
  await writeQuestions(moduleId, rows, list);
  return go(courseId, "ok", "Soal dihapus.", anchor);
}
