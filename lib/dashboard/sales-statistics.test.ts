import { describe, expect, it } from "vitest"

import { dashboardSnapshot } from "../../data/dashboard-snapshot"
import { salesStatisticsTrend, summarizeSalesStatistics } from "./sales-statistics"

describe("sales statistics calculations", () => {
  it("builds cumulative sales and funnel totals from known months", () => {
    const result = summarizeSalesStatistics(dashboardSnapshot.salesStatistics, "all")

    expect(result.salesPlan).toBe(220_609_047)
    expect(result.salesFact).toBe(193_189_125)
    expect(result.salesCompletion).toBeCloseTo(193_189_125 / 220_609_047)
    expect(result.qualifiedLeads).toBe(95)
    expect(result.newClientMeetings).toBe(44)
    expect(result.funnelSales).toBe(69)
    expect(result.demoMeetings).toBe(125)
  })

  it("keeps missing monthly values out of aggregates", () => {
    const august = summarizeSalesStatistics(dashboardSnapshot.salesStatistics, "Август")
    const trend = salesStatisticsTrend(dashboardSnapshot.salesStatistics)

    expect(august.qualifiedLeads).toBeNull()
    expect(august.salesFact).toBe(31_192_330)
    expect(trend.at(-1)?.salesCompletion).toBeCloseTo(31_192_330 / 33_654_356)
  })
})
