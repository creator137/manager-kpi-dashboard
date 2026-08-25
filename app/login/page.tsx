import { redirect } from "next/navigation"
import { ShieldCheckIcon } from "lucide-react"

import { LoginForm } from "@/components/auth/login-form"
import { BrandLogo } from "@/components/dashboard/dashboard-frame"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { isAuthenticated } from "@/lib/auth/session"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await isAuthenticated()) redirect("/")
  const { next } = await searchParams

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex justify-center">
          <BrandLogo width={189} height={42} priority />
        </div>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShieldCheckIcon /></div>
            <CardTitle className="text-xl">Вход в KPI Dashboard</CardTitle>
            <CardDescription>Закрытая управленческая аналитика отдела продаж</CardDescription>
          </CardHeader>
          <CardContent><LoginForm nextPath={next} /></CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">Virtual Land · внутренний доступ</p>
      </div>
    </main>
  )
}
