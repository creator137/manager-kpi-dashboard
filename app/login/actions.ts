"use server"

import { timingSafeEqual } from "node:crypto"
import { redirect } from "next/navigation"
import { z } from "zod"

import { createSession, deleteSession } from "@/lib/auth/session"

export type LoginState = { error?: string } | undefined

const credentialsSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
  next: z.string().optional(),
})

function equal(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentialsSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    next: formData.get("next"),
  })
  const expectedUsername = process.env.DASHBOARD_USERNAME
  const expectedPassword = process.env.DASHBOARD_PASSWORD

  if (!parsed.success || !expectedUsername || !expectedPassword) {
    return { error: "Неверный логин или пароль" }
  }

  const valid = equal(parsed.data.username, expectedUsername)
    && equal(parsed.data.password, expectedPassword)
  if (!valid) return { error: "Неверный логин или пароль" }

  await createSession(parsed.data.username)
  const destination = parsed.data.next?.startsWith("/") && !parsed.data.next.startsWith("//")
    ? parsed.data.next
    : "/"
  redirect(destination)
}

export async function logout() {
  await deleteSession()
  redirect("/login")
}
