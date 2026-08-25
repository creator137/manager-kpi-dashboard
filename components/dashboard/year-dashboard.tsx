"use client"

import * as React from "react"
import { ChartNoAxesCombinedIcon, MedalIcon, TargetIcon, TrophyIcon, WalletCardsIcon } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { PageHeading } from "@/components/dashboard/page-heading"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { completion, kpiLabels, statusFor } from "@/lib/dashboard/calculate"
import type { DashboardSnapshot, KpiKey } from "@/lib/dashboard/types"

const currencyCompact = new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 })
const number = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 })
const percent = new Intl.NumberFormat("ru-RU", { style: "percent", maximumFractionDigits: 1 })
const chartConfig = { plan: { label: "План", color: "var(--chart-2)" }, fact: { label: "Факт", color: "var(--chart-1)" } } satisfies ChartConfig

export function YearDashboard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const [kpi, setKpi] = React.useState<KpiKey>("revenue")
  const ranking = snapshot.managers.map((manager) => {
    const records = snapshot.records.filter((item) => item.manager === manager && item.kpi === kpi)
    const planValues = records.map((item) => item.plan).filter((value): value is number => value !== null)
    const factValues = records.map((item) => item.fact).filter((value): value is number => value !== null)
    const plan = planValues.length ? planValues.reduce((sum, value) => sum + value, 0) : null
    const fact = factValues.length ? factValues.reduce((sum, value) => sum + value, 0) : null
    return { manager, plan, fact, completion: completion(plan, fact), months: factValues.length }
  }).toSorted((a, b) => (b.fact ?? -1) - (a.fact ?? -1))
  const teamPlan = ranking.some((item) => item.plan !== null) ? ranking.reduce((sum, item) => sum + (item.plan ?? 0), 0) : null
  const teamFact = ranking.some((item) => item.fact !== null) ? ranking.reduce((sum, item) => sum + (item.fact ?? 0), 0) : null
  const teamCompletion = completion(teamPlan, teamFact)
  const leader = ranking.find((item) => item.fact !== null)

  return (
    <section className="flex flex-col gap-6 px-4 py-5 lg:px-6 lg:py-6">
      <PageHeading eyebrow="Результаты 2026" title="Показатели менеджеров за год" description={`Накопительный итог по доступным данным с января по ${snapshot.periods.at(-1)?.toLocaleLowerCase("ru") ?? "текущий месяц"}.`} actions={<div className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-medium text-muted-foreground">Показатель</span><Select value={kpi} onValueChange={(value) => value && setKpi(value as KpiKey)} items={(Object.keys(kpiLabels) as KpiKey[]).map((value) => ({ value, label: kpiLabels[value] }))}><SelectTrigger className="w-full sm:w-56" aria-label="Показатель"><SelectValue /></SelectTrigger><SelectContent side="bottom" align="start" alignItemWithTrigger={false}><SelectGroup><SelectLabel>Показатель</SelectLabel>{(Object.keys(kpiLabels) as KpiKey[]).map((value) => <SelectItem key={value} value={value}>{kpiLabels[value]}</SelectItem>)}</SelectGroup></SelectContent></Select></div>} />
      <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <SummaryCard label="План отдела YTD" value={formatMetric(teamPlan, kpi)} detail={`${snapshot.periods.length} месяцев в расчёте`} icon={TargetIcon} />
        <SummaryCard label="Факт отдела YTD" value={formatMetric(teamFact, kpi)} detail={kpiLabels[kpi]} icon={WalletCardsIcon} />
        <SummaryCard label="Выполнение YTD" value={teamCompletion === null ? "—" : percent.format(teamCompletion)} detail={teamCompletion !== null && teamCompletion >= 1 ? "План выполнен" : "Отношение факта к плану"} icon={ChartNoAxesCombinedIcon} />
        <SummaryCard label="Лидер года" value={leader?.manager ?? "—"} detail={leader ? formatMetric(leader.fact, kpi) : "Нет данных"} icon={TrophyIcon} />
      </div>
      <div className="grid grid-cols-1 gap-4 @5xl/main:grid-cols-5">
        <Card className="@5xl/main:col-span-2"><CardHeader><CardTitle>План и факт YTD</CardTitle><CardDescription>{kpiLabels[kpi]} · сумма доступных месяцев</CardDescription></CardHeader><CardContent><ChartContainer config={chartConfig} className="h-72 w-full"><BarChart data={ranking} layout="vertical" margin={{ left: 6, right: 10 }}><CartesianGrid horizontal={false} stroke="var(--border)" /><XAxis type="number" hide /><YAxis dataKey="manager" type="category" width={100} tickLine={false} axisLine={false} tickFormatter={(value) => String(value).split(" ")[0]} tick={{ fill: "var(--muted-foreground)" }} /><ChartTooltip content={<ChartTooltipContent formatter={(value) => formatMetric(Number(value), kpi)} />} /><Bar dataKey="plan" fill="var(--color-plan)" radius={3} barSize={10} isAnimationActive={false} /><Bar dataKey="fact" fill="var(--color-fact)" radius={3} barSize={10} isAnimationActive={false} /></BarChart></ChartContainer></CardContent></Card>
        <Card className="@5xl/main:col-span-3"><CardHeader><CardTitle>Рейтинг менеджеров</CardTitle><CardDescription>{leader ? `Лидер по факту: ${leader.manager}` : "Нет данных"}</CardDescription><CardAction><MedalIcon className="text-muted-foreground" /></CardAction></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Менеджер</TableHead><TableHead className="text-right">План</TableHead><TableHead className="text-right">Факт</TableHead><TableHead className="min-w-48">Выполнение</TableHead><TableHead>Статус</TableHead></TableRow></TableHeader><TableBody>{ranking.map((item, index) => <YearRow key={item.manager} item={item} index={index} kpi={kpi} />)}</TableBody></Table></CardContent><CardFooter className="text-xs text-muted-foreground">Рейтинг строится по накопленному факту. Пустые и ошибочные значения не подменяются нулями.</CardFooter></Card>
      </div>
    </section>
  )
}

