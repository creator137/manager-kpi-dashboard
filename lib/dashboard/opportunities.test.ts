import { describe, expect, it } from "vitest"

import { matchesOpportunityStatus, summarizeOpportunities } from "./opportunities"
import type { Opportunity } from "./types"

const opportunities: Opportunity[] = [
  { period: "Сентябрь", company: "A", project: "ЦОП", manager: "Алексей", product: "ЦОП", amount: 10, sold: false },
  { period: "Сентябрь", company: "B", project: "SVL", manager: "Алексей", product: "SVL", amount: 20, sold: false, note: "Тендер" },
  { period: "Сентябрь", company: "C", project: "Продан", manager: "Анна", product: "ЦОП", amount: 30, sold: true },
  { period: "Сентябрь", company: "D", project: "Без суммы", manager: "Анна", product: "SVL", amount: null, sold: true },
  { period: "Сентябрь", company: "E", project: "Отказ", manager: "Анна", product: "SVL", amount: 40, sold: false, note: "Отказ по срокам" },
]

describe("opportunity summaries", () => {
  it("separates total, tender, sold and active amounts without treating blanks as zero", () => {
    expect(summarizeOpportunities(opportunities)).toEqual({
      total: { amount: 60, count: 4, missingAmountCount: 1 },
      tender: { amount: 20, count: 1, missingAmountCount: 0 },
      sold: { amount: 30, count: 2, missingAmountCount: 1 },
      active: { amount: 30, count: 2, missingAmountCount: 0 },
    })
  })

  it("filters tenders and sold projects independently", () => {
    expect(opportunities.filter((item) => matchesOpportunityStatus(item, "tender"))).toHaveLength(1)
    expect(opportunities.filter((item) => matchesOpportunityStatus(item, "sold"))).toHaveLength(2)
    expect(opportunities.filter((item) => matchesOpportunityStatus(item, "rejected"))).toHaveLength(1)
  })
})
