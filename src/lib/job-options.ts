export const WORK_MODES = ["ONSITE", "HYBRID", "REMOTE"] as const;

export const WORK_MODE_LABEL: Record<string, string> = {
  ONSITE: "Di kantor",
  HYBRID: "Hibrida",
  REMOTE: "Jarak jauh",
};

export const JOB_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draf",
  PENDING_REVIEW: "Menunggu peninjauan",
  ACTIVE: "Tayang",
  CLOSED: "Ditutup",
  REJECTED: "Ditolak",
};
