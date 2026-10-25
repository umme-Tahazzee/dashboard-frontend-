import { NextResponse, type NextRequest } from "next/server"

// Optimistic, cookie-based redirects only. The API is the real authority:
// every request is verified there, and pages re-check the session via /auth/me.
const homeFor = (role: string) => (role === "STUDENT" ? "/submit" : "/dashboard")

function readRole(request: NextRequest): string | null {
  const token = request.cookies.get("accessToken")?.value
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) return null
    return typeof payload.role === "string" ? payload.role : null
  } catch {
    return null
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const role = readRole(request)
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url))

  if (pathname === "/") return go(role ? homeFor(role) : "/login")
  if (pathname === "/login" || pathname === "/signup") return role ? go(homeFor(role)) : NextResponse.next()

  if (!role) return go("/login")
  if (pathname.startsWith("/submit") && role !== "STUDENT") return go(homeFor(role))
  if (pathname.startsWith("/dashboard") && role === "STUDENT") return go(homeFor(role))
  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/login", "/signup", "/submit/:path*", "/dashboard/:path*"],
}
