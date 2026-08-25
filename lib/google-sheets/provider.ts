import type {
  DashboardDataProvider,
  DashboardRecord,
  DashboardSnapshot,
  KpiKey,
  Meeting,
  Opportunity,
  SalesPlan,
} from "@/lib/dashboard/types"

type GvizCell = {
  v: unknown
  f?: string
}

export type GvizTable = {
  rows: Array<{ c: Array<GvizCell | null> }>
}

type GvizResponse = {
  status: "ok" | "error"
  errors?: Array<{ detailed_message?: string; message?: string }>
  table?: GvizTable
}

const MONTHS_2026 = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
] as const

const DEFAULT_REVALIDATE_SECONDS = 60

function cellValue(row: GvizTable["rows"][number], column: number) {
  return row.c?.[column]?.v ?? null
}

function textValue(row: GvizTable["rows"][number], column: number) {
  const value = cellValue(row, column)
  return typeof value === "string" ? value.trim() : ""
}

function formattedTextValue(row: GvizTable["rows"][number], column: number) {
  const formatted = row.c?.[column]?.f
  return typeof formatted === "string" ? formatted.trim() : textValue(row, column)
}

function numberValue(row: GvizTable["rows"][number], column: number) {
  const value = cellValue(row, column)
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value !== "string") return null

  const normalized = value.replace(/\s/g, "").replace(",", ".").replace(/[^\d.-]/g, "")
  if (!/\d/.test(normalized)) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function kpiForLabel(label: string): KpiKey | null {
  const normalized = label.toLocaleLowerCase("ru-RU")
  if (normalized.includes("состоялось разговоров")) return "calls"
  if (normalized.includes("встреч") && normalized.includes("новым проектам")) return "newMeetings"
  if (normalized.includes("сделано кп") && !normalized.includes("сумм")) return "proposals"
  if (/^продаж(?: всего)? \(шт\)/.test(normalized)) return "salesCount"
  return null
}

export function parseMonthlyTable(period: string, table: GvizTable) {
  const records: DashboardRecord[] = []
  const managers: string[] = []

  for (const row of table.rows.slice(0, 10)) {
    const manager = textValue(row, 1)
    const plan = numberValue(row, 2)
    if (!manager || manager.startsWith("По отделу") || plan === null) continue

    managers.push(manager)
    records.push({ period, manager, kpi: "revenue", plan, fact: numberValue(row, 4) })
  }

  let currentManager: string | null = null
  for (const row of table.rows) {
    const manager = textValue(row, 1)
    if (managers.includes(manager)) currentManager = manager

    const kpi = kpiForLabel(textValue(row, 2))
    if (!currentManager || !kpi) continue

    records.push({
      period,
      manager: currentManager,
      kpi,
      plan: numberValue(row, 3),
      fact: numberValue(row, 5),
    })
  }

  return { managers, records }
}

function resolveManager(alias: string, managers: string[]) {
  const [firstName, lastInitial = ""] = alias.trim().split(/\s+/)
  return managers.find((manager) => {
    const [managerFirstName, managerLastName = ""] = manager.split(/\s+/)
    return managerFirstName === firstName && managerLastName.startsWith(lastInitial)
  }) ?? alias
}

export function parseOpportunitiesTable(
  table: GvizTable,
  managers: string[],
): Opportunity[] {
  let period = ""

  return table.rows.flatMap((row) => {
    const company = textValue(row, 0)
    if (MONTHS_2026.includes(company as (typeof MONTHS_2026)[number])) {
      period = company
      return []
    }

    const managerAlias = textValue(row, 2)
    if (!period || !company || !managerAlias) return []

    const notes = [textValue(row, 6), textValue(row, 7)].filter(Boolean)
    return [{
      period,
      company,
      project: textValue(row, 1) || "Без названия проекта",
      manager: resolveManager(managerAlias, managers),
      amount: numberValue(row, 4) ?? 0,
      sold: cellValue(row, 5) === true,
      dealUrl: textValue(row, 3) || undefined,
      note: notes.length ? notes.join(" · ") : undefined,
    }]
  })
}

function meetingDate(row: GvizTable["rows"][number]) {
  const raw = textValue(row, 2)
  const match = /^Date\((\d{4}),(\d{1,2}),(\d{1,2})\)$/.exec(raw)
  if (!match) return ""
  return `${match[1]}-${String(Number(match[2]) + 1).padStart(2, "0")}-${match[3].padStart(2, "0")}`
}

function meetingManager(alias: string, managers: string[]) {
  const normalized = alias.toLocaleLowerCase("ru-RU")
  return managers.find((manager) => manager.split(/\s+/).some((part) =>
    part.toLocaleLowerCase("ru-RU").startsWith(normalized),
  )) ?? alias
}

