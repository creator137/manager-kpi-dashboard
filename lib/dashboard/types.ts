export type KpiKey = "revenue" | "salesCount" | "calls" | "newMeetings" | "proposals"

export type DashboardRecord = {
  period: string
  manager: string
  kpi: KpiKey
  plan: number | null
  fact: number | null
}

export type Opportunity = {
  period: string
  company: string
  project: string
  manager: string
  amount: number
  sold: boolean
  dealUrl?: string
  note?: string
}

export type Meeting = {
  manager: string
  date: string
  dateLabel: string
  time: string
  company: string
  project: string
  dealUrls: string[]
  nasUrl?: string
  status?: string
}

export type SalesPlanMonth = {
  period: string
  plan: number
}

export type SalesPlan = {
  year: number
  annualPlan: number
  months: SalesPlanMonth[]
}

export type DashboardSnapshot = {
  source: "snapshot" | "google-sheets"
  sourceLabel: string
  asOf: string
  periods: string[]
  managers: string[]
  records: DashboardRecord[]
  opportunities: Opportunity[]
  meetings: Meeting[]
  salesPlan: SalesPlan
}

export interface DashboardDataProvider {
  getSnapshot(): Promise<DashboardSnapshot>
}
