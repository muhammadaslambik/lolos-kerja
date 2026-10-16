export const STAGES = ["APPLIED", "SCREENING", "INTERVIEW", "OFFERING", "HIRED", "REJECTED"] as const;
export type StageKey = (typeof STAGES)[number];
export const STAGE_LABEL: Record<StageKey, string> = {
  APPLIED: "Dikirim", SCREENING: "Direview", INTERVIEW: "Interview",
  OFFERING: "Penawaran", HIRED: "Diterima", REJECTED: "Ditolak",
};
export const JOB_TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "Penuh waktu", PART_TIME: "Paruh waktu", CONTRACT: "Kontrak",
  INTERNSHIP: "Magang", FREELANCE: "Freelance",
};
export const rupiah = (n?: number | null) =>
  n == null ? "-" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
