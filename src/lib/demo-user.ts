import { db } from "./db";
import type { Role } from "@prisma/client";
// SEMENTARA: pengganti login. Ganti dengan Auth.js / Clerk pada fase berikutnya.
export async function getDemoUser(role: Role) {
  return db.user.findFirstOrThrow({ where: { role }, include: { profile: true, memberships: true } });
}
