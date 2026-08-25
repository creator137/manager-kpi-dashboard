import { describe, expect, it } from "vitest"
import { dashboardSnapshot } from "../../data/dashboard-snapshot"
import { completion, selectRecords, summarize, trend } from "./calculate"

describe("dashboard calculations", () => {
  it("recalculates August department completion from source facts", () => {
    const summary = summarize(selectRecords(dashboardSnapshot, "Август", "all", "revenue"))
    expect(summary.plan).toBe(35_000_000)
    expect(summary.fact).toBeCloseTo(19_786_567.8)
    expect(summary.completion).toBeCloseTo(0.5653305)
  })

  it("does not turn a missing source value into zero", () => {
    const march = trend(dashboardSnapshot, "Алексей Ладьин", "revenue").find((item) => item.period === "Март")
    expect(march?.fact).toBeNull()
  })

  it("handles zero plans without an invalid percentage", () => {
    expect(completion(0, 100)).toBeNull()
    expect(completion(null, 100)).toBeNull()
  })
})
