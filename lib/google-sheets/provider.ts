import type {
  DashboardDataProvider,
  DashboardRecord,
  DashboardSnapshot,
  KpiKey,
  Opportunity,
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
  currentPeriod: string,
): Opportunity[] {
  const markerIndex = table.rows.findIndex((row) => textValue(row, 0) === currentPeriod)
  if (markerIndex < 0) return []

  return table.rows.slice(markerIndex + 1).flatMap((row) => {
    const company = textValue(row, 0)
    const managerAlias = textValue(row, 2)
    if (!company || !managerAlias) return []

    const notes = [textValue(row, 6), textValue(row, 7)].filter(Boolean)
    return [{
      company,
      project: textValue(row, 1) || "Без названия проекта",
      manager: resolveManager(managerAlias, managers),
      amount: numberValue(row, 4) ?? 0,
      sold: cellValue(row, 5) === true,
      note: notes.length ? notes.join(" · ") : undefined,
    }]
  })
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
    private readonly revalidateSeconds = DEFAULT_REVALIDATE_SECONDS,
  ) {}

  private async getTable(sheet: string) {
    const url = new URL(`https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq`)
    url.searchParams.set("tqx", "out:json")
    url.searchParams.set("sheet", sheet)

    const response = await fetch(url, { next: { revalidate: this.revalidateSeconds } })
    if (!response.ok) throw new Error(`Google Sheets returned HTTP ${response.status} for ${sheet}`)
    return parseGvizResponse(await response.text())
  }

  async getSnapshot(): Promise<DashboardSnapshot> {
    const now = new Date()
    const periods = [...periodsAvailableToday(now)]
    const [monthlyTables, opportunitiesTable] = await Promise.all([
      Promise.all(periods.map((period) => this.getTable(`${period} 2026`))),
      this.getTable("Высоковероятные проекты"),
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
      opportunities: parseOpportunitiesTable(opportunitiesTable, managers, periods.at(-1) ?? ""),
    }
  }
}
