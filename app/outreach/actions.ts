"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { requireSession } from "@/lib/auth/session"
import { applyCommand, commandSchema, OutreachError, type Workspace } from "@/lib/outreach/model"
import { fetchCatalog, mergeCatalog } from "@/lib/outreach/catalog"
import { getOutreachRepository, mutateWorkspace } from "@/lib/outreach/repository"

export type OutreachResult = { ok: true; data: Workspace } | { ok: false; error: string }
export async function loadOutreach(): Promise<OutreachResult> {
  await requireSession()
  try { return { ok: true, data: (await getOutreachRepository().read()).data } }
  catch { return { ok: false, error: "Общая база временно недоступна. Обновите страницу; изменения не потеряны." } }
}
export async function executeOutreach(input: unknown): Promise<OutreachResult> {
  await requireSession()
  const parsed = commandSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Проверьте заполнение полей" }
  try {
    const data = await mutateWorkspace(getOutreachRepository(), (workspace) => applyCommand(workspace, parsed.data, process.env.DASHBOARD_USERNAME ?? "Общий вход", new Date().toISOString(), randomUUID))
    revalidatePath("/outreach")
    return { ok: true, data }
  } catch (error) { if (!(error instanceof OutreachError)) console.error("Outreach save failed", error); return { ok: false, error: error instanceof OutreachError ? error.message : "Не удалось сохранить изменения. Обновите список и повторите попытку." } }
}
export async function syncOutreach(): Promise<OutreachResult> {
  await requireSession()
  try {
    const items = await fetchCatalog()
    const data = await mutateWorkspace(getOutreachRepository(), (workspace) => mergeCatalog(workspace, items, new Date().toISOString()))
    revalidatePath("/outreach")
    return { ok: true, data }
  } catch (error) { console.error("Outreach source sync failed", error); return { ok: false, error: error instanceof OutreachError ? error.message : "Не удалось обновить список из таблицы. Карточки и история сохранены; повторите попытку позже." } }
}
