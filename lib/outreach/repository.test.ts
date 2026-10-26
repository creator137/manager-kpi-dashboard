import { beforeEach, describe, expect, it, vi } from "vitest"
const { query } = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock("@neondatabase/serverless", () => ({ neon: () => query }))
import { PostgresOutreachRepository } from "./repository"
import { initialWorkspace } from "./catalog"

describe("Postgres transport", () => {
  beforeEach(() => query.mockReset())

  it("reads persisted data and binds the expected revision to an atomic write", async () => {
    const data = initialWorkspace()
    query.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([{ revision: 7, payload: data }]).mockResolvedValueOnce([{ revision: 8 }])
    const repo = new PostgresOutreachRepository("postgres://test")
    expect(await repo.read()).toEqual({ revision: 7, data })
    expect(await repo.write(data, 7)).toBe(true)
    const call = query.mock.calls.at(-1)!
    expect(call[0].join("?")).toContain("AND revision = ?")
    expect(call.at(-1)).toBe(7)
    expect(call[1]).toBe(JSON.stringify(data))
  })

  it("reports a lost write race instead of claiming a save succeeded", async () => {
    query.mockResolvedValue([])
    const repo = new PostgresOutreachRepository("postgres://test")
    expect(await repo.write(initialWorkspace(), 3)).toBe(false)
  })
})
