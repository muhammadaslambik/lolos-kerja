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
export const VERIFICATION_LABEL: Record<string, string> = {
  PENDING: "Menunggu verifikasi", VERIFIED: "Terverifikasi", REJECTED: "Ditolak", SUSPENDED: "Ditangguhkan",
};
export const EDU_LEVELS = ["SMA", "D3", "S1", "S2"];

export type RoleKey = "SEEKER" | "EMPLOYER" | "ADMIN";
export const dashboardPath = (r: RoleKey) =>
  r === "ADMIN" ? "/dashboard/admin" : r === "EMPLOYER" ? "/dashboard/employer" : "/dashboard/seeker";

export const rupiah = (n?: number | null) =>
  n == null ? "-" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
