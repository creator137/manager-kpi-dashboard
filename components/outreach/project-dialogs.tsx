"use client"

import * as React from "react"
import { ArrowRightIcon, CalendarCheckIcon, MessageSquarePlusIcon, PlusIcon, SendIcon, Trash2Icon, Undo2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { OutreachSelect, StageHelp } from "./controls"
import { ProjectLinks } from "./project-info"
import { projectDescription } from "@/lib/outreach/project-info"
import { activityLabels, MANAGERS, outcomeLabels, qualificationLabels, STAGES, type ActivityKind, type OutreachCommand, type OutreachProject, type Workflow } from "@/lib/outreach/model"

export type RunCommand = (command: OutreachCommand) => Promise<boolean>
const options = (record: Record<string, string>) => Object.entries(record).map(([value, label]) => ({ value, label }))
const managerOptions = [{ value: "", label: "Не назначен" }, ...MANAGERS.map((value) => ({ value, label: value }))]
const dateTime = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Yekaterinburg" })
function localDateTime() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0,16) }

function FormInput({ label, name, value, required, type = "text" }: { label: string; name: string; value?: string; required?: boolean; type?: string }) {
  return <Field><FieldLabel htmlFor={name}>{label}</FieldLabel><Input id={name} name={name} defaultValue={value} type={type} required={required} maxLength={2000} /></Field>
}

export function CreateProjectDialog({ open, onOpenChange, run, pending }: { open: boolean; onOpenChange: (open: boolean) => void; run: RunCommand; pending: boolean }) {
  const [manager, setManager] = React.useState("")
  const [qualification, setQualification] = React.useState<Workflow["qualification"]>("cold")
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const val = (key: string) => String(data.get(key) ?? "")
    if (await run({ type: "create", name: val("name"), city: val("city"), developer: val("developer"), group: val("group"), url: val("url"), manager, qualification })) onOpenChange(false)
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Новый ЖК</DialogTitle><DialogDescription>Добавление в список первичной проработки</DialogDescription></DialogHeader><form onSubmit={submit} className="flex flex-col gap-5"><FieldGroup><FormInput label="Название ЖК" name="name" required /><div className="grid gap-4 sm:grid-cols-2"><FormInput label="Город" name="city" /><FormInput label="Группа компаний" name="group" /></div><FormInput label="Застройщик" name="developer" /><FormInput label="Ссылка на объект" name="url" type="url" /><Field><FieldLabel>Ответственный</FieldLabel><OutreachSelect label="Ответственный нового ЖК" value={manager} options={managerOptions} onChange={setManager} /></Field><Field><FieldLabel>Источник</FieldLabel><OutreachSelect label="Источник нового ЖК" value={qualification} options={options(qualificationLabels)} onChange={(v) => setQualification(v as Workflow["qualification"])} /></Field></FieldGroup><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button><Button type="submit" disabled={pending}><PlusIcon data-icon="inline-start" />Добавить ЖК</Button></DialogFooter></form></DialogContent></Dialog>
}

function ActivityDialog({ project, kind, onClose, run, pending }: { project: OutreachProject; kind: ActivityKind | null; onClose: () => void; run: RunCommand; pending: boolean }) {
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!kind) return
    const data = new FormData(e.currentTarget)
    const occurredAt = new Date(String(data.get("occurredAt")))
    if (Number.isNaN(occurredAt.getTime())) return
    if (await run({ type: "activity", id: project.id, version: project.version, kind, occurredAt: occurredAt.toISOString(), note: String(data.get("note") ?? ""), url: String(data.get("url") ?? "") })) onClose()
  }
  return <Dialog open={kind !== null} onOpenChange={(v) => !v && onClose()}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{kind ? activityLabels[kind] : "Событие"}</DialogTitle><DialogDescription>{project.catalog.name}</DialogDescription></DialogHeader><form onSubmit={submit} className="flex flex-col gap-5"><FieldGroup><FormInput label={kind === "meeting_scheduled" ? "Дата и время встречи" : "Дата и время действия"} name="occurredAt" type="datetime-local" value={localDateTime()} required /><Field><FieldLabel htmlFor="note">{kind === "meeting_scheduled" ? "Договорённости и формат встречи" : "Результат / комментарий"}</FieldLabel><Textarea id="note" name="note" required maxLength={2000} rows={4} /></Field><FormInput label="Ссылка на КП или встречу" name="url" type="url" /></FieldGroup><DialogFooter><Button type="button" variant="outline" onClick={onClose}>Отмена</Button><Button type="submit" disabled={pending}>Зафиксировать</Button></DialogFooter></form></DialogContent></Dialog>
}

