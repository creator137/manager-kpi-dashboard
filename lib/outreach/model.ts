import { z } from "zod"

export const MANAGERS = ["Алексей Ладьин", "Анастасия Маслихова", "Николай Герасимов", "Дарья Степанова"]
export const STAGES = [
  { id: "study", label: "Изучение ЖК", description: "Анализ проекта на ДОМ.РФ: застройщик, ГК, декларации, сроки. Понимание масштаба для презентации SVL 360.", trigger: "Готовность к касанию", condition: "Менеджер изучил проект, выявил особенности и сформировал предложение под конкретный ЖК." },
  { id: "contacts", label: "Поиск ЛПР", description: "Поиск ЛПР через известные контакты. Если застройщик или ГК знакомы, ищем нужного человека через внутренние связи или общих знакомых.", trigger: "Найден свой выход", condition: "Найден прямой контакт или человек, через которого можно выйти на ЛПР." },
  { id: "external", label: "Закупка контактов", description: "Сбор базы ЛПР через внешние источники: LinkedIn, Контур.Компас, Telegram-каналы и открытые базы.", trigger: "Собрать 3 канала", condition: "Найдено минимум 3 канала связи: почта, мобильный телефон, мессенджер." },
  { id: "call", label: "Звонок", description: "Звонок через центральный номер офиса. Задача — связаться с секретарём и выйти на ЛПР.", trigger: "Дозвон ≥ 1 из 3", condition: "Удалось дозвониться с 1–3 попытки или секретарь соединил с ЛПР." },
  { id: "gift", label: "Подарок + буклет", description: "Физическое касание: отправка курьером брендированного подарка и буклета с AR-кодом на демо SVL 360. Если звонок не дал результата или для закрепления контакта.", trigger: "QR-скан ≥ 2", condition: "QR-код из буклета отсканирован минимум 2 раза. Факт отмечает менеджер; автоматический трекинг пока не подключён." },
  { id: "visit", label: "Визит в офис", description: "Визит в офис продаж, если предыдущие шаги не сработали. Просьба о 15-минутной встрече, демонстрация SVL 360 на планшете.", trigger: "Встреча на 15 мин", condition: "ЛПР вышел на контакт при визите и уделил 15 минут или больше." },
  { id: "scheduled", label: "Встреча назначена", description: "Согласовать с ЛПР дату, время и формат встречи. Зафиксировать назначение отдельным событием.", trigger: "Дата согласована", condition: "Есть подтверждённые дата и время встречи." },
  { id: "held", label: "Встреча проведена", description: "Провести встречу, выяснить задачи клиента и состав проекта. Записать дату и результат встречи.", trigger: "Результат зафиксирован", condition: "Встреча состоялась; её результат внесён в историю ЖК." },
  { id: "proposal", label: "КП отправлено", description: "Обсуждение состава проекта, формирование и отправка интерактивного КП. Зафиксировать дату отправки и ссылку, если она есть.", trigger: "КП открыто ≥ 3 раз", condition: "Открытия КП отмечаются вручную. Отправка учитывается по событию с датой; автоматический трекинг открытий пока не подключён." },
] as const

export type Stage = typeof STAGES[number]["id"]
export const stageSchema = z.enum(["study", "contacts", "external", "call", "gift", "visit", "scheduled", "held", "proposal"])
export const qualificationSchema = z.enum(["review", "cold", "lead", "event", "active"])
export const qualificationLabels = { review: "Проверить источник", cold: "Самостоятельный отбор", lead: "Входящий лид", event: "С мероприятия", active: "Активный клиент" }
export const outcomeLabels = { working: "В работе", paused: "Отложено", rejected: "Отказ" }
export const activityLabels = { meeting_scheduled: "Встреча назначена", meeting_held: "Встреча проведена", proposal_sent: "КП отправлено", note: "Касание / заметка" }
export type ActivityKind = keyof typeof activityLabels

