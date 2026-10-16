import { NextRequest, NextResponse } from "next/server";

// Pengaman sementara (Basic Auth) untuk dashboard admin dan perusahaan
// sampai login nyata (Auth.js / Clerk) dipasang.
export const config = { matcher: ["/dashboard/admin/:path*", "/dashboard/employer/:path*"] };

export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass) return new NextResponse("ADMIN_USER dan ADMIN_PASSWORD belum diatur.", { status: 503 });

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    const [u, ...rest] = atob(header.slice(6)).split(":");
    if (u === user && rest.join(":") === pass) return NextResponse.next();
  }
  return new NextResponse("Perlu login.", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Lolos Kerja"' } });
}
