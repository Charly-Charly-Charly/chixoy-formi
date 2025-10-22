import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/jwt"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")
  const isLoginPage = request.nextUrl.pathname === "/login"
  const isApiAuth = request.nextUrl.pathname.startsWith("/api/auth")

  // Permitir acceso a la página de login y rutas de autenticación
  if (isLoginPage || isApiAuth) {
    if (isLoginPage && token) {
      const payload = await verifyToken(token.value)
      if (payload) {
        return NextResponse.redirect(new URL("/", request.url))
      }
    }
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const payload = await verifyToken(token.value)
  if (!payload) {
    // Token is invalid or expired, redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("auth_token")
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
}