const text = z.string().trim().max(2000)
const link = z.union([z.literal(""), z.url().refine((v) => /^https?:\/\//i.test(v), "Разрешены ссылки http/https")])
export const catalogSchema = z.object({
  sourceKey: z.string().min(1), sourceTag: text, origin: z.enum(["parser", "manual"]),
  name: text.min(1, "Укажите название ЖК"), aliases: z.array(text), city: text, developer: text, group: text,
  housingClass: text, description: text.optional(), priority: text, buildingIds: z.array(z.string()), links: z.array(link), syncedAt: z.string(),
})
export type CatalogItem = z.infer<typeof catalogSchema>
export const workflowSchema = z.object({
  studyDescription: text.optional(),
  manager: z.string().refine((v) => v === "" || MANAGERS.includes(v), "Выберите менеджера из списка"),
  qualification: qualificationSchema, stage: stageSchema, outcome: z.enum(["working", "paused", "rejected"]),
  contactName: text, phone: text, email: z.union([z.literal(""), z.email("Проверьте email")]), office: text,
  indirectName: text, indirectEmail: z.union([z.literal(""), z.email("Проверьте дополнительный email")]),
  nextAction: text, dueDate: z.union([z.literal(""), z.iso.date()]),
})
export type Workflow = z.infer<typeof workflowSchema>
export type OutreachEvent = { id: string; kind: ActivityKind | "created" | "updated" | "stage" | "archived" | "restored" | "qualified"; label: string; note: string; occurredAt: string; recordedAt: string; actor: string; url?: string }
export type OutreachProject = { id: string; version: number; catalog: CatalogItem; workflow: Workflow; events: OutreachEvent[]; createdAt: string; updatedAt: string; archivedAt: string | null }
export type Workspace = { projects: OutreachProject[]; syncedAt: string | null }
export const emptyWorkflow: Workflow = { manager: "", qualification: "review", stage: "study", outcome: "working", contactName: "", phone: "", email: "", office: "", indirectName: "", indirectEmail: "", nextAction: "", dueDate: "" }

const identity = { id: z.string().min(1), version: z.number().int().positive() }
export const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("create"), name: text.min(1, "Укажите название ЖК"), city: text, developer: text, group: text, url: link, qualification: qualificationSchema, manager: workflowSchema.shape.manager }),
  z.object({ type: z.literal("edit"), ...identity, workflow: workflowSchema }),
  z.object({ type: z.literal("stage"), ...identity, stage: stageSchema }),
  z.object({ type: z.literal("activity"), ...identity, kind: z.enum(["meeting_scheduled", "meeting_held", "proposal_sent", "note"]), occurredAt: z.iso.datetime(), note: text.min(1, "Укажите результат или комментарий"), url: link }),
  z.object({ type: z.literal("archive"), ...identity }),
  z.object({ type: z.literal("restore"), ...identity }),
  z.object({ type: z.literal("qualify"), ids: z.array(z.string()).min(1).max(1000) }),
])
export type OutreachCommand = z.infer<typeof commandSchema>
export class OutreachError extends Error {}

