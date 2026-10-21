import { SignJWT, jwtVerify } from "jose";

export const OAUTH_COOKIE = "lk_oauth";

export type OauthState = {
  state: string;
  verifier: string;
  mode: "login" | "register";
  role: "SEEKER" | "EMPLOYER";
  company: string;
  next: string;
};

const key = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET belum diatur (minimal 16 karakter).");
  return new TextEncoder().encode(s);
};

// Data sementara selama pengguna berada di halaman Google (berlaku 10 menit, tertanda agar tidak bisa dipalsukan)
export async function signOauthState(d: OauthState) {
  return new SignJWT({ ...d }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("10m").sign(key());
}

export async function readOauthState(token?: string): Promise<OauthState | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return {
      state: String(payload.state ?? ""),
      verifier: String(payload.verifier ?? ""),
      mode: payload.mode === "register" ? "register" : "login",
      role: payload.role === "EMPLOYER" ? "EMPLOYER" : "SEEKER",
      company: String(payload.company ?? ""),
      next: String(payload.next ?? ""),
    };
  } catch {
    return null;
  }
}
