import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("auth_token")

    return NextResponse.json({ message: "Logout exitoso" }, { status: 200 })
  } catch (error) {
    console.error("Error en logout:", error)
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 })
  }
}
