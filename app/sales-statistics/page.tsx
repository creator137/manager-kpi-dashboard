import { DashboardFrame } from "@/components/dashboard/dashboard-frame"
import { SalesStatisticsDashboard } from "@/components/dashboard/sales-statistics-dashboard"
import { requireSession } from "@/lib/auth/session"
import { getDashboardData } from "@/lib/dashboard/provider"

const sourceUrl = "https://docs.google.com/spreadsheets/d/17m2AWOh4xYN6SuM7tagdsmqER6U_LHrtH-fjyWUef-0/edit?usp=drivesdk"

export default async function SalesStatisticsPage() {
  await requireSession()
  const snapshot = await getDashboardData()
  return <DashboardFrame sourceLabel={snapshot.sourceLabel} asOf={snapshot.asOf} sourceUrl={sourceUrl}><SalesStatisticsDashboard statistics={snapshot.salesStatistics} /></DashboardFrame>
}
