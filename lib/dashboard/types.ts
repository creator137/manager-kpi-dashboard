export type KpiKey = "revenue" | "salesCount" | "calls" | "newMeetings" | "proposals"

export type DashboardRecord = {
  period: string
  manager: string
  kpi: KpiKey
  plan: number | null
  fact: number | null
}

export type Opportunity = {
  company: string
  project: string
  manager: string
  amount: number
  sold: boolean
  note?: string
}

export type DashboardSnapshot = {
  source: "snapshot" | "google-sheets"
  sourceLabel: string
  asOf: string
  periods: string[]
  managers: string[]
  records: DashboardRecord[]
  opportunities: Opportunity[]
}

export interface DashboardDataProvider {
  getSnapshot(): Promise<DashboardSnapshot>
}
