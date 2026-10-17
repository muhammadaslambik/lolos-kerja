import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, SessionData, signToken, verifyToken } from "./auth-token";
import type { RoleKey } from "./constants";

export async function getSession() {
  return verifyToken(cookies().get(COOKIE)?.value);
}

export async function setSession(d: SessionData) {
  cookies().set(COOKIE, await signToken(d), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSession() {
  cookies().delete(COOKIE);
}

export async function requireRole(role: RoleKey) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role !== role) redirect("/");
  return s;
}
