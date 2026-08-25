import { DashboardFrame } from "@/components/dashboard/dashboard-frame"
import { MeetingsDashboard } from "@/components/dashboard/meetings-dashboard"
import { requireSession } from "@/lib/auth/session"
import { getDashboardData } from "@/lib/dashboard/provider"

export default async function MeetingsPage() {
  await requireSession()
  const snapshot = await getDashboardData()
  return <DashboardFrame sourceLabel={snapshot.sourceLabel} asOf={snapshot.asOf}><MeetingsDashboard snapshot={snapshot} /></DashboardFrame>
}
