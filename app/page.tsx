import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { requireSession } from "@/lib/auth/session"
import { getDashboardData } from "@/lib/dashboard/provider"

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireSession()
  const snapshot = await getDashboardData()
  const { state } = await searchParams
  return <DashboardShell snapshot={snapshot} scenario={typeof state === "string" ? state : undefined} />
}
