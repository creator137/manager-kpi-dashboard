"use client"

import * as React from "react"
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BarChart3Icon,
  BriefcaseBusinessIcon,
  ChartNoAxesCombinedIcon,
  CircleAlertIcon,
  ExternalLinkIcon,
  FileSpreadsheetIcon,
  GaugeIcon,
  LayoutDashboardIcon,
  MedalIcon,
  TablePropertiesIcon,
  TargetIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { KpiDataTable } from "@/components/dashboard/kpi-data-table"
import { DashboardLoading } from "@/components/dashboard/dashboard-loading"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { completion, kpiLabels, previousPeriod, selectRecords, statusFor, summarize, trend } from "@/lib/dashboard/calculate"
import type { DashboardSnapshot, KpiKey } from "@/lib/dashboard/types"

const sheetUrl = "https://docs.google.com/spreadsheets/d/1UyVjJaVMZlufAZ4uWuQ9GvdCWb2xE-z-sTAm2dQcDX0/edit?usp=drivesdk"
const compact = new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 })
const number = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 })
const percent = new Intl.NumberFormat("ru-RU", { style: "percent", maximumFractionDigits: 1 })
const asOf = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Yekaterinburg",
})

const chartConfig = {
  plan: { label: "План", color: "var(--chart-2)" },
  fact: { label: "Факт", color: "var(--chart-1)" },
} satisfies ChartConfig

const nav = [
  { title: "Обзор", href: "#overview", icon: LayoutDashboardIcon },
  { title: "Динамика", href: "#dynamics", icon: ChartNoAxesCombinedIcon },
  { title: "Менеджеры", href: "#managers", icon: UsersIcon },
  { title: "Детализация", href: "#details", icon: TablePropertiesIcon },
]

