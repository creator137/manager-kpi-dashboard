import { DashboardFrame } from "@/components/dashboard/dashboard-frame"
import { YearDashboard } from "@/components/dashboard/year-dashboard"
import { requireSession } from "@/lib/auth/session"
import { getDashboardData } from "@/lib/dashboard/provider"

export default async function ManagersPage() {
  await requireSession()
  const snapshot = await getDashboardData()
  return <DashboardFrame sourceLabel={snapshot.sourceLabel} asOf={snapshot.asOf}><YearDashboard snapshot={snapshot} /></DashboardFrame>
}
