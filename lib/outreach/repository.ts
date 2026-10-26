import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { neon, type NeonQueryFunction } from "@neondatabase/serverless"
import { initialWorkspace } from "./catalog"
import type { Workspace } from "./model"

type StoredWorkspace = { revision: number; data: Workspace }
export interface OutreachRepository {
  read(): Promise<StoredWorkspace>
  write(data: Workspace, expectedRevision: number): Promise<boolean>
}

export class PostgresOutreachRepository implements OutreachRepository {
  private sql: NeonQueryFunction<false, false>
  private ready?: Promise<void>
  constructor(url: string) { this.sql = neon(url) }
  private initialize() {
    if (!this.ready) this.ready = (async () => {
      await this.sql`CREATE TABLE IF NOT EXISTS outreach_workspace (id TEXT PRIMARY KEY, revision INTEGER NOT NULL DEFAULT 0, payload JSONB NOT NULL)`
      await this.sql`INSERT INTO outreach_workspace (id, payload) VALUES ('default', ${JSON.stringify(initialWorkspace())}::jsonb) ON CONFLICT (id) DO NOTHING`
    })().catch((error) => { this.ready = undefined; throw error })
    return this.ready
  }
  async read() {
    await this.initialize()
    const rows = await this.sql`SELECT revision, payload FROM outreach_workspace WHERE id = 'default'`
    return { revision: Number(rows[0].revision), data: rows[0].payload as Workspace }
  }
  async write(data: Workspace, expectedRevision: number) {
    await this.initialize()
    const rows = await this.sql`UPDATE outreach_workspace SET payload = ${JSON.stringify(data)}::jsonb, revision = revision + 1 WHERE id = 'default' AND revision = ${expectedRevision} RETURNING revision`
    return rows.length === 1
  }
}

// Persistent local development storage; never used for production writes.
export class FileOutreachRepository implements OutreachRepository {
  constructor(private filename = path.join(process.cwd(), ".data", "outreach.json")) {}
  async read(): Promise<StoredWorkspace> {
    try { return JSON.parse(await readFile(this.filename, "utf8")) as StoredWorkspace }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; return { revision: 0, data: initialWorkspace() } }
  }
  async write(data: Workspace, expectedRevision: number) {
    await mkdir(path.dirname(this.filename), { recursive: true })
    const lock = `${this.filename}.lock`
    let acquired = false
    for (let attempt = 0; attempt < 40 && !acquired; attempt++) {
      try { await mkdir(lock); acquired = true }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; await new Promise((resolve) => setTimeout(resolve, 25)) }
    }
    if (!acquired) throw new Error("Хранилище занято. Повторите сохранение.")
    const temporary = `${this.filename}.${randomUUID()}.tmp`
    try {
      if ((await this.read()).revision !== expectedRevision) return false
      await writeFile(temporary, JSON.stringify({ revision: expectedRevision + 1, data }), { mode: 0o600 })
      await rename(temporary, this.filename)
      return true
    } finally { await rm(temporary, { force: true }); await rm(lock, { recursive: true, force: true }) }
  }
}

let repository: OutreachRepository | undefined
function databaseUrl() { return process.env.OUTREACH_DATABASE_URL ?? process.env.DATABASE_URL }
export function outreachStorageMode() { return databaseUrl() ? "shared" : process.env.NODE_ENV !== "production" ? "local" : "unavailable" }
export function getOutreachRepository(): OutreachRepository {
  if (outreachStorageMode() === "unavailable") throw new Error("Для сохранения проработки подключите общую базу данных")
  if (!repository) { const url = databaseUrl(); repository = url ? new PostgresOutreachRepository(url) : new FileOutreachRepository() }
  return repository
}
export async function mutateWorkspace(repo: OutreachRepository, update: (data: Workspace) => Workspace) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const current = await repo.read()
    const data = update(structuredClone(current.data))
    if (await repo.write(data, current.revision)) return data
  }
  throw new Error("Другой пользователь сохраняет изменения. Обновите список и повторите действие.")
}
