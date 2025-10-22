import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = process.env.JWT_SECRET || "tu-secreto-super-seguro-cambialo-en-produccion"
const secret = new TextEncoder().encode(JWT_SECRET)

export interface JWTPayload {
  username: string
  userId?: number
  iat?: number
  exp?: number
}

export async function createToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret)

  return token
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as JWTPayload
  } catch (error) {
    console.error("JWT verification failed:", error)
    return null
  }
}
