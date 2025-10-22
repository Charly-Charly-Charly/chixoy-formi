import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/jwt"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const payload = await verifyToken(token.value)

    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({ authenticated: true, username: payload.username }, { status: 200 })
  } catch (error) {
    console.error("Error verificando sesión:", error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}
