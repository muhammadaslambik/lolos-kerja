"use server";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clearSession, setSession } from "@/lib/session";
import { dashboardPath, type RoleKey } from "@/lib/constants";
import { EMAIL_MAX, IP_MAX, clearKey, lockWaitMs, recordFailure } from "@/lib/login-throttle";

export type AuthState = { error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const secretOk = () => (process.env.AUTH_SECRET ?? "").length >= 16;
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "perusahaan";

// Hash semu agar waktu respons sama, baik email terdaftar maupun tidak
let dummy: string | undefined;
const dummyHash = () => {
  if (!dummy) dummy = bcrypt.hashSync("bukan-kata-sandi-sungguhan", 10);
  return dummy;
};

const clientIp = () => (headers().get("x-forwarded-for") ?? "").split(",")[0].trim();

export async function register(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!secretOk()) return { error: "Server belum dikonfigurasi (AUTH_SECRET belum diatur)." };
  const fullName = text(fd, "fullName");
  const email = text(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const wantsEmployer = text(fd, "role") === "EMPLOYER";
  const companyName = text(fd, "companyName");

  if (fullName.length < 2) return { error: "Nama minimal 2 huruf." };
  if (!EMAIL_RE.test(email)) return { error: "Format email tidak valid." };
  if (password.length < 8) return { error: "Kata sandi minimal 8 karakter." };
  if (wantsEmployer && companyName.length < 2) return { error: "Nama perusahaan wajib diisi." };

  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const role: RoleKey = adminEmail && email === adminEmail ? "ADMIN" : wantsEmployer ? "EMPLOYER" : "SEEKER";

  let user;
  try {
    if (await db.user.findUnique({ where: { email } })) return { error: "Email sudah terdaftar. Silakan masuk." };
    const passwordHash = await bcrypt.hash(password, 10);
    user = await db.user.create({
      data: { email, fullName, passwordHash, role, ...(role === "SEEKER" ? { profile: { create: {} } } : {}) },
    });
    if (role === "EMPLOYER") {
      await db.company.create({
        data: {
          name: companyName,
          slug: `${slugify(companyName)}-${Math.random().toString(36).slice(2, 6)}`,
          members: { create: { userId: user.id, memberRole: "owner" } },
        },
      });
    }
  } catch {
    return { error: "Pendaftaran gagal. Coba lagi sebentar lagi." };
  }
  await setSession({ uid: user.id, role, name: user.fullName });
  redirect(dashboardPath(role));
}

export async function login(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!secretOk()) return { error: "Server belum dikonfigurasi (AUTH_SECRET belum diatur)." };
  const email = text(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const next = text(fd, "next");

  // Batas percobaan: per email dan per alamat IP
  const emailKey = `email:${email.slice(0, 200)}`;
  const ip = clientIp();
  const ipKey = ip ? `ip:${ip.slice(0, 64)}` : "";
  const keys = ipKey ? [emailKey, ipKey] : [emailKey];
  const wait = email ? await lockWaitMs(keys) : 0;
  if (wait > 0) {
    const minutes = Math.max(1, Math.ceil(wait / 60000));
    return { error: `Terlalu banyak percobaan masuk. Coba lagi dalam ${minutes} menit.` };
  }

  const user = email ? await db.user.findUnique({ where: { email } }) : null;
  const hash = user?.passwordHash ?? dummyHash();
  const match = await bcrypt.compare(password, hash);
  if (!user || !user.passwordHash || !match) {
    if (email) await recordFailure(emailKey, EMAIL_MAX);
    if (ipKey) await recordFailure(ipKey, IP_MAX);
    return { error: "Email atau kata sandi salah." };
  }

  await clearKey(emailKey);
  await setSession({ uid: user.id, role: user.role, name: user.fullName });
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : dashboardPath(user.role));
}

export async function logout() {
  clearSession();
  redirect("/");
}
