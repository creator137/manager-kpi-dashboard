import type { DashboardRecord, DashboardSnapshot, KpiKey } from "./types"

export const kpiLabels: Record<KpiKey, string> = {
  revenue: "Продажи, ₽",
  salesCount: "Продажи, шт.",
  calls: "Состоялось разговоров",
  newMeetings: "Встречи по новым проектам",
  proposals: "Коммерческие предложения, шт.",
}

export const sumNullable = (values: Array<number | null>) => {
  const known = values.filter((value): value is number => value !== null)
  return known.length ? known.reduce((sum, value) => sum + value, 0) : null
}

export const completion = (plan: number | null, fact: number | null) =>
  plan && fact !== null ? fact / plan : null

export function selectRecords(snapshot: DashboardSnapshot, period: string, manager: string, kpi: KpiKey) {
  return snapshot.records.filter((record) =>
    record.period === period && record.kpi === kpi && (manager === "all" || record.manager === manager),
  )
}

export function summarize(records: DashboardRecord[]) {
  const plan = sumNullable(records.map((record) => record.plan))
  const fact = sumNullable(records.map((record) => record.fact))
  return { plan, fact, completion: completion(plan, fact) }
}

export function trend(snapshot: DashboardSnapshot, manager: string, kpi: KpiKey) {
  return snapshot.periods.map((period) => {
    const records = selectRecords(snapshot, period, manager, kpi)
    const summary = summarize(records)
    return { period, ...summary }
  }).filter((item) => item.plan !== null || item.fact !== null)
}

export function previousPeriod(snapshot: DashboardSnapshot, period: string) {
  const index = snapshot.periods.indexOf(period)
  return index > 0 ? snapshot.periods[index - 1] : null
}

export function statusFor(value: number | null) {
  if (value === null) return "no-data" as const
  if (value >= 1) return "done" as const
  if (value >= 0.7) return "risk" as const
  return "behind" as const
}
