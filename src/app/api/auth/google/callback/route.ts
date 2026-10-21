import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site";
import { COOKIE, signToken } from "@/lib/auth-token";
import { dashboardPath, type RoleKey } from "@/lib/constants";
import { OAUTH_COOKIE, readOauthState } from "@/lib/oauth-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "perusahaan";

// Mengarahkan ke halaman tujuan sambil menghapus data sementara OAuth
function redirectTo(path: string) {
  const res = NextResponse.redirect(new URL(path, SITE_URL));
  res.cookies.set(OAUTH_COOKIE, "", { path: "/api/auth/google", maxAge: 0 });
  return res;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fail = (code: string) => redirectTo(`/login?error=${code}`);

  if (url.searchParams.get("error")) return fail("google_dibatalkan");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const st = await readOauthState(cookies().get(OAUTH_COOKIE)?.value);
  if (!code || !state || !st || st.state !== state) return fail("google_gagal");

  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  if (!clientId || !clientSecret) return fail("google_belum_diatur");

  // 1. Tukar kode dengan token, lalu verifikasi identitas dari Google
  let email = "";
  let name = "";
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${SITE_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
        code_verifier: st.verifier,
      }),
    });
    if (!tokenRes.ok) return fail("google_gagal");
    const tok = (await tokenRes.json()) as { id_token?: string };
    if (!tok.id_token) return fail("google_gagal");
    const { payload } = await jwtVerify(tok.id_token, JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: clientId,
    });
    if (payload.email_verified !== true || typeof payload.email !== "string") return fail("email_belum_terverifikasi");
    email = payload.email.toLowerCase();
    name = typeof payload.name === "string" && payload.name.trim().length >= 2 ? payload.name.trim().slice(0, 120) : email.split("@")[0];
  } catch {
    return fail("google_gagal");
  }

  // 2. Cari akun dengan email itu, atau buat akun baru
  let role: RoleKey = "SEEKER";
  let uid = "";
  let fullName = "";
  try {
    let user = await db.user.findUnique({ where: { email } });
    if (!user) {
      const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
      const company = st.company.trim();
      const wantsEmployer = st.mode === "register" && st.role === "EMPLOYER" && company.length >= 2;
      const newRole: RoleKey = adminEmail && email === adminEmail ? "ADMIN" : wantsEmployer ? "EMPLOYER" : "SEEKER";
      user = await db.user.create({
        data: { email, fullName: name, role: newRole, ...(newRole === "SEEKER" ? { profile: { create: {} } } : {}) },
      });
      if (newRole === "EMPLOYER") {
        await db.company.create({
          data: {
            name: company,
            slug: `${slugify(company)}-${Math.random().toString(36).slice(2, 6)}`,
            members: { create: { userId: user.id, memberRole: "owner" } },
          },
        });
      }
    }
    role = user.role;
    uid = user.id;
    fullName = user.fullName;
  } catch {
    return fail("google_gagal");
  }

  // 3. Mulai sesi
  const token = await signToken({ uid, role, name: fullName });
  const nextOk = st.next.startsWith("/") && !st.next.startsWith("//") ? st.next : "";
  const res = redirectTo(nextOk || dashboardPath(role));
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
