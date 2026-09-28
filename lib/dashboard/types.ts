export type KpiKey = "revenue" | "salesCount" | "calls" | "newMeetings" | "preSaleMeetings" | "proposals"

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

export type SalesStatisticsMonth = {
  period: string
  salesPlan: number | null
  salesForecast: number | null
  salesFact: number | null
  assignedMeetingsPlan: number | null
  assignedMeetingsFact: number | null
  demoSvlPlan: number | null
  demoSvlFact: number | null
  demoCopPlan: number | null
  demoCopFact: number | null
  qualifiedLeads: number | null
  newClientMeetings: number | null
  newClientSales: number | null
  activeClientMeetings: number | null
  activeClientSales: number | null
  inactiveClientMeetings: number | null
  inactiveClientSales: number | null
  svlSold: number | null
  svlAverageCheck: number | null
  copSold: number | null
  copAverageCheck: number | null
  svlUpsells: number | null
  svlUpsellAverageCheck: number | null
  proposals: number | null
}

export type SalesStatistics = {
  year: number
  months: SalesStatisticsMonth[]
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
  salesStatistics: SalesStatistics
}

export interface DashboardDataProvider {
  getSnapshot(): Promise<DashboardSnapshot>
}