function YearRow({ item, index, kpi }: { item: { manager: string; plan: number | null; fact: number | null; completion: number | null; months: number }; index: number; kpi: KpiKey }) {
  const status = statusFor(item.completion)
  const label = status === "done" ? "Выполнен" : status === "risk" ? "Риск" : status === "behind" ? "Отстаёт" : "Нет данных"
  return <TableRow><TableCell className="text-muted-foreground">{index + 1}</TableCell><TableCell><div className="min-w-36"><div className="font-medium">{item.manager}</div><div className="text-xs text-muted-foreground">{item.months} мес. с фактом</div></div></TableCell><TableCell className="text-right tabular-nums">{formatMetric(item.plan, kpi)}</TableCell><TableCell className="text-right font-medium tabular-nums">{formatMetric(item.fact, kpi)}</TableCell><TableCell><div className="flex items-center gap-2"><Progress value={Math.min((item.completion ?? 0) * 100, 100)} className="w-16" /><span className="w-12 text-right text-sm tabular-nums">{item.completion === null ? "—" : percent.format(item.completion)}</span></div></TableCell><TableCell><Badge variant={status === "behind" ? "destructive" : status === "done" ? "default" : "secondary"}>{label}</Badge></TableCell></TableRow>
}

function SummaryCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: React.ComponentType }) {
  return <Card><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle><CardAction><span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon /></span></CardAction></CardHeader><CardFooter className="text-sm text-muted-foreground">{detail}</CardFooter></Card>
}

function formatMetric(value: number | null, kpi: KpiKey) {
  if (value === null) return "—"
  return kpi === "revenue" ? `${currencyCompact.format(value)} ₽` : number.format(value)
}
