"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Building2Icon, CalendarCheckIcon, CheckIcon, CircleAlertIcon, PlusIcon, RefreshCwIcon, SearchIcon, SendIcon } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { toast } from "sonner"
import { executeOutreach, loadOutreach, syncOutreach, type OutreachResult } from "@/app/outreach/actions"
import { PageHeading } from "@/components/dashboard/page-heading"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { STAGES, MANAGERS, qualificationLabels, summarizeOutreach, type OutreachCommand, type Workspace } from "@/lib/outreach/model"
import { OutreachSelect, StageHelp } from "./controls"
import { CreateProjectDialog, ProjectSheet } from "./project-dialogs"
import { OutreachTable } from "./outreach-table"

const config = { count: { label: "ЖК в работе", color: "var(--chart-1)" } } satisfies ChartConfig
const all = { value: "all", label: "Все" }

export function OutreachDashboard({ initial, mode, error }: { initial: Workspace; mode: "shared" | "local" | "unavailable"; error: string }) {
  const [data, setData] = React.useState(initial)
  const [pending, setPending] = React.useState(false)
  const [failure, setFailure] = React.useState("")
  const [create, setCreate] = React.useState(false)
  const [qualify, setQualify] = React.useState(false)
  const [confirmed, setConfirmed] = React.useState(false)
  const params = useSearchParams()
  const query = params.get("q") ?? ""
  const manager = params.get("manager") ?? "all"
  const stage = params.get("stage") ?? "all"
  const origin = params.get("origin") ?? "all"
  const archive = params.get("archive") ?? "working"
  const month = params.get("month") ?? "all"
  const view = params.get("view") ?? "list"
  const selected = data.projects.find((p) => p.id === params.get("project"))
  const disabled = Boolean(error) || mode === "unavailable"
  const updateQuery = React.useCallback((key: string, value: string) => {
    const url = new URL(window.location.href)
    if (!value || value === "all") url.searchParams.delete(key); else url.searchParams.set(key, value)
    window.history.replaceState(null, "", url)
  }, [])
  const openProject = React.useCallback((id: string) => updateQuery("project", id), [updateQuery])
  const filtered = data.projects.filter((p) => (archive === "archived" ? Boolean(p.archivedAt) : !p.archivedAt)
    && (manager === "all" || p.workflow.manager === manager || manager === "unassigned" && !p.workflow.manager)
    && (stage === "all" || p.workflow.stage === stage)
    && (origin === "all" || p.workflow.qualification === origin)
    && `${p.catalog.name} ${p.catalog.aliases.join(" ")} ${p.catalog.city} ${p.catalog.group} ${p.catalog.developer} ${p.workflow.contactName}`.toLocaleLowerCase("ru-RU").includes(query.toLocaleLowerCase("ru-RU")))
  const summary = summarizeOutreach(filtered, month)
  const reviewIds = filtered.filter((p) => !p.archivedAt && p.workflow.qualification === "review").map((p) => p.id)
  const months = [...new Set(data.projects.flatMap((p) => p.events.filter((e) => ["meeting_scheduled", "meeting_held", "proposal_sent"].includes(e.kind)).map((e) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Yekaterinburg", year: "numeric", month: "2-digit" }).format(new Date(e.occurredAt)))))].sort().reverse()
  async function request(action: () => Promise<OutreachResult>, message: string) {
    if (pending || disabled) return false
    setPending(true); setFailure("")
    try {
      const result = await action()
      if (!result.ok) { setFailure(result.error); toast.error(result.error); return false }
      setData(result.data); toast.success(message); return true
    } catch { setFailure("Соединение прервано. Обновите список перед повторным сохранением."); return false }
    finally { setPending(false) }
  }
  const run = (command: OutreachCommand) => request(() => executeOutreach(command), "Изменения сохранены")

  return <section className="flex min-w-0 flex-col gap-6 px-4 py-5 lg:px-6 lg:py-6"><PageHeading eyebrow="Развитие продаж" title="Проработка ЖК" description="Самостоятельный отбор → контакт с ЛПР → встреча → коммерческое предложение" actions={<div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={pending || disabled} onClick={() => request(loadOutreach, "Список обновлён")} aria-label="Обновить список"><RefreshCwIcon /></Button><Button variant="outline" size="sm" disabled={pending || disabled} onClick={() => request(syncOutreach, "Сведения парсера обновлены")}><RefreshCwIcon data-icon="inline-start" />Из таблицы</Button><Button size="sm" disabled={disabled || pending} onClick={() => setCreate(true)}><PlusIcon data-icon="inline-start" />Добавить ЖК</Button></div>} />
    {(error || failure) && <Alert variant="destructive"><CircleAlertIcon /><AlertTitle>{error ? "Сохранение недоступно" : "Не удалось выполнить действие"}</AlertTitle><AlertDescription>{error || failure}</AlertDescription></Alert>}
    <div className="flex flex-wrap items-center justify-between gap-3"><Badge variant="outline">{mode === "shared" ? "Общая база команды" : mode === "local" ? "Локальная разработка" : "Просмотр каталога"}</Badge><span className="text-xs text-muted-foreground">Отдельно от лидов, мероприятий и активных клиентов</span></div>
    <div className="grid grid-cols-2 gap-3 @5xl/main:grid-cols-4">{[
      { label: "ЖК в проработке", value: summary.total, icon: Building2Icon }, { label: "Встреч назначено", value: summary.scheduled, icon: CalendarCheckIcon }, { label: "Встреч проведено", value: summary.held, icon: CheckIcon }, { label: "КП отправлено", value: summary.proposals, icon: SendIcon },
    ].map((metric) => <Card key={metric.label}><CardHeader><CardDescription>{metric.label}</CardDescription><CardTitle className="text-2xl tabular-nums">{metric.value}</CardTitle><CardAction><metric.icon className="text-primary" /></CardAction></CardHeader></Card>)}</div>
    {reviewIds.length > 0 && archive !== "archived" && <Alert><CircleAlertIcon /><AlertTitle>Проверить источник: {reviewIds.length} ЖК</AlertTitle><AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"><p>Подтвердите, что объекты отобраны самостоятельно и не поступали через лиды или мероприятия.</p><Button variant="outline" size="sm" onClick={() => { setConfirmed(false); setQualify(true) }} disabled={disabled || pending}>Подтвердить отбор</Button></AlertDescription></Alert>}
    <div className="flex flex-col gap-3"><InputGroup className="w-full sm:max-w-lg"><InputGroupAddon><SearchIcon /></InputGroupAddon><InputGroupInput aria-label="Поиск ЖК" placeholder="ЖК, застройщик, группа компаний, город" value={query} onChange={(e) => updateQuery("q", e.target.value)} /></InputGroup><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Field><FieldLabel>Менеджер</FieldLabel><OutreachSelect label="Фильтр менеджера" value={manager} options={[{ ...all, label: "Все менеджеры" }, { value: "unassigned", label: "Не назначен" }, ...MANAGERS.map((v) => ({ value: v, label: v }))]} onChange={(v) => updateQuery("manager", v)} /></Field>
      <Field><FieldLabel>Этап</FieldLabel><OutreachSelect label="Фильтр этапа" value={stage} options={[{ ...all, label: "Все этапы" }, ...STAGES.map((s) => ({ value: s.id, label: s.label }))]} onChange={(v) => updateQuery("stage", v)} /></Field>
      <Field><FieldLabel>Источник</FieldLabel><OutreachSelect label="Фильтр источника" value={origin} options={[{ ...all, label: "Все источники" }, ...Object.entries(qualificationLabels).map(([value, label]) => ({ value, label }))]} onChange={(v) => updateQuery("origin", v)} /></Field>
      <Field><FieldLabel>Список</FieldLabel><OutreachSelect label="Рабочий список или архив" value={archive} options={[{ value: "working", label: "Рабочий список" }, { value: "archived", label: "Архив" }]} onChange={(v) => updateQuery("archive", v)} /></Field>
      <Field><FieldLabel>Период встреч и КП</FieldLabel><OutreachSelect label="Период встреч и КП" value={month} options={[{ ...all, label: "За всё время" }, ...months.map((value) => ({ value, label: new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(new Date(`${value}-01T12:00:00`)) }))]} onChange={(v) => updateQuery("month", v)} /></Field>
    </div></div>
    <Tabs className="min-w-0" value={view} onValueChange={(v) => updateQuery("view", v)}><TabsList variant="line"><TabsTrigger value="list">Список ЖК</TabsTrigger><TabsTrigger value="funnel">Воронка и менеджеры</TabsTrigger></TabsList><TabsContent value="list" className="min-w-0 pt-4"><OutreachTable key={`${query}-${manager}-${stage}-${origin}-${archive}`} records={filtered} onOpen={openProject} /></TabsContent><TabsContent value="funnel" className="min-w-0 pt-5"><div className="grid grid-cols-1 gap-8 xl:grid-cols-2"><div className="min-w-0"><h3 className="mb-4 font-medium">Текущие этапы проработки</h3><ChartContainer config={config} className="h-96 w-full"><BarChart accessibilityLayer data={summary.stages} layout="vertical" margin={{ left: 0, right: 15 }}><CartesianGrid horizontal={false} /><XAxis type="number" allowDecimals={false} /><YAxis dataKey="label" type="category" width={150} axisLine={false} tickLine={false} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="count" fill="var(--color-count)" radius={3} barSize={18} isAnimationActive={false} /></BarChart></ChartContainer><div className="mt-4 flex flex-wrap gap-2">{STAGES.map((s) => <div key={s.id} className="flex items-center gap-1"><span className="text-xs text-muted-foreground">{s.label}</span><StageHelp stage={s.id} /></div>)}</div></div><div className="min-w-0"><h3 className="mb-4 font-medium">Работа менеджеров</h3><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Менеджер</TableHead><TableHead>ЖК</TableHead><TableHead>Назначено</TableHead><TableHead>Проведено</TableHead><TableHead>КП</TableHead></TableRow></TableHeader><TableBody>{["", ...MANAGERS].map((name) => { const metrics = summarizeOutreach(filtered.filter((p) => p.workflow.manager === name), month); return <TableRow key={name}><TableCell className="whitespace-normal">{name || "Не назначен"}</TableCell><TableCell>{metrics.total}</TableCell><TableCell>{metrics.scheduled}</TableCell><TableCell>{metrics.held}</TableCell><TableCell>{metrics.proposals}</TableCell></TableRow> })}</TableBody></Table></div></div></div></TabsContent></Tabs>
    <CreateProjectDialog key={String(create)} open={create} onOpenChange={setCreate} run={run} pending={pending} />
    {selected && <ProjectSheet key={`${selected.id}-${selected.version}`} project={selected} onClose={() => updateQuery("project", "")} run={run} pending={pending} disabled={disabled} />}
    <Dialog open={qualify} onOpenChange={setQualify}><DialogContent><DialogHeader><DialogTitle>Подтвердить отбор {reviewIds.length} ЖК?</DialogTitle><DialogDescription>Выбранные текущими фильтрами объекты начнут учитываться в отдельной воронке. Для исключений источник можно изменить в карточке.</DialogDescription></DialogHeader><Field orientation="horizontal"><Checkbox id="confirm-cold" checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} /><FieldLabel htmlFor="confirm-cold">Эти ЖК отобраны самостоятельно, без входящих лидов и мероприятий</FieldLabel></Field><DialogFooter><Button variant="outline" onClick={() => setQualify(false)}>Отмена</Button><Button disabled={!confirmed || pending} onClick={async () => { if (await run({ type: "qualify", ids: reviewIds })) setQualify(false) }}>Подтвердить</Button></DialogFooter></DialogContent></Dialog>
  </section>
}
