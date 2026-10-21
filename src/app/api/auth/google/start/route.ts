import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { SITE_URL } from "@/lib/site";
import { OAUTH_COOKIE, signOauthState } from "@/lib/oauth-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (path: string) => NextResponse.redirect(new URL(path, SITE_URL));

  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET || (process.env.AUTH_SECRET ?? "").length < 16) {
    return back("/login?error=google_belum_diatur");
  }

  const mode = url.searchParams.get("mode") === "register" ? "register" : "login";
  const role = url.searchParams.get("role") === "EMPLOYER" ? "EMPLOYER" : "SEEKER";
  const company = (url.searchParams.get("company") ?? "").trim().slice(0, 100);
  if (mode === "register" && role === "EMPLOYER" && company.length < 2) return back("/register?error=nama_perusahaan");
  const nextRaw = url.searchParams.get("next") ?? "";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "";

  const state = randomBytes(16).toString("hex");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${SITE_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  res.cookies.set(OAUTH_COOKIE, await signOauthState({ state, verifier, mode, role, company, next }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return res;
}
