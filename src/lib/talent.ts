// Nama singkat untuk Talent Pool: kata pertama dan inisial kata kedua
export function shortName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Pelamar";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
}

export const INVITE_LABEL: Record<string, string> = {
  sent: "Menunggu jawaban",
  accepted: "Diterima",
  declined: "Ditolak",
};

export const DECLINE_REASONS: Record<string, string> = {
  GAJI: "Gaji tidak sesuai harapan",
  LOKASI: "Lokasi atau mode kerja tidak sesuai",
  POSISI: "Posisi tidak sesuai bidang saya",
  SUDAH_BEKERJA: "Sudah bekerja atau menerima tawaran lain",
  TIDAK_MENCARI: "Sedang tidak mencari kerja",
  LAINNYA: "Alasan lainnya",
};

export const MAX_INVITES = 3; // maksimal undangan per pasangan perusahaan dan pelamar

export type InviteRow = {
  status: string;
  createdAt: Date;
  respondedAt: Date | null;
  declineReason: string | null;
  declineNote: string | null;
  skillsSnapshot: string[];
};

export type InviteState = {
  count: number;
  latest: InviteRow | null;
  canInvite: boolean;
  block: "pending" | "accepted" | "limit" | "not_updated" | null;
  skillsChanged: boolean;
  newJob: boolean;
};

const normSkills = (a: string[]) =>
  Array.from(new Set(a.map((x) => x.trim().toLowerCase()).filter(Boolean))).sort().join("|");

// Aturan undang ulang:
// - Undangan yang menunggu jawaban atau sudah diterima tidak bisa diulang.
// - Setelah ditolak, perusahaan boleh mengundang lagi jika keahlian pelamar berubah
//   sejak penolakan, atau perusahaan memasang lowongan Tayang baru sejak penolakan.
// - Maksimal MAX_INVITES undangan per pasangan.
export function computeState(rows: InviteRow[], currentSkills: string[], latestJobAt: Date | null): InviteState {
  const sorted = [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const latest = sorted[sorted.length - 1] ?? null;
  const count = sorted.length;
  const base = { count, latest, skillsChanged: false, newJob: false };
  if (!latest) return { ...base, canInvite: true, block: null };
  if (latest.status === "sent") return { ...base, canInvite: false, block: "pending" };
  if (latest.status === "accepted") return { ...base, canInvite: false, block: "accepted" };

  const at = latest.respondedAt ?? latest.createdAt;
  const skillsChanged = normSkills(currentSkills) !== normSkills(latest.skillsSnapshot);
  const newJob = !!latestJobAt && latestJobAt.getTime() > at.getTime();
  const flags = { ...base, skillsChanged, newJob };
  if (count >= MAX_INVITES) return { ...flags, canInvite: false, block: "limit" };
  if (skillsChanged || newJob) return { ...flags, canInvite: true, block: null };
  return { ...flags, canInvite: false, block: "not_updated" };
}
