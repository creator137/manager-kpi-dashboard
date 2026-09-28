import type { DashboardRecord, DashboardSnapshot, KpiKey } from "./types"

export const kpiLabels: Record<KpiKey, string> = {
  revenue: "Продажи, ₽",
  salesCount: "Продажи, шт.",
  calls: "Состоялось разговоров",
  newMeetings: "Встречи по новым проектам",
  preSaleMeetings: "Pre-sale встречи",
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

const QUARTERS = [
  { key: "q1", label: "I квартал", periods: ["Январь", "Февраль", "Март"] },
  { key: "q2", label: "II квартал", periods: ["Апрель", "Май", "Июнь"] },
  { key: "q3", label: "III квартал", periods: ["Июль", "Август", "Сентябрь"] },
  { key: "q4", label: "IV квартал", periods: ["Октябрь", "Ноябрь", "Декабрь"] },
] as const

export function salesPlanPerformance(snapshot: DashboardSnapshot) {
  const latestPeriodIndex = snapshot.salesPlan.months.findIndex((item) => item.period === snapshot.periods.at(-1))
  const latestQuarterIndex = latestPeriodIndex < 0 ? -1 : Math.floor(latestPeriodIndex / 3)
  const monthFacts = new Map(snapshot.salesPlan.months.map(({ period }) => {
    const facts = snapshot.records
      .filter((record) => record.period === period && record.kpi === "revenue")
      .map((record) => record.fact)
    return [period, sumNullable(facts)]
  }))

  const quarters = QUARTERS.map((quarter, index) => {
    const plan = sumNullable(quarter.periods.map((period) =>
      snapshot.salesPlan.months.find((item) => item.period === period)?.plan ?? null,
    ))
    const availableFacts = quarter.periods.map((period) => monthFacts.get(period) ?? null)
    const fact = sumNullable(availableFacts)
    return {
      key: quarter.key,
      label: quarter.label,
      plan,
      fact,
      completion: completion(plan, fact),
      availableMonths: availableFacts.filter((value) => value !== null).length,
      state: index < latestQuarterIndex ? "completed" as const : index === latestQuarterIndex ? "current" as const : "future" as const,
    }
  })
  const annualFact = sumNullable([...monthFacts.values()])

  return {
    annual: {
      plan: snapshot.salesPlan.annualPlan,
      fact: annualFact,
      completion: completion(snapshot.salesPlan.annualPlan, annualFact),
      remaining: annualFact === null ? null : Math.max(snapshot.salesPlan.annualPlan - annualFact, 0),
    },
    quarters,
  }
}
