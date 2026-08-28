import { describe, expect, it } from "vitest"

import { parseGvizResponse, parseMeetingsTable, parseMonthlyTable, parseOpportunitiesTable, parseSalesPlanTable, parseSalesStatisticsTable, type GvizTable } from "./provider"

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

  it("extracts the central block annual and monthly sales plan", () => {
    const monthlyPlans = [13, 21, 30, 25, 37, 26, 33, 33, 36, 33, 21, 21]
    const table: GvizTable = { rows: [
      row({ 0: "План Производства 2026г:", 1: "Согласно плану продаж на 2026год, годовой прогноз", 14: 232 }),
      row({ 0: "План продаж  центральный блок 2026г:", 1: "Прогноз, годовой прогноз", ...Object.fromEntries(monthlyPlans.map((value, index) => [index + 2, value])), 14: 333 }),
    ] }

    expect(parseSalesPlanTable(table)).toEqual({
      year: 2026,
      annualPlan: 333,
      months: monthlyPlans.map((plan, index) => ({ period: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"][index], plan })),
    })
  })

  it("extracts 2026 monthly totals from the sales statistics block", () => {
    const table: GvizTable = { rows: [
      row({ 1: "План Продаж, руб", 15: 13, 20: 26, 21: 6, 26: 33, 31: 34 }),
      row({ 1: "Ежемесячный Прогноз продаж", 15: 12, 20: 30, 26: 35, 31: 35 }),
      row({ 1: "Факт продаж, руб", 15: 4, 20: 23, 21: 2, 26: 21, 31: 31 }),
      row({ 1: "План Назначено встреч", 15: 16, 20: 38, 26: 36, 31: 36 }),
      row({ 1: "Факт назначено встреч для мероприятий  ", 15: 22, 20: 15, 26: 16 }),
      row({ 1: "Новые квалифицированные лиды, шт", 15: 9, 20: 39, 26: 10 }),
      row({ 1: "Кол-во встреч по воронке \"Новые клиенты\", шт.", 15: 6, 20: 11, 26: 7 }),
      row({ 1: "Кол-во продаж по воронке  \"Новые клиенты\", шт", 15: 0, 20: 0, 26: 0 }),
    ] }

    const result = parseSalesStatisticsTable(table)

    expect(result.months).toHaveLength(8)
    expect(result.months[0]).toMatchObject({ period: "Январь", salesPlan: 13, salesFact: 4, qualifiedLeads: 9 })
    expect(result.months[5]).toMatchObject({ period: "Июнь", salesPlan: 26, salesFact: 23 })
    expect(result.months[6]).toMatchObject({ period: "Июль", salesPlan: 33, salesFact: 21 })
    expect(result.months[7]).toMatchObject({ period: "Август", salesPlan: 34, salesFact: 31 })
  })

  it("rejects malformed query responses", () => {
    expect(() => parseGvizResponse("not json")).toThrow("unexpected response")
  })
})