export function eligible(project: OutreachProject) { return !project.archivedAt && project.workflow.qualification === "cold" }
export function summarizeOutreach(projects: OutreachProject[], month = "all") {
  const eligibleProjects = projects.filter(eligible)
  const events = eligibleProjects.flatMap((p) => p.events).filter((e) => month === "all" || new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Yekaterinburg", year: "numeric", month: "2-digit" }).format(new Date(e.occurredAt)) === month)
  return {
    total: eligibleProjects.length,
    review: projects.filter((p) => !p.archivedAt && p.workflow.qualification === "review").length,
    scheduled: events.filter((e) => e.kind === "meeting_scheduled").length,
    held: events.filter((e) => e.kind === "meeting_held").length,
    proposals: events.filter((e) => e.kind === "proposal_sent").length,
    stages: STAGES.map((stage) => ({ ...stage, count: eligibleProjects.filter((p) => p.workflow.stage === stage.id && p.workflow.outcome === "working").length })),
  }
}

export function applyCommand(workspace: Workspace, command: OutreachCommand, actor: string, now: string, uuid: () => string): Workspace {
  const event = (kind: OutreachEvent["kind"], label: string, note = "", occurredAt = now, url = ""): OutreachEvent => ({ id: uuid(), kind, label, note, occurredAt, recordedAt: now, actor, url })
  if (command.type === "create") {
    const normalizedName = command.name.trim().toLocaleLowerCase("ru-RU")
    if (workspace.projects.some((p) => !p.archivedAt && [p.catalog.name, ...p.catalog.aliases].some((name) => name.trim().toLocaleLowerCase("ru-RU") === normalizedName) && (!command.city || !p.catalog.city || p.catalog.city.toLocaleLowerCase("ru-RU") === command.city.toLocaleLowerCase("ru-RU")))) throw new OutreachError("ЖК с таким названием уже есть в списке. Откройте существующую карточку.")
    const id = uuid()
    return { ...workspace, projects: [...workspace.projects, {
      id, version: 1, catalog: { sourceKey: `manual:${id}`, sourceTag: "", origin: "manual", name: command.name, aliases: [], city: command.city, developer: command.developer, group: command.group, housingClass: "", priority: "", buildingIds: [], links: command.url ? [command.url] : [], syncedAt: now },
      workflow: { ...emptyWorkflow, manager: command.manager, qualification: command.qualification }, events: [event("created", "ЖК добавлен вручную")], createdAt: now, updatedAt: now, archivedAt: null,
    }] }
  }
  if (command.type === "qualify") {
    return { ...workspace, projects: workspace.projects.map((p) => command.ids.includes(p.id) && !p.archivedAt && p.workflow.qualification === "review" ? { ...p, version: p.version + 1, updatedAt: now, workflow: { ...p.workflow, qualification: "cold" }, events: [...p.events, event("qualified", "Подтверждён самостоятельный отбор")] } : p) }
  }
  const current = workspace.projects.find((p) => p.id === command.id)
  if (!current) throw new OutreachError("ЖК не найден")
  if (current.version !== command.version) throw new OutreachError("Карточка уже изменена другим пользователем. Обновите список и повторите действие.")
  if (current.archivedAt && command.type !== "restore") throw new OutreachError("ЖК находится в архиве")
  const project = { ...current, workflow: { ...current.workflow }, events: [...current.events], version: current.version + 1, updatedAt: now }
  const requireStudy = (nextStage: Stage, description = current.workflow.studyDescription) => {
    if (STAGES.findIndex((s) => s.id === nextStage) > STAGES.findIndex((s) => s.id === current.workflow.stage) && !description?.trim()) throw new OutreachError("Заполните и сохраните описание ЖК по итогам изучения перед переходом на следующий этап.")
  }
  if (command.type === "edit") {
    if (["scheduled", "held", "proposal"].includes(command.workflow.stage) && command.workflow.stage !== current.workflow.stage) throw new OutreachError("Назначение встречи, проведение и отправку КП фиксируйте отдельным событием")
    requireStudy(command.workflow.stage, command.workflow.studyDescription)
    if (current.workflow.stage !== "study" && command.workflow.stage !== "study" && current.workflow.studyDescription?.trim() && !command.workflow.studyDescription?.trim()) throw new OutreachError("Описание изученного ЖК нельзя очистить после перехода к проработке.")
    project.workflow = command.workflow
    if ((current.workflow.studyDescription ?? "") !== (command.workflow.studyDescription ?? "")) project.events.push(event("updated", "Описание ЖК обновлено", command.workflow.studyDescription || "Описание очищено"))
    project.events.push(event("updated", "Карточка обновлена", `Ответственный: ${command.workflow.manager || "не назначен"}. Источник: ${qualificationLabels[command.workflow.qualification]}. Статус: ${outcomeLabels[command.workflow.outcome]}.`))
  }
  if (command.type === "stage") {
    if (["scheduled", "held", "proposal"].includes(command.stage)) throw new OutreachError("Для этого этапа зафиксируйте событие с датой")
    if (!eligible(project)) throw new OutreachError("Сначала подтвердите самостоятельный отбор ЖК")
    requireStudy(command.stage)
    project.workflow.stage = command.stage
    project.events.push(event("stage", `Этап: ${STAGES.find((s) => s.id === command.stage)?.label}`))
  }
  if (command.type === "activity") {
    if (!eligible(project) && command.kind !== "note") throw new OutreachError("Встречи и КП этого раздела учитываются только по самостоятельно отобранным ЖК")
    if (command.kind !== "meeting_scheduled" && new Date(command.occurredAt).getTime() > new Date(now).getTime() + 60_000) throw new OutreachError("Фактическое действие нельзя записать будущей датой")
    const nextStage = { meeting_scheduled: "scheduled", meeting_held: "held", proposal_sent: "proposal", note: project.workflow.stage } as const
    requireStudy(nextStage[command.kind])
    if (STAGES.findIndex((s) => s.id === nextStage[command.kind]) > STAGES.findIndex((s) => s.id === project.workflow.stage)) project.workflow.stage = nextStage[command.kind]
    project.events.push(event(command.kind, activityLabels[command.kind], command.note, command.occurredAt, command.url))
  }
  if (command.type === "archive") { project.archivedAt = now; project.events.push(event("archived", "ЖК удалён из рабочего списка")) }
  if (command.type === "restore") { project.archivedAt = null; project.events.push(event("restored", "ЖК восстановлен")) }
  if (current.workflow.stage === "study" && project.workflow.stage !== "study") project.events.push(event("stage", "Изучение ЖК подтверждено", project.workflow.studyDescription ?? ""))
  return { ...workspace, projects: workspace.projects.map((p) => p.id === project.id ? project : p) }
}
