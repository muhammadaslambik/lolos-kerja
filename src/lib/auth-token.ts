// Aman dipakai di middleware (Edge): hanya memakai jose.
import { SignJWT, jwtVerify } from "jose";
import type { RoleKey } from "./constants";

export const COOKIE = "lk_session";
export type SessionData = { uid: string; role: RoleKey; name: string };

const key = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET belum diatur (minimal 16 karakter).");
  return new TextEncoder().encode(s);
};

export async function signToken(d: SessionData) {
  return new SignJWT({ ...d }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(key());
}

export async function verifyToken(token?: string): Promise<SessionData | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return { uid: String(payload.uid), role: payload.role as RoleKey, name: String(payload.name) };
  } catch {
    return null;
  }
}
