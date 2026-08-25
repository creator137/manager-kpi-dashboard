import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { jwtVerify, SignJWT } from "jose"

export const SESSION_COOKIE = "vl-dashboard-session"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

function secret() {
  const value = process.env.DASHBOARD_SESSION_SECRET
  if (!value || value.length < 32) {
    throw new Error("DASHBOARD_SESSION_SECRET must contain at least 32 characters")
  }
  return new TextEncoder().encode(value)
}

export async function createSession(username: string) {
  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret())

  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  })
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return false
  try {
    await jwtVerify(token, secret(), { algorithms: ["HS256"] })
    return true
  } catch {
    return false
  }
}

export async function isAuthenticated() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  return verifySessionToken(token)
}

export async function requireSession() {
  if (!(await isAuthenticated())) redirect("/login")
}

export async function deleteSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}
