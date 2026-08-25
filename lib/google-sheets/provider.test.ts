import { describe, expect, it } from "vitest"

import { parseGvizResponse, parseMeetingsTable, parseMonthlyTable, parseOpportunitiesTable, type GvizTable } from "./provider"

const managers = ["Алексей Ладьин", "Анастасия Маслихова", "Дарья Степанова"]

function row(values: Record<number, unknown>) {
  const cells = Array.from({ length: Math.max(...Object.keys(values).map(Number)) + 1 }, () => null) as Array<{ v: unknown; f?: string } | null>
  for (const [column, value] of Object.entries(values)) cells[Number(column)] = { v: value }
  return { c: cells }
}

describe("Google Sheets normalization", () => {
  it("extracts revenue and operational KPI values from a monthly sheet", () => {
    const table: GvizTable = { rows: [
      row({ 1: managers[0], 2: 12_500_000, 4: 351_000 }),
      row({ 1: managers[1], 2: 12_500_000, 4: 10_759_350 }),
      row({ 1: managers[2], 2: 10_000_000, 4: 7_687_720 }),
      row({ 1: "По отделу", 2: 35_000_000, 4: 18_798_070 }),
      row({ 1: managers[0], 2: "Состоялось разговоров", 3: 310, 5: 292 }),
      row({ 2: "Проведено встреч по новым проектам", 3: 8, 5: 4 }),
      row({ 2: "Сделано КП всего (шт)", 3: 24, 5: 16 }),
      row({ 2: "Продаж всего (шт)", 3: 5, 5: 1 }),
    ] }

    const result = parseMonthlyTable("Июль", table)
    expect(result.managers).toEqual(managers)
    expect(result.records).toContainEqual({ period: "Июль", manager: managers[0], kpi: "revenue", plan: 12_500_000, fact: 351_000 })
    expect(result.records).toContainEqual({ period: "Июль", manager: managers[0], kpi: "calls", plan: 310, fact: 292 })
    expect(result.records).toContainEqual({ period: "Июль", manager: managers[0], kpi: "newMeetings", plan: 8, fact: 4 })
    expect(result.records).toContainEqual({ period: "Июль", manager: managers[0], kpi: "proposals", plan: 24, fact: 16 })
    expect(result.records).toContainEqual({ period: "Июль", manager: managers[0], kpi: "salesCount", plan: 5, fact: 1 })
  })

  it("keeps opportunity month sections and expands manager aliases", () => {
    const table: GvizTable = { rows: [
      row({ 0: "Июль" }),
      row({ 0: "Old", 1: "Old project", 2: "Алексей Л", 4: 1, 5: false }),
      row({ 0: "Август" }),
      row({ 0: "MR Group", 1: "Ситизен", 2: "Анастасия М", 4: 4_600_000, 5: false, 6: "тендер" }),
    ] }

    expect(parseOpportunitiesTable(table, managers)).toEqual([
      { period: "Июль", company: "Old", project: "Old project", manager: "Алексей Ладьин", amount: 1, sold: false },
      { period: "Август", company: "MR Group", project: "Ситизен", manager: "Анастасия Маслихова", amount: 4_600_000, sold: false, note: "тендер" },
    ])
  })

  it("normalizes meeting dates, managers and multiple deal links", () => {
    const meetingRow = row({
      1: "Маслихова",
      2: "Date(2026,7,21)",
      3: "11.00",
      4: "MR Group",
      5: "VEER & SET",
      6: "https://example.com/deal/1 https://example.com/deal/2",
      7: "https://nas.example.com/video",
      8: "Техническая встреча",
    })
    meetingRow.c[2] = { v: "Date(2026,7,21)", f: "21.08.2026" }
    const result = parseMeetingsTable({ rows: [meetingRow] }, managers)

    expect(result).toEqual([{
      manager: "Анастасия Маслихова",
      date: "2026-08-21",
      dateLabel: "21.08.2026",
      time: "11.00",
      company: "MR Group",
      project: "VEER & SET",
      dealUrls: ["https://example.com/deal/1", "https://example.com/deal/2"],
      nasUrl: "https://nas.example.com/video",
      status: "Техническая встреча",
    }])
  })

  it("rejects malformed query responses", () => {
    expect(() => parseGvizResponse("not json")).toThrow("unexpected response")
  })
})
