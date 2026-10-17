import { NextRequest, NextResponse } from "next/server";
import { COOKIE, verifyToken } from "@/lib/auth-token";
import { dashboardPath } from "@/lib/constants";

export const config = { matcher: ["/dashboard/:path*"] };

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const session = await verifyToken(req.cookies.get(COOKIE)?.value);

  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  const home = dashboardPath(session.role);
  const need = path.startsWith("/dashboard/admin") ? "ADMIN"
    : path.startsWith("/dashboard/employer") ? "EMPLOYER"
    : path.startsWith("/dashboard/seeker") ? "SEEKER" : null;
  if (path === "/dashboard" || (need && session.role !== need)) return NextResponse.redirect(new URL(home, req.url));
  return NextResponse.next();
}