export function ProjectSheet({ project, onClose, run, pending, disabled }: { project: OutreachProject; onClose: () => void; run: RunCommand; pending: boolean; disabled: boolean }) {
  const [workflow, setWorkflow] = React.useState(project.workflow)
  const [activity, setActivity] = React.useState<ActivityKind | null>(null)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const locked = pending || disabled || Boolean(project.archivedAt)
  const canRecord = project.workflow.qualification === "cold" && !project.archivedAt
  const studied = Boolean(project.workflow.studyDescription?.trim())
  const stage = STAGES.find((s) => s.id === workflow.stage)!
  const update = (key: keyof Workflow, value: string) => { setSaved(false); setWorkflow((previous) => ({ ...previous, [key]: value })) }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const formWorkflow = { ...workflow }
    for (const key of ["studyDescription", "contactName", "phone", "email", "office", "indirectName", "indirectEmail", "nextAction", "dueDate"] as const) formWorkflow[key] = String(data.get(key) ?? "")
    setSaved(await run({ type: "edit", id: project.id, version: project.version, workflow: formWorkflow }))
  }
  function selectStage(value: string) {
    const eventKind = { scheduled: "meeting_scheduled", held: "meeting_held", proposal: "proposal_sent" } as const
    if (value in eventKind && value !== project.workflow.stage) { setActivity(eventKind[value as keyof typeof eventKind]); return }
    update("stage", value)
  }
  async function nextStep() {
    const next = STAGES[STAGES.findIndex((s) => s.id === project.workflow.stage) + 1]
    if (!next) return
    if (["scheduled", "held", "proposal"].includes(next.id)) { selectStage(next.id); return }
    await run({ type: "stage", id: project.id, version: project.version, stage: next.id })
  }
  return <Sheet open onOpenChange={(open) => !open && onClose()}><SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-2xl gap-0 overflow-y-auto"><SheetHeader className="border-b pr-12"><div className="flex flex-wrap gap-2"><Badge variant="outline">{project.catalog.origin === "parser" ? "Из парсера" : "Добавлен вручную"}</Badge><Badge variant={project.archivedAt ? "secondary" : "outline"}>{project.archivedAt ? "Архив" : qualificationLabels[project.workflow.qualification]}</Badge></div><SheetTitle className="mt-2 leading-snug">{project.catalog.name}</SheetTitle><SheetDescription>{[project.catalog.city, project.catalog.group || project.catalog.developer].filter(Boolean).join(" · ")}</SheetDescription></SheetHeader>
    <Tabs defaultValue="card" className="p-4"><TabsList className="w-full"><TabsTrigger value="card">Карточка</TabsTrigger><TabsTrigger value="history">История ({project.events.length})</TabsTrigger><TabsTrigger value="source">Объект</TabsTrigger></TabsList>
      <TabsContent value="card" className="pt-4"><form id="project-form" onSubmit={save} className="flex flex-col gap-6"><FieldGroup><div className="grid gap-4 sm:grid-cols-2"><Field><FieldLabel>Ответственный</FieldLabel><OutreachSelect label="Ответственный" value={workflow.manager} options={managerOptions} onChange={(v) => update("manager", v)} disabled={locked} /></Field><Field><FieldLabel>Источник обращения</FieldLabel><OutreachSelect label="Источник обращения" value={workflow.qualification} options={options(qualificationLabels)} onChange={(v) => update("qualification", v)} disabled={locked} /></Field></div>
      <Field><FieldLabel htmlFor="studyDescription">Описание ЖК / итоги изучения</FieldLabel><Textarea id="studyDescription" name="studyDescription" defaultValue={workflow.studyDescription ?? ""} rows={5} maxLength={2000} disabled={locked} placeholder="Особенности ЖК, масштаб, сроки и возможности для предложения" /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field><FieldLabel>Этап проработки</FieldLabel><div className="flex items-center gap-1"><OutreachSelect label="Этап проработки" value={workflow.stage} options={STAGES.map((s) => ({ value: s.id, label: s.label }))} onChange={selectStage} disabled={locked} /><StageHelp stage={workflow.stage} /></div></Field><Field><FieldLabel>Состояние</FieldLabel><OutreachSelect label="Состояние проработки" value={workflow.outcome} options={options(outcomeLabels)} onChange={(v) => update("outcome", v)} disabled={locked} /></Field></div>
      <p className="text-sm text-muted-foreground">{stage.description}</p><Separator /><p className="font-medium">Основной ЛПР</p><FormInput label="ФИО и должность" name="contactName" value={workflow.contactName} /><div className="grid gap-4 sm:grid-cols-2"><FormInput label="Телефон" name="phone" value={workflow.phone} type="tel" /><FormInput label="Email" name="email" value={workflow.email} type="email" /></div><FormInput label="Адрес офиса" name="office" value={workflow.office} /><Separator /><p className="font-medium">Дополнительный контакт</p><FormInput label="ФИО и должность дополнительного контакта" name="indirectName" value={workflow.indirectName} /><FormInput label="Email дополнительного контакта" name="indirectEmail" value={workflow.indirectEmail} type="email" /><Separator /><FormInput label="Следующее действие" name="nextAction" value={workflow.nextAction} /><FormInput label="Срок следующего действия" name="dueDate" value={workflow.dueDate} type="date" /></FieldGroup><Button type="submit" disabled={locked}>{saved ? "Сохранено" : "Сохранить карточку"}</Button></form>
      {!studied && <p className="mt-3 text-sm text-muted-foreground">Изучение не подтверждено: описание ЖК обязательно для перехода дальше.</p>}
      {project.workflow.stage !== "proposal" && <Button className="mt-3 w-full" variant="outline" onClick={nextStep} disabled={!canRecord || !studied || locked}>Следующий этап<ArrowRightIcon data-icon="inline-end" /></Button>}
      <Separator className="my-6" /><div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><Button variant="outline" onClick={() => setActivity("meeting_scheduled")} disabled={!canRecord || !studied || locked}><CalendarCheckIcon data-icon="inline-start" />Назначить встречу</Button><Button variant="outline" onClick={() => setActivity("meeting_held")} disabled={!canRecord || !studied || locked}><CalendarCheckIcon data-icon="inline-start" />Встреча проведена</Button><Button variant="outline" onClick={() => setActivity("proposal_sent")} disabled={!canRecord || !studied || locked}><SendIcon data-icon="inline-start" />КП отправлено</Button><Button variant="outline" onClick={() => setActivity("note")} disabled={locked}><MessageSquarePlusIcon data-icon="inline-start" />Добавить касание</Button></div>
      {!canRecord && !project.archivedAt && <p className="mt-3 text-sm text-muted-foreground">Для учёта встреч и КП сохраните источник «Самостоятельный отбор».</p>}</TabsContent>
      <TabsContent value="history" className="pt-4"><div className="flex flex-col divide-y">{[...project.events].reverse().map((event) => <div key={event.id} className="flex flex-col gap-2 py-4"><div className="flex flex-wrap items-start justify-between gap-2"><p className="font-medium">{event.label}</p><time className="text-xs text-muted-foreground">{dateTime.format(new Date(event.occurredAt))}</time></div>{event.note && <p className="whitespace-pre-wrap break-words text-muted-foreground">{event.note}</p>}{event.url && <a className="break-all underline" href={event.url} target="_blank" rel="noreferrer">Открыть ссылку</a>}<span className="text-xs text-muted-foreground">Записано: {dateTime.format(new Date(event.recordedAt))} · {event.actor === "Импорт" ? "Импорт" : `Общий вход: ${event.actor}`}</span></div>)}</div></TabsContent>
      <TabsContent value="source" className="pt-4"><p className="mb-4 text-sm text-muted-foreground">{projectDescription(project.catalog)}</p><dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">{[["Город", project.catalog.city], ["Застройщик", project.catalog.developer], ["Группа компаний", project.catalog.group], ["Класс жилья", project.catalog.housingClass], ["Приоритет парсера", project.catalog.priority], ["ID корпусов", project.catalog.buildingIds.join(", ")]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words">{value || "—"}</dd></div>)}</dl>{project.catalog.aliases.length > 1 && <Alert className="mt-4"><AlertDescription>Объединены названия одного объекта: {project.catalog.aliases.join("; ")}</AlertDescription></Alert>}<div className="mt-5"><ProjectLinks catalog={project.catalog} /></div></TabsContent>
    </Tabs><SheetFooter className="border-t"><Button variant="outline" disabled={pending || disabled} onClick={() => project.archivedAt ? run({ type: "restore", id: project.id, version: project.version }) : setConfirmDelete(true)}>{project.archivedAt ? <Undo2Icon data-icon="inline-start" /> : <Trash2Icon data-icon="inline-start" />}{project.archivedAt ? "Восстановить ЖК" : "Удалить из списка"}</Button></SheetFooter>
    <ActivityDialog project={project} kind={activity} onClose={() => setActivity(null)} run={run} pending={pending} />
    <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}><DialogContent><DialogHeader><DialogTitle>Удалить ЖК из списка?</DialogTitle><DialogDescription>{project.catalog.name}. История останется в архиве; объект можно восстановить. Обновление парсера не вернёт его в рабочий список автоматически.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setConfirmDelete(false)}>Отмена</Button><Button variant="destructive" disabled={pending} onClick={async () => { if (await run({ type: "archive", id: project.id, version: project.version })) { setConfirmDelete(false); onClose() } }}>Удалить</Button></DialogFooter></DialogContent></Dialog>
  </SheetContent></Sheet>
}