function urlsFrom(value: string) {
  return value.match(/https?:\/\/[^\s]+/g) ?? []
}

export function parseMeetingsTable(table: GvizTable, managers: string[]): Meeting[] {
  return table.rows.flatMap((row) => {
    const managerAlias = textValue(row, 1)
    const company = textValue(row, 4)
    const date = meetingDate(row)
    if (!managerAlias || !company || !date) return []

    return [{
      manager: meetingManager(managerAlias, managers),
      date,
      dateLabel: formattedTextValue(row, 2),
      time: textValue(row, 3),
      company,
      project: textValue(row, 5) || "Без названия проекта",
      dealUrls: urlsFrom(textValue(row, 6)),
      nasUrl: urlsFrom(textValue(row, 7))[0],
      status: textValue(row, 8) || undefined,
    }]
  })
}

export function parseSalesPlanTable(table: GvizTable): SalesPlan {
  const planRow = table.rows.find((row) => {
    const section = textValue(row, 0).toLocaleLowerCase("ru-RU")
    const label = textValue(row, 1).toLocaleLowerCase("ru-RU")
    return section.includes("план продаж") && section.includes("центральный блок")
      && label.includes("годовой прогноз")
  })
  if (!planRow) throw new Error("Sales plan row was not found")

  const months = MONTHS_2026.map((period, index) => ({
    period,
    plan: numberValue(planRow, index + 2),
  }))
  if (months.some((item) => item.plan === null)) {
    throw new Error("Sales plan contains an empty monthly value")
  }

  const annualPlan = numberValue(planRow, 14)
  if (annualPlan === null) throw new Error("Annual sales plan was not found")

  return {
    year: 2026,
    annualPlan,
    months: months as SalesPlan["months"],
  }
}

export function parseGvizResponse(body: string): GvizTable {
  const prefix = "google.visualization.Query.setResponse("
  const start = body.indexOf(prefix)
  const end = body.lastIndexOf(");")
  if (start < 0 || end < 0) throw new Error("Google Sheets returned an unexpected response")

  const payload = JSON.parse(body.slice(start + prefix.length, end)) as GvizResponse
  if (payload.status !== "ok" || !payload.table) {
    const detail = payload.errors?.[0]?.detailed_message ?? payload.errors?.[0]?.message
    throw new Error(detail ?? "Google Sheets query failed")
  }
  return payload.table
}

function periodsAvailableToday(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    timeZone: "Asia/Yekaterinburg",
  }).formatToParts(date)
  const year = Number(parts.find((part) => part.type === "year")?.value)
  const month = Number(parts.find((part) => part.type === "month")?.value)
  const count = year < 2026 ? 0 : year > 2026 ? 12 : month
  return MONTHS_2026.slice(0, Math.max(1, count))
}

export class GoogleSheetsProvider implements DashboardDataProvider {
  constructor(
    private readonly spreadsheetId: string,
    private readonly salesPlanSpreadsheetId: string,
    private readonly revalidateSeconds = DEFAULT_REVALIDATE_SECONDS,
  ) {}

  private async getTable(spreadsheetId: string, sheet?: string) {
    const url = new URL(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq`)
    url.searchParams.set("tqx", "out:json")
    if (sheet) url.searchParams.set("sheet", sheet)

    const response = await fetch(url, { next: { revalidate: this.revalidateSeconds } })
    if (!response.ok) throw new Error(`Google Sheets returned HTTP ${response.status} for ${sheet ?? spreadsheetId}`)
    return parseGvizResponse(await response.text())
  }

  async getSnapshot(): Promise<DashboardSnapshot> {
    const now = new Date()
    const periods = [...periodsAvailableToday(now)]
    const [monthlyTables, opportunitiesTable, meetingsTable, salesPlanTable] = await Promise.all([
      Promise.all(periods.map((period) => this.getTable(this.spreadsheetId, `${period} 2026`))),
      this.getTable(this.spreadsheetId, "Высоковероятные проекты"),
      this.getTable(this.spreadsheetId, "Журнал встреч"),
      this.getTable(this.salesPlanSpreadsheetId),
    ])

    const monthly = monthlyTables.map((table, index) => parseMonthlyTable(periods[index], table))
    const managers = [...new Set(monthly.flatMap((item) => item.managers))]

    return {
      source: "google-sheets",
      sourceLabel: "Google Sheets · live read-only",
      asOf: now.toISOString(),
      periods,
      managers,
      records: monthly.flatMap((item) => item.records),
      opportunities: parseOpportunitiesTable(opportunitiesTable, managers),
      meetings: parseMeetingsTable(meetingsTable, managers),
      salesPlan: parseSalesPlanTable(salesPlanTable),
    }
  }
}
