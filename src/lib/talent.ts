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
