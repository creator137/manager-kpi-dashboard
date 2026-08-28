import { completion, sumNullable } from "./calculate"
import type { SalesStatistics, SalesStatisticsMonth } from "./types"

const sumField = (months: SalesStatisticsMonth[], field: keyof SalesStatisticsMonth) =>
  sumNullable(months.map((month) => typeof month[field] === "number" ? month[field] : null))

export function summarizeSalesStatistics(statistics: SalesStatistics, period: string) {
  const months = period === "all"
    ? statistics.months
    : statistics.months.filter((month) => month.period === period)
  const salesPlan = sumField(months, "salesPlan")
  const salesFact = sumField(months, "salesFact")
  const qualifiedLeads = sumField(months, "qualifiedLeads")
  const newClientMeetings = sumField(months, "newClientMeetings")
  const newClientSales = sumField(months, "newClientSales")
  const activeClientSales = sumField(months, "activeClientSales")
  const inactiveClientSales = sumField(months, "inactiveClientSales")
  const demoSvlFact = sumField(months, "demoSvlFact")
  const demoCopFact = sumField(months, "demoCopFact")

  return {
    period,
    months,
    salesPlan,
    salesFact,
    salesCompletion: completion(salesPlan, salesFact),
    qualifiedLeads,
    newClientMeetings,
    funnelSales: sumNullable([newClientSales, activeClientSales, inactiveClientSales]),
    demoMeetings: sumNullable([demoSvlFact, demoCopFact]),
    funnel: [
      { stage: "Лиды", value: qualifiedLeads },
      { stage: "Встречи", value: newClientMeetings },
      { stage: "Продажи", value: newClientSales },
    ],
    meetings: [
      { stage: "Назначено", plan: sumField(months, "assignedMeetingsPlan"), fact: sumField(months, "assignedMeetingsFact") },
      { stage: "Демо SVL", plan: sumField(months, "demoSvlPlan"), fact: demoSvlFact },
      { stage: "Демо ЦОП", plan: sumField(months, "demoCopPlan"), fact: demoCopFact },
    ],
  }
}

export function salesStatisticsTrend(statistics: SalesStatistics) {
  return statistics.months.map((month) => ({
    ...month,
    salesCompletion: completion(month.salesPlan, month.salesFact),
  }))
}
