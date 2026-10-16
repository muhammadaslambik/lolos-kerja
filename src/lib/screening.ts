// Skor kecocokan 0-100. Hanya memberi label; keputusan akhir tetap di recruiter.
const EDU = ["SMA", "D3", "S1", "S2"];
type JobRule = { minEducation?: string | null; minExperienceYears: number; requiredSkills: string[] };
type Profile = { educationLevel?: string | null; experienceYears: number; skills: string[] };

export function matchScore(job: JobRule, p: Profile | null): number {
  if (!p) return 0;
  const have = new Set(p.skills.map((s) => s.toLowerCase()));
  const req = job.requiredSkills.map((s) => s.toLowerCase());
  const skills = req.length ? req.filter((s) => have.has(s)).length / req.length : 1;
  const exp = job.minExperienceYears ? Math.min(1, p.experienceYears / job.minExperienceYears) : 1;
  const need = EDU.indexOf(job.minEducation ?? "SMA");
  const got = EDU.indexOf(p.educationLevel ?? "");
  const edu = need <= 0 ? 1 : got >= need ? 1 : got < 0 ? 0 : 0.5;
  return Math.round(skills * 50 + exp * 30 + edu * 20);
}
export const matchLabel = (s: number) => (s >= 75 ? "Sangat cocok" : s >= 50 ? "Cukup cocok" : "Kurang cocok");
