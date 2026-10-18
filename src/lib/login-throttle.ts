import { db } from "@/lib/db";

export const WINDOW_MS = 15 * 60 * 1000; // jendela hitung percobaan gagal
export const LOCK_MS = 15 * 60 * 1000; // lama penguncian
export const EMAIL_MAX = 5; // gagal per email dalam satu jendela
export const IP_MAX = 20; // gagal per alamat IP dalam satu jendela

// Mengembalikan sisa waktu kunci (milidetik), 0 jika tidak terkunci.
// Jika database bermasalah, login tetap diizinkan (fail-open) agar pengguna tidak terkunci keluar.
export async function lockWaitMs(keys: string[]): Promise<number> {
  try {
    const rows = await db.loginThrottle.findMany({ where: { key: { in: keys } } });
    const now = Date.now();
    return rows.reduce(
      (m, r) => (r.lockedUntil && r.lockedUntil.getTime() > now ? Math.max(m, r.lockedUntil.getTime() - now) : m),
      0,
    );
  } catch (e) {
    console.error("login-throttle: gagal membaca", e);
    return 0;
  }
}

export async function recordFailure(key: string, max: number): Promise<void> {
  try {
    const now = Date.now();
    const row = await db.loginThrottle.findUnique({ where: { key } });
    if (!row || now - row.windowStart.getTime() >= WINDOW_MS) {
      await db.loginThrottle.upsert({
        where: { key },
        create: { key, count: 1, windowStart: new Date(now) },
        update: { count: 1, windowStart: new Date(now), lockedUntil: null },
      });
    } else {
      const u = await db.loginThrottle.update({ where: { key }, data: { count: { increment: 1 } } });
      if (u.count >= max) {
        await db.loginThrottle.update({ where: { key }, data: { lockedUntil: new Date(now + LOCK_MS) } });
      }
    }
    // Sesekali bersihkan catatan lama agar tabel tidak membengkak
    if (Math.random() < 0.05) {
      await db.loginThrottle.deleteMany({ where: { windowStart: { lt: new Date(now - 24 * 60 * 60 * 1000) } } });
    }
  } catch (e) {
    console.error("login-throttle: gagal mencatat", e);
  }
}

export async function clearKey(key: string): Promise<void> {
  try {
    await db.loginThrottle.deleteMany({ where: { key } });
  } catch (e) {
    console.error("login-throttle: gagal menghapus", e);
  }
}
