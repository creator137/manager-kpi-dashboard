import { createHash } from "node:crypto"
import { parse } from "csv-parse/sync"
import snapshot from "@/data/outreach-catalog-snapshot.json"
import { emptyWorkflow, OutreachError, type CatalogItem, type Workspace } from "./model"

export const CATALOG_URL = "https://docs.google.com/spreadsheets/d/1stjua_RUZDTT8b-N92Ym_SWWNr4oFn5yEvZaP_Ksvic/edit?gid=782042761"
const normalize = (v: string) => v.toLocaleLowerCase("ru-RU").replace(/[«»"\s]/g, "")

export function parseCatalog(rows: unknown[][], syncedAt: string): CatalogItem[] {
  const header = rows[0]?.map((v) => String(v).replace(/^\uFEFF/, "").trim()) ?? []
  const column = (name: string) => header.indexOf(name)
  if (column("Название ЖК / Проекта") < 0 || column("ID объектов (корпуса)") < 0) throw new OutreachError("В источнике изменились заголовки списка ЖК")
  const result = new Map<string, CatalogItem>()
  for (const row of rows.slice(1)) {
    const value = (name: string) => String(row[column(name)] ?? "").trim()
    const name = value("Название ЖК / Проекта")
    if (!name) continue
    const buildingIds = [...new Set(value("ID объектов (корпуса)").split(/[,;\s]+/).filter((id) => /^\d+$/.test(id)))].sort()
    const sourceKey = createHash("sha256").update(buildingIds.length ? buildingIds.join(",") : normalize(name)).digest("hex").slice(0,24)
    const previous = result.get(sourceKey)
    if (previous) { previous.aliases = [...new Set([...previous.aliases, name])]; continue }
    result.set(sourceKey, {
      sourceKey, sourceTag: value("Тег сшивки"), origin: "parser", name, aliases: [name],
      city: value("Город/район"), developer: value("Застройщик(и)"), group: [...new Set(value("Группа-компаний").split(",").map((part) => part.replace(/^[\s\[\]'\"]+|[\s\[\]'\"]+$/g, "")).filter(Boolean))].join(" · "),
      housingClass: value("Класс(ы) жилья"), priority: value("Приоритет"), buildingIds,
      links: value("Ссылки на корпуса").split(/[,\s]+/).filter((url) => /^https?:\/\//.test(url)), syncedAt,
    })
  }
  if (!result.size) throw new OutreachError("Источник вернул пустой список ЖК. Существующие записи сохранены.")
  return [...result.values()]
}

export const initialCatalog = parseCatalog(snapshot.rows, snapshot.asOf)
export async function fetchCatalog() {
  const response = await fetch("https://docs.google.com/spreadsheets/d/1stjua_RUZDTT8b-N92Ym_SWWNr4oFn5yEvZaP_Ksvic/export?format=csv&gid=782042761", { cache: "no-store", signal: AbortSignal.timeout(20_000) })
  if (!response.ok) throw new OutreachError("Не удалось обновить список из Google Sheets. Существующие данные сохранены.")
  const body = await response.text()
  if (/^\s*</.test(body)) throw new OutreachError("Таблица требует доступа. Существующие данные сохранены.")
  return parseCatalog(parse(body, { bom: true, skip_empty_lines: true }) as unknown[][], new Date().toISOString())
}

export function mergeCatalog(workspace: Workspace, items: CatalogItem[], now: string): Workspace {
  const projects = [...workspace.projects]
  for (const item of items) {
    const index = projects.findIndex((p) => p.catalog.origin === "parser" && (p.catalog.sourceKey === item.sourceKey || (item.sourceTag && p.catalog.sourceTag === item.sourceTag) || (!p.catalog.buildingIds.length && item.aliases.some((name) => p.catalog.aliases.some((old) => normalize(name) === normalize(old))))))
    if (index >= 0) {
      // Source refresh must never overwrite manager work or resurrect archived records.
      projects[index] = { ...projects[index], catalog: item, version: projects[index].version + 1, updatedAt: now }
    } else projects.push({
      id: `parser-${item.sourceKey}`, version: 1, catalog: item, workflow: { ...emptyWorkflow },
      events: [{ id: `import-${item.sourceKey}`, kind: "created", label: "ЖК импортирован из expocrimea", note: "Источник обращения требует проверки", occurredAt: now, recordedAt: now, actor: "Импорт" }],
      createdAt: now, updatedAt: now, archivedAt: null,
    })
  }
  return { projects, syncedAt: now }
}
export function initialWorkspace(): Workspace { return mergeCatalog({ projects: [], syncedAt: null }, initialCatalog, snapshot.asOf) }
