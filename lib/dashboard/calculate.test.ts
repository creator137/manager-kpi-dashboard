import { describe, expect, it } from "vitest"
import { dashboardSnapshot } from "../../data/dashboard-snapshot"
import { completion, salesPlanPerformance, selectRecords, summarize, trend } from "./calculate"

describe("dashboard calculations", () => {
  it("recalculates the corrected August department completion from source facts", () => {
    const summary = summarize(selectRecords(dashboardSnapshot, "Август", "all", "revenue"))
    expect(summary.plan).toBe(35_000_000)
    expect(summary.fact).toBeCloseTo(38_182_957.8)
    expect(summary.completion).toBeCloseTo(1.0909417)
  })

  it("sums September pre-sale meetings only from manager records", () => {
    const summary = summarize(selectRecords(dashboardSnapshot, "Сентябрь", "all", "preSaleMeetings"))
    expect(summary.plan).toBeNull()
    expect(summary.fact).toBe(1)
    expect(summary.completion).toBeNull()
  })

  it("does not turn a missing source value into zero", () => {
    const march = trend(dashboardSnapshot, "Алексей Ладьин", "revenue").find((item) => item.period === "Март")
    expect(march?.fact).toBeNull()
  })

  it("handles zero plans without an invalid percentage", () => {
    expect(completion(0, 100)).toBeNull()
    expect(completion(null, 100)).toBeNull()
  })

  it("combines the external annual plan with quarterly facts from manager sheets", () => {
    const result = salesPlanPerformance(dashboardSnapshot)

    expect(result.annual.plan).toBeCloseTo(333_322_608.4142364)
    expect(result.annual.fact).toBeCloseTo(251_372_341.8)
    expect(result.quarters.map((item) => item.state)).toEqual(["completed", "completed", "current", "future"])
    expect(result.quarters[2].availableMonths).toBe(3)
    expect(result.quarters[3].fact).toBeNull()
  })
})
