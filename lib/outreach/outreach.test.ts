import { afterEach, describe, expect, it } from "vitest"
import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { applyCommand, commandSchema, summarizeOutreach, type Workspace } from "./model"
import { initialCatalog, initialWorkspace, mergeCatalog, parseCatalog } from "./catalog"
import { FileOutreachRepository, mutateWorkspace } from "./repository"

const now = "2026-10-26T10:00:00.000Z"
let counter = 0
const uuid = () => `event-${++counter}`
function workspace() { const w = initialWorkspace(); w.projects = w.projects.slice(0, 3); return w }
function qualify(w: Workspace) { return applyCommand(w, { type: "qualify", ids: w.projects.map((p) => p.id) }, "alexey", now, uuid) }

describe("outreach catalog and workflow", () => {
  it("deduplicates the two Moynako names by the same building identities", () => {
    expect(initialCatalog).toHaveLength(46)
    expect(initialCatalog.find((p) => p.aliases.some((name) => name.includes("Мойнако Ривьера")))?.aliases).toHaveLength(2)
    expect(initialCatalog.filter((p) => !p.buildingIds.length)).toHaveLength(3)
  })

  it("does not include unreviewed, inbound, event or active clients in cold-outreach statistics", () => {
    const w = workspace()
    expect(summarizeOutreach(w.projects).total).toBe(0)
    w.projects[0].workflow.qualification = "lead"
    w.projects[1].workflow.qualification = "event"
    w.projects[2].workflow.qualification = "active"
    expect(summarizeOutreach(w.projects).total).toBe(0)
    expect(() => applyCommand(w, { type: "activity", id: w.projects[0].id, version: 1, kind: "proposal_sent", note: "КП", url: "", occurredAt: now }, "alexey", now, uuid)).toThrow("самостоятельно")
  })

  it("counts only explicit dated activities and does not invent a meeting when a proposal is sent", () => {
    let w = qualify(workspace())
    const p = w.projects[0]
    w = applyCommand(w, { type: "activity", id: p.id, version: p.version, kind: "proposal_sent", note: "Отправлено клиенту", occurredAt: now, url: "https://example.com/proposal" }, "alexey", now, uuid)
    expect(summarizeOutreach(w.projects, "2026-10")).toMatchObject({ total: 3, scheduled: 0, held: 0, proposals: 1 })
    expect(summarizeOutreach(w.projects, "2026-09").proposals).toBe(0)
    expect(w.projects[0].workflow.stage).toBe("proposal")
    expect(() => applyCommand(w, { type: "stage", id: p.id, version: w.projects[0].version, stage: "held" }, "alexey", now, uuid)).toThrow("событие")
  })

  it("retains stage, manager, contacts, history and archived state through source refresh", () => {
    const w = qualify(workspace())
    const p = w.projects[0]
    p.workflow.contactName = "Иван Иванов"
    p.workflow.manager = "Дарья Степанова"
    p.workflow.stage = "call"
    p.archivedAt = now
    const updated = mergeCatalog(w, [{ ...p.catalog, name: "Обновлённое название" }], now)
    expect(updated.projects).toHaveLength(3)
    expect(updated.projects[0]).toMatchObject({ id: p.id, archivedAt: now, workflow: p.workflow, events: p.events })
    expect(updated.projects[0].catalog.name).toBe("Обновлённое название")
  })

  it("keeps an initially incomplete object's identity when the parser supplies building IDs", () => {
    const w = workspace()
    const incomplete = w.projects.find((p) => !p.catalog.buildingIds.length)!
    const updated = mergeCatalog(w, [{ ...incomplete.catalog, sourceKey: "enriched-key", buildingIds: ["99999"], sourceTag: "new-group" }], now)
    expect(updated.projects).toHaveLength(3)
    expect(updated.projects.find((p) => p.id === incomplete.id)?.catalog.buildingIds).toEqual(["99999"])
  })

  it("rejects stale edits and future dates for completed actions", () => {
    const w = qualify(workspace())
    const p = w.projects[0]
    expect(() => applyCommand(w, { type: "archive", id: p.id, version: 1 }, "alexey", now, uuid)).toThrow("другим пользователем")
    expect(() => applyCommand(w, { type: "activity", id: p.id, version: p.version, kind: "meeting_held", note: "Результат", url: "", occurredAt: "2026-11-01T10:00:00Z" }, "alexey", now, uuid)).toThrow("будущей")
  })

  it("rejects unsafe links and invalid manager values at the server boundary", () => {
    expect(commandSchema.safeParse({ type: "create", name: "ЖК", city: "", group: "", developer: "", url: "javascript:alert(1)", qualification: "cold", manager: "" }).success).toBe(false)
    expect(() => parseCatalog([["Wrong header"]], now)).toThrow("заголовки")
  })
})

describe("durable repository and concurrent edits", () => {
  const directories: string[] = []
  afterEach(async () => { await Promise.all(directories.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))) })

  it("persists changes across repository instances and prevents a stale overwrite", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "outreach-test-")); directories.push(dir)
    const filename = path.join(dir, "workspace.json")
    const repo = new FileOutreachRepository(filename)
    const first = await repo.read()
    const data = qualify(first.data)
    expect(await repo.write(data, first.revision)).toBe(true)
    const reopened = new FileOutreachRepository(filename)
    expect((await reopened.read()).data).toEqual(data)
    expect(await reopened.write(first.data, first.revision)).toBe(false)
  })

  it("merges concurrent updates to different records without losing either change", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "outreach-test-")); directories.push(dir)
    const repo = new FileOutreachRepository(path.join(dir, "workspace.json"))
    const initial = await repo.read()
    const ids = initial.data.projects.slice(0, 2).map((p) => p.id)
    await Promise.all(ids.map((id) => mutateWorkspace(repo, (w) => applyCommand(w, { type: "archive", id, version: 1 }, "alexey", now, uuid))))
    expect((await repo.read()).data.projects.filter((p) => ids.includes(p.id) && p.archivedAt)).toHaveLength(2)
  })
})
