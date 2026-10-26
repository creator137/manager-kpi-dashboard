import { afterEach, describe, expect, it, vi } from "vitest"

import { dashboardSnapshot } from "@/data/dashboard-snapshot"
import { GoogleSheetsProvider, parseCsvTable, parseGvizResponse, parseMeetingsTable, parseMonthlyTable, parseOpportunitiesTable, parseSalesPlanTable, parseSalesStatisticsTable, type GvizTable } from "./provider"

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

  it("extracts pre-sale daily facts and excludes the department summary", () => {
    const table: GvizTable = { rows: [
      row({ 1: "Алексей\nЛадьин", 2: 15_000_000, 4: 0 }),
      row({ 1: managers[1], 2: 15_000_000, 4: 19_912_052 }),
      row({ 1: managers[2], 2: 10_000_000, 4: 4_596_152 }),
      row({ 1: "По отделу", 2: 40_000_000, 4: 24_508_204 }),
      row({ 1: "Алексей\nЛадьин", 2: "Состоялось разговоров", 3: 310, 5: 193 }),
      row({ 2: "Проведено pre -sale встреч", 34: 0, 35: 0, 36: 0, 37: 0, 38: 1 }),
      row({ 1: managers[1], 2: "Состоялось разговоров", 3: 20, 5: 153 }),
      row({ 2: "Проведено pre-sale встреч", 35: 0, 36: 0, 37: 0 }),
      row({ 1: managers[2], 2: "Состоялось разговоров", 3: 20, 5: 94 }),
      row({ 2: "Проведено pre sale встреч", 34: 0, 35: 0, 36: 0, 37: 0, 38: 0 }),
      row({ 1: "Свод", 2: "Состоялось разговоров", 3: 350, 5: 440 }),
      row({ 2: "Проведено встреч по новым проектам", 3: 25, 5: 7 }),
    ] }

    const result = parseMonthlyTable("Сентябрь", table)

    expect(result.managers).toEqual(managers)
    expect(result.records.filter((record) => record.kpi === "preSaleMeetings")).toEqual([
      { period: "Сентябрь", manager: managers[0], kpi: "preSaleMeetings", plan: null, fact: 1 },
      { period: "Сентябрь", manager: managers[1], kpi: "preSaleMeetings", plan: null, fact: 0 },
      { period: "Сентябрь", manager: managers[2], kpi: "preSaleMeetings", plan: null, fact: 0 },
    ])
    expect(result.records.filter((record) => record.kpi === "newMeetings")).toHaveLength(0)
    expect(result.records.filter((record) => record.kpi === "calls")).toHaveLength(3)
  })

  it("keeps opportunity month sections and expands manager aliases", () => {
    const table: GvizTable = {
      cols: [
        { label: "Компания" }, { label: "Название" }, { label: "Менеджер" },
        { label: "Ссылка" }, { label: "Продукт" }, { label: "Сумма" },
        { label: "" }, { label: "Дата отправки КП" }, { label: "Продано" },
        { label: "Коментарий" }, { label: "" },
      ],
      rows: [
      row({ 0: "Июль" }),
      row({ 0: "Old", 1: "Old project", 2: "Алексей Л", 4: "SVL", 5: 1, 8: false }),
      row({ 0: "Август" }),
      row({ 0: "MR Group", 1: "Ситизен", 2: "Анастасия М", 4: "ЦОП", 5: 4_600_000, 8: true, 9: "тендер" }),
    ] }

    expect(parseOpportunitiesTable(table, managers)).toEqual([
      { period: "Июль", company: "Old", project: "Old project", manager: "Алексей Ладьин", product: "SVL", amount: 1, sold: false },
      { period: "Август", company: "MR Group", project: "Ситизен", manager: "Анастасия Маслихова", product: "ЦОП", amount: 4_600_000, sold: true, note: "тендер" },
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

  it("preserves text amounts, checkbox strings and quoted multiline project names in CSV exports", () => {
    const table = parseCsvTable('Компания,Название,Менеджер,Ссылка,Продукт,Сумма,Вероятность,Дата,Продано,Коментарий\r\nОктябрь,,,,,,,,,\r\nССК,"Хако,\nэтап 2",Дарья С,,SVL,6 874 032,,,TRUE,\r\nНеометрия,МЖК,Анастасия М,,ЦОП,"14 200 000,00",,,FALSE,Тендер\r\n')
    const projects = parseOpportunitiesTable(table, managers)
    expect(projects).toHaveLength(2)
    expect(projects[0]).toMatchObject({ period: "Октябрь", project: "Хако,\nэтап 2", amount: 6_874_032, sold: true })
    expect(projects[1]).toMatchObject({ period: "Октябрь", amount: 14_200_000, sold: false, note: "Тендер" })
    expect(() => parseCsvTable("<html>Sign in</html>")).toThrow("HTML")
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

  it("discovers new statistics months without counting weekly columns as monthly totals", () => {
    const table: GvizTable = { rows: [
      row({ 15: "Январь 2026", 16: "Февраль 2026", 37: "Сентябрь 2026", 43: "Октябрь 2026", 44: "02.10 - 08.10" }),
      row({ 1: "Факт продаж, руб", 15: 4_011_424, 16: 21_350_000, 37: 27_277_724, 44: 2_965_180 }),
    ] }
    const result = parseSalesStatisticsTable(table)
    expect(result.months.map((month) => month.period)).toEqual(["Январь", "Февраль", "Сентябрь", "Октябрь"])
    expect(result.months.at(-2)?.salesFact).toBe(27_277_724)
    expect(result.months.at(-1)?.salesFact).toBeNull()
  })
})

describe("independent source loading", () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

  function mockSources(failedMonth?: string) {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-10-26T08:00:00Z"))
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.stubGlobal("fetch", vi.fn(async (input: URL) => {
      const url = new URL(input)
      if (url.pathname.includes("/plan/")) return new Response("Unauthorized", { status: 401 })
      const sheet = url.searchParams.get("sheet")
      if (sheet === `${failedMonth} 2026`) return new Response("Unavailable", { status: 503 })
      if (url.pathname.endsWith("/export")) {
        if (url.pathname.includes("/statistics/")) {
          const headers = Array.from({ length: 16 }, (_, i) => `Column ${i}`).join(",")
          return new Response(`${headers}\n,"Факт продаж, руб",${Array(13).fill("").join(",")},10\n`)
        }
        return new Response('Компания,Название,Менеджер,Ссылка,Продукт,Сумма,Вероятность,Дата,Продано,Коментарий\nОктябрь,,,,,,,,,\nССК,Хако,Дарья С,,SVL,6 874 032,,,TRUE,\n')
      }
      const rows = sheet === "Блок продаж"
        ? [row({ 1: "Факт продаж, руб", 15: 10 })]
        : sheet === "Журнал встреч" ? [] : [row({ 1: managers[0], 2: 13_500_000, 4: 2_965_000 })]
      return new Response(`google.visualization.Query.setResponse(${JSON.stringify({ status: "ok", table: { rows } })});`)
    }))
    return new GoogleSheetsProvider("main", "plan", "statistics")
  }

  it("keeps October and current projects live when the annual plan returns HTTP 401", async () => {
    const snapshot = await mockSources().getSnapshot()
    expect(snapshot.periods).toHaveLength(10)
    expect(snapshot.periods.at(-1)).toBe("Октябрь")
    expect(snapshot.records).toContainEqual({ period: "Октябрь", manager: managers[0], kpi: "revenue", plan: 13_500_000, fact: 2_965_000 })
    expect(snapshot.opportunities[0]).toMatchObject({ period: "Октябрь", amount: 6_874_032, sold: true })
    expect(snapshot.salesPlan).toEqual(dashboardSnapshot.salesPlan)
    expect(snapshot.source).toBe("google-sheets")
    expect(snapshot.warnings).toHaveLength(1)
    expect(snapshot.warnings?.[0]).toContain("Годовой план продаж")
  })

  it("isolates a failed historical month and retains healthy current data", async () => {
    const snapshot = await mockSources("Сентябрь").getSnapshot()
    expect(snapshot.records.filter((record) => record.period === "Сентябрь")).toEqual(dashboardSnapshot.records.filter((record) => record.period === "Сентябрь"))
    expect(snapshot.records.some((record) => record.period === "Октябрь" && record.fact === 2_965_000)).toBe(true)
    expect(snapshot.opportunities[0].amount).toBe(6_874_032)
    expect(snapshot.warnings).toHaveLength(2)
  })
})
