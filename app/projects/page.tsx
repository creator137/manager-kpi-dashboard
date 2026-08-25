import { DashboardFrame } from "@/components/dashboard/dashboard-frame"
import { OpportunitiesDashboard } from "@/components/dashboard/opportunities-dashboard"
import { requireSession } from "@/lib/auth/session"
import { getDashboardData } from "@/lib/dashboard/provider"

export default async function ProjectsPage() {
  await requireSession()
  const snapshot = await getDashboardData()
  return <DashboardFrame sourceLabel={snapshot.sourceLabel} asOf={snapshot.asOf}><OpportunitiesDashboard snapshot={snapshot} /></DashboardFrame>
}
