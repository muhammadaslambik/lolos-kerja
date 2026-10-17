"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clearSession, setSession } from "@/lib/session";
import { dashboardPath, type RoleKey } from "@/lib/constants";

export type AuthState = { error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const secretOk = () => (process.env.AUTH_SECRET ?? "").length >= 16;
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "perusahaan";

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

  const user = email ? await db.user.findUnique({ where: { email } }) : null;
  const ok = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !ok) return { error: "Email atau kata sandi salah." };

  await setSession({ uid: user.id, role: user.role, name: user.fullName });
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : dashboardPath(user.role));
}

export async function logout() {
  clearSession();
  redirect("/");
}