export function DashboardShell({ snapshot, scenario }: { snapshot: DashboardSnapshot; scenario?: string }) {
  const [period, setPeriod] = React.useState(snapshot.periods.at(-1) ?? "")
  const [manager, setManager] = React.useState("all")
  const [kpi, setKpi] = React.useState<KpiKey>("revenue")

  const data = React.useMemo(() => {
    if (scenario === "empty") return { ...snapshot, records: [] }
    if (scenario === "stress") {
      const longName = "Анастасия Маслихова-Константинопольская, ведущий менеджер стратегических проектов"
      return {
        ...snapshot,
        managers: snapshot.managers.map((name) => name === "Анастасия Маслихова" ? longName : name),
        records: snapshot.records.map((record) => ({
          ...record,
          manager: record.manager === "Анастасия Маслихова" ? longName : record.manager,
          plan: record.plan === null ? null : record.plan * 1000,
          fact: record.fact === null ? null : record.fact * 1000,
        })),
      }
    }
    return snapshot
  }, [scenario, snapshot])

  const current = selectRecords(data, period, manager, kpi)
  const summary = summarize(current)
  const previous = previousPeriod(data, period)
  const previousSummary = previous ? summarize(selectRecords(data, previous, manager, kpi)) : null
  const change = summary.fact !== null && previousSummary?.fact ? summary.fact / previousSummary.fact - 1 : null
  const ranked = data.managers.map((name) => {
    const record = data.records.find((item) => item.period === period && item.manager === name && item.kpi === kpi)
    return { manager: name, plan: record?.plan ?? null, fact: record?.fact ?? null, completion: completion(record?.plan ?? null, record?.fact ?? null) }
  }).filter((item) => manager === "all" || item.manager === manager).sort((a, b) => (b.completion ?? -1) - (a.completion ?? -1))
  const best = ranked.find((item) => item.fact !== null)
  const trendData = trend(data, manager, kpi)
  const detailRecords = data.records.filter((record) => record.period === period && (manager === "all" || record.manager === manager))

  if (scenario === "loading") return <DashboardLoading />

  if (scenario === "error") {
    return <StateShell><Alert variant="destructive"><CircleAlertIcon /><AlertTitle>Не удалось получить данные</AlertTitle><AlertDescription>Read-only snapshot временно недоступен. Последнее успешное обновление: 25 августа, 13:00.</AlertDescription></Alert></StateShell>
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem", "--header-height": "3.5rem" } as React.CSSProperties}>
      <DashboardSidebar sourceLabel={snapshot.sourceLabel} />
      <SidebarInset className="min-w-0 bg-muted/30">
        <header className="sticky top-0 z-20 flex h-(--header-height) items-center border-b bg-background/95 backdrop-blur">
          <div className="flex w-full items-center gap-3 px-4 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-semibold">Дашборд блока центральных продаж</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">Данные на {asOf.format(new Date(snapshot.asOf))}</p>
            </div>
            <Tooltip>
              <TooltipTrigger render={<Button nativeButton={false} variant="outline" size="sm" render={<a href={sheetUrl} target="_blank" rel="noreferrer" />} />}>
                <FileSpreadsheetIcon data-icon="inline-start" /><span className="hidden sm:inline">Открыть источник</span><ExternalLinkIcon data-icon="inline-end" />
              </TooltipTrigger>
              <TooltipContent>Google Sheets откроется в новой вкладке</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <main className="@container/main flex flex-1 flex-col">
          <section id="overview" className="flex flex-col gap-6 px-4 py-5 lg:px-6 lg:py-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground">Управленческий обзор</p>
                <h2 className="text-2xl font-semibold">Продажи и активность команды</h2>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <FilterSelect label="Период" value={period} onChange={setPeriod} options={data.periods.map((value) => ({ value, label: `${value} 2026` }))} />
                <FilterSelect label="Менеджер" value={manager} onChange={setManager} options={[{ value: "all", label: "Весь отдел" }, ...data.managers.map((value) => ({ value, label: value }))]} />
                <FilterSelect label="KPI" value={kpi} onChange={(value) => setKpi(value as KpiKey)} options={(Object.keys(kpiLabels) as KpiKey[]).map((value) => ({ value, label: kpiLabels[value] }))} />
              </div>
            </div>

            {scenario === "empty" ? <EmptyState /> : (
              <>
                <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                  <MetricCard label="План" value={formatMetric(summary.plan, kpi)} detail={`${period} 2026`} icon={TargetIcon} />
                  <MetricCard label="Факт" value={formatMetric(summary.fact, kpi)} detail={summary.fact === null ? "Нет корректного значения" : "Текущий результат"} icon={GaugeIcon} />
                  <MetricCard label="Выполнение" value={summary.completion === null ? "—" : percent.format(summary.completion)} detail={statusText(summary.completion)} icon={TrendingUpIcon} progress={summary.completion} />
                  <MetricCard label="К прошлому периоду" value={change === null ? "—" : percent.format(change)} detail={previous ? `к ${previous.toLocaleLowerCase("ru")}` : "Нет прошлого периода"} icon={change !== null && change < 0 ? ArrowDownRightIcon : ArrowUpRightIcon} trend={change} />
                </div>

                <div id="dynamics" className="grid scroll-mt-20 grid-cols-1 gap-4 @5xl/main:grid-cols-5">
                  <Card className="@container/card @5xl/main:col-span-3">
                    <CardHeader>
                      <CardTitle>Динамика показателя</CardTitle>
                      <CardDescription>{manager === "all" ? "Результат отдела по месяцам" : manager}</CardDescription>
                      <CardAction><Badge variant="outline">{kpiLabels[kpi]}</Badge></CardAction>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-72 w-full">
                        <AreaChart data={trendData} margin={{ left: 4, right: 12 }}>
                          <defs>
                            <linearGradient id="fact-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-fact)" stopOpacity={0.25} /><stop offset="95%" stopColor="var(--color-fact)" stopOpacity={0.02} /></linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={10} />
                          <YAxis hide domain={[0, "auto"]} />
                          <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatMetric(Number(value), kpi)} />} />
                          <Area dataKey="plan" type="monotone" fill="transparent" stroke="var(--color-plan)" strokeDasharray="5 5" strokeWidth={2} isAnimationActive={false} />
                          <Area dataKey="fact" type="monotone" fill="url(#fact-fill)" stroke="var(--color-fact)" strokeWidth={2.5} connectNulls={false} isAnimationActive={false} />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card className="@container/card @5xl/main:col-span-2">
                    <CardHeader>
                      <CardTitle>План и факт по менеджерам</CardTitle>
                      <CardDescription>{period} 2026</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-72 w-full">
                        <BarChart data={ranked} layout="vertical" margin={{ left: 8, right: 8 }}>
                          <CartesianGrid horizontal={false} />
                          <XAxis type="number" hide />
                          <YAxis dataKey="manager" type="category" tickLine={false} axisLine={false} width={104} tickFormatter={(value) => String(value).split(" ")[0]} />
                          <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatMetric(Number(value), kpi)} />} />
                          <Bar dataKey="plan" fill="var(--color-plan)" radius={3} barSize={9} isAnimationActive={false} />
                          <Bar dataKey="fact" fill="var(--color-fact)" radius={3} barSize={9} isAnimationActive={false} />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card id="managers" className="scroll-mt-20">
                  <CardHeader>
                    <CardTitle>Рейтинг менеджеров</CardTitle>
                    <CardDescription>{best ? `Лидер периода: ${best.manager}` : "Нет данных для рейтинга"}</CardDescription>
                    <CardAction><MedalIcon className="text-muted-foreground" /></CardAction>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Менеджер</TableHead><TableHead className="text-right">План</TableHead><TableHead className="text-right">Факт</TableHead><TableHead className="min-w-52">Выполнение</TableHead><TableHead>Статус</TableHead></TableRow></TableHeader>
                      <TableBody>{ranked.map((item) => <RankingRow key={item.manager} item={item} kpi={kpi} />)}</TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card id="details" className="scroll-mt-20">
                  <CardHeader><CardTitle>Детализация KPI</CardTitle><CardDescription>Плановые и фактические значения из рабочего листа за выбранный период</CardDescription></CardHeader>
                  <CardContent><KpiDataTable key={`${period}-${manager}`} records={detailRecords} /></CardContent>
                  <CardFooter className="text-xs text-muted-foreground">Выполнение пересчитано как Факт / План. Ошибочные формулы исходной книги не используются.</CardFooter>
                </Card>
              </>
            )}
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function DashboardSidebar({ sourceLabel }: { sourceLabel: string }) {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="p-4">
        <SidebarMenu><SidebarMenuItem><SidebarMenuButton size="lg" render={<a href="#overview" />}><span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><BarChart3Icon /></span><span className="grid text-left"><span className="font-semibold">Central Sales</span><span className="text-xs text-sidebar-foreground/65">KPI dashboard</span></span></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup><SidebarGroupLabel>Аналитика</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{nav.map((item, index) => <SidebarMenuItem key={item.title}><SidebarMenuButton isActive={index === 0} tooltip={item.title} render={<a href={item.href} />}><item.icon /><span>{item.title}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup>
        <SidebarGroup><SidebarGroupLabel>Источник</SidebarGroupLabel><SidebarGroupContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton tooltip="Google Sheets" render={<a href={sheetUrl} target="_blank" rel="noreferrer" />}><FileSpreadsheetIcon /><span>Рабочая таблица</span></SidebarMenuButton></SidebarMenuItem><SidebarMenuItem><SidebarMenuButton tooltip="Высоковероятные проекты" render={<a href="#details" />}><BriefcaseBusinessIcon /><span>Проекты</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarGroupContent></SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4"><div className="flex items-center gap-2 text-xs text-sidebar-foreground/65"><span className="size-2 rounded-full bg-chart-1" /><span className="truncate">{sourceLabel}</span></div></SidebarFooter>
    </Sidebar>
  )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <div className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-medium text-muted-foreground">{label}</span><Select value={value} onValueChange={(next) => next !== null && onChange(next)} items={options}><SelectTrigger aria-label={label} className="w-full min-w-0 sm:w-52"><SelectValue /></SelectTrigger><SelectContent side="bottom" align="start" alignItemWithTrigger={false}><SelectGroup><SelectLabel>{label}</SelectLabel>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
}

function MetricCard({ label, value, detail, icon: Icon, progress, trend: delta }: { label: string; value: string; detail: string; icon: React.ComponentType; progress?: number | null; trend?: number | null }) {
  return <Card className="@container/card"><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl font-semibold tabular-nums @min-[250px]/card:text-3xl">{value}</CardTitle><CardAction><span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground"><Icon /></span></CardAction></CardHeader><CardFooter className="flex-col items-start gap-2 text-sm">{progress !== undefined && <Progress value={Math.min((progress ?? 0) * 100, 100)} className="w-full" />}<div className="flex items-center gap-1.5 text-muted-foreground">{delta !== undefined && delta !== null && (delta < 0 ? <ArrowDownRightIcon /> : <ArrowUpRightIcon />)}<span className="line-clamp-1">{detail}</span></div></CardFooter></Card>
}

function RankingRow({ item, kpi }: { item: { manager: string; plan: number | null; fact: number | null; completion: number | null }; kpi: KpiKey }) {
  const status = statusFor(item.completion)
  const label = status === "done" ? "Выполнен" : status === "risk" ? "Риск" : status === "behind" ? "Отстает" : "Нет данных"
  return <TableRow><TableCell><div className="max-w-80 whitespace-normal font-medium">{item.manager}</div></TableCell><TableCell className="text-right tabular-nums">{formatMetric(item.plan, kpi)}</TableCell><TableCell className="text-right tabular-nums">{formatMetric(item.fact, kpi)}</TableCell><TableCell><div className="flex items-center gap-3"><Progress value={Math.min((item.completion ?? 0) * 100, 100)} className="w-28" /><span className="w-14 text-right text-sm tabular-nums">{item.completion === null ? "—" : percent.format(item.completion)}</span></div></TableCell><TableCell><Badge variant={status === "behind" ? "destructive" : status === "done" ? "default" : "secondary"}>{label}</Badge></TableCell></TableRow>
}

function EmptyState() {
  return <Card><CardContent className="py-16"><Empty><EmptyHeader><EmptyMedia variant="icon"><TablePropertiesIcon /></EmptyMedia><EmptyTitle>Нет данных за выбранный период</EmptyTitle><EmptyDescription>Выберите другой период или проверьте заполнение рабочего листа.</EmptyDescription></EmptyHeader></Empty></CardContent></Card>
}

function StateShell({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4"><div className="w-full max-w-xl">{children}</div></main>
}

function formatMetric(value: number | null, kpi: KpiKey) {
  if (value === null) return "—"
  if (kpi === "revenue") return `${compact.format(value)} ₽`
  return number.format(value)
}

function statusText(value: number | null) {
  if (value === null) return "Недостаточно данных"
  if (value >= 1) return "План выполнен"
  if (value >= 0.7) return "Нужен контроль до конца периода"
  return "Требуется внимание"
}
