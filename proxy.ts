import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session"

export async function proxy(request: NextRequest) {
  const authenticated = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (authenticated) return NextResponse.next()

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/", "/projects/:path*", "/meetings/:path*", "/managers/:path*"],
}
