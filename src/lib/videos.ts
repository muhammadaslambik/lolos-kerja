import { db } from "@/lib/db";
import { youtubeId } from "@/lib/youtube";

export type VideoItem = { id: string; youtubeId: string; title: string | null };

// Video sebuah pelajaran: video lama (kolom videoRef, bila link YouTube) lebih dulu, lalu daftar video baru
export async function lessonVideos(lessonId: string, legacyRef: string | null | undefined): Promise<VideoItem[]> {
  const rows = await db.learningVideo.findMany({
    where: { kind: "LESSON", refId: lessonId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const out: VideoItem[] = [];
  const legacy = legacyRef ? youtubeId(legacyRef) : null;
  if (legacy) out.push({ id: `legacy:${lessonId}`, youtubeId: legacy, title: null });
  for (const r of rows) out.push({ id: r.id, youtubeId: r.youtubeId, title: r.title });
  return out;
}
