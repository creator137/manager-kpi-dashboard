"use client"

import * as React from "react"
import {
  ChartNoAxesCombinedIcon,
  ExternalLinkIcon,
  FileSpreadsheetIcon,
  GaugeIcon,
  PresentationIcon,
  TargetIcon,
  UsersRoundIcon,
} from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { PageHeading } from "@/components/dashboard/page-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { summarizeSalesStatistics, salesStatisticsTrend } from "@/lib/dashboard/sales-statistics"
import type { SalesStatistics } from "@/lib/dashboard/types"

const sourceUrl = "https://docs.google.com/spreadsheets/d/17m2AWOh4xYN6SuM7tagdsmqER6U_LHrtH-fjyWUef-0/edit?usp=drivesdk"
const compact = new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 })
const number = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 })
const percent = new Intl.NumberFormat("ru-RU", { style: "percent", maximumFractionDigits: 1 })

const salesChartConfig = {
  salesPlan: { label: "План", color: "var(--chart-2)" },
  salesForecast: { label: "Прогноз", color: "var(--chart-3)" },
  salesFact: { label: "Факт", color: "var(--chart-1)" },
} satisfies ChartConfig

const planFactConfig = {
  plan: { label: "План", color: "var(--chart-2)" },
  fact: { label: "Факт", color: "var(--chart-1)" },
} satisfies ChartConfig

const funnelConfig = {
  value: { label: "Количество", color: "var(--chart-1)" },
} satisfies ChartConfig

const productConfig = {
  svlSold: { label: "Новые SVL", color: "var(--chart-1)" },
  copSold: { label: "ЦОП", color: "var(--chart-2)" },
  svlUpsells: { label: "Допродажи SVL", color: "var(--chart-3)" },
} satisfies ChartConfig

const checkConfig = {
  svlAverageCheck: { label: "Средний чек SVL", color: "var(--chart-1)" },
  copAverageCheck: { label: "Средний чек ЦОП", color: "var(--chart-2)" },
  svlUpsellAverageCheck: { label: "Средний чек допродажи", color: "var(--chart-3)" },
} satisfies ChartConfig

export function SalesStatisticsDashboard({ statistics }: { statistics: SalesStatistics }) {
  const [period, setPeriod] = React.useState("all")
  const summary = React.useMemo(() => summarizeSalesStatistics(statistics, period), [period, statistics])
  const trend = React.useMemo(() => salesStatisticsTrend(statistics), [statistics])
  const periodLabel = period === "all" ? `${statistics.months.length} месяцев` : `${period} ${statistics.year}`

  return (
    <section className="flex flex-col gap-6 px-4 py-5 lg:px-6 lg:py-6">
      <PageHeading
        eyebrow={`Операционная статистика ${statistics.year}`}
        title="Воронка и эффективность продаж"
        description="Динамика продаж, встреч, лидов и продуктовых показателей из блока продаж командной статистики."
        actions={
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
            <PeriodSelect period={period} periods={statistics.months.map((month) => month.period)} onChange={setPeriod} />
            <Button variant="outline" size="sm" nativeButton={false} render={<a href={sourceUrl} target="_blank" rel="noreferrer" />}>
              <FileSpreadsheetIcon data-icon="inline-start" />Источник<ExternalLinkIcon data-icon="inline-end" />
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <MetricCard label="Факт продаж" value={formatCurrency(summary.salesFact)} detail={periodLabel} icon={GaugeIcon} />
        <MetricCard label="Выполнение плана" value={formatPercent(summary.salesCompletion)} detail={`План ${formatCurrency(summary.salesPlan)}`} icon={TargetIcon} progress={summary.salesCompletion} />
        <MetricCard label="Квалифицированные лиды" value={formatNumber(summary.qualifiedLeads)} detail="По заполненным периодам" icon={UsersRoundIcon} />
        <MetricCard label="Проведено демо" value={formatNumber(summary.demoMeetings)} detail="SVL и ЦОП" icon={PresentationIcon} />
      </div>

      <div className="grid grid-cols-1 gap-4 @5xl/main:grid-cols-5">
        <Card className="@5xl/main:col-span-3">
          <CardHeader>
            <CardTitle>Динамика продаж</CardTitle>
            <CardDescription>План, прогноз и фактическая сумма по месяцам</CardDescription>
            <CardAction><Badge variant="outline">₽</Badge></CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer config={salesChartConfig} className="h-72 w-full">
              <AreaChart accessibilityLayer data={trend} margin={{ left: 4, right: 12 }}>
                <defs><linearGradient id="sales-statistics-fact" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-salesFact)" stopOpacity={0.28} /><stop offset="95%" stopColor="var(--color-salesFact)" stopOpacity={0.02} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={shortMonth} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                <Area dataKey="salesPlan" type="monotone" fill="transparent" stroke="var(--color-salesPlan)" strokeDasharray="5 5" strokeWidth={2} isAnimationActive={false} />
                <Area dataKey="salesForecast" type="monotone" fill="transparent" stroke="var(--color-salesForecast)" strokeWidth={1.5} isAnimationActive={false} />
                <Area dataKey="salesFact" type="monotone" fill="url(#sales-statistics-fact)" stroke="var(--color-salesFact)" strokeWidth={2.5} connectNulls={false} isAnimationActive={false} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">Прогноз показан отдельной линией и не заменяет утверждённый план.</CardFooter>
        </Card>

        <Card className="@5xl/main:col-span-2">
          <CardHeader>
            <CardTitle>Воронка новых клиентов</CardTitle>
            <CardDescription>{periodLabel}</CardDescription>
            <CardAction><Badge variant="secondary">Конверсия {formatPercent(conversion(summary.funnel[0].value, summary.funnel[2].value))}</Badge></CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer config={funnelConfig} className="h-72 w-full">
              <BarChart accessibilityLayer data={summary.funnel} layout="vertical" margin={{ left: 8, right: 12 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" tickLine={false} axisLine={false} width={72} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatNumber(Number(value))} />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={3} barSize={20} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">Конверсия пересчитана по исходным количественным значениям.</CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 @5xl/main:grid-cols-5">
        <Card className="@5xl/main:col-span-3">
          <CardHeader><CardTitle>План и факт встреч</CardTitle><CardDescription>{periodLabel}</CardDescription></CardHeader>
          <CardContent>
            <ChartContainer config={planFactConfig} className="h-64 w-full">
              <BarChart accessibilityLayer data={summary.meetings} margin={{ left: 4, right: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatNumber(Number(value))} />} />
                <Bar dataKey="plan" fill="var(--color-plan)" radius={3} isAnimationActive={false} />
                <Bar dataKey="fact" fill="var(--color-fact)" radius={3} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="@5xl/main:col-span-2">
          <CardHeader><CardTitle>Продажи по продуктам</CardTitle><CardDescription>Новые продукты и допродажи по месяцам</CardDescription></CardHeader>
          <CardContent>
            <ChartContainer config={productConfig} className="h-64 w-full">
              <BarChart accessibilityLayer data={trend} margin={{ left: 4, right: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={shortMonth} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatNumber(Number(value))} />} />
                <Bar dataKey="svlSold" stackId="products" fill="var(--color-svlSold)" radius={3} isAnimationActive={false} />
                <Bar dataKey="copSold" stackId="products" fill="var(--color-copSold)" radius={3} isAnimationActive={false} />
                <Bar dataKey="svlUpsells" stackId="products" fill="var(--color-svlUpsells)" radius={3} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Динамика среднего чека</CardTitle>
          <CardDescription>Сравнение SVL, ЦОП и допродаж без заполнения пропусков нулями</CardDescription>
          <CardAction><ChartNoAxesCombinedIcon className="text-muted-foreground" /></CardAction>
        </CardHeader>
        <CardContent>
          <ChartContainer config={checkConfig} className="h-64 w-full">
            <LineChart accessibilityLayer data={trend} margin={{ left: 4, right: 12 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={shortMonth} />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
              <Line dataKey="svlAverageCheck" type="monotone" stroke="var(--color-svlAverageCheck)" strokeWidth={2.5} connectNulls={false} dot={{ r: 3 }} isAnimationActive={false} />
              <Line dataKey="copAverageCheck" type="monotone" stroke="var(--color-copAverageCheck)" strokeWidth={2.5} connectNulls={false} dot={{ r: 3 }} isAnimationActive={false} />
              <Line dataKey="svlUpsellAverageCheck" type="monotone" stroke="var(--color-svlUpsellAverageCheck)" strokeWidth={2} connectNulls={false} dot={{ r: 3 }} isAnimationActive={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Месячная детализация</CardTitle><CardDescription>Основные показатели блока продаж за {statistics.year} год</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Период</TableHead><TableHead className="text-right">План</TableHead><TableHead className="text-right">Факт</TableHead><TableHead className="min-w-44">Выполнение</TableHead><TableHead className="text-right">Лиды</TableHead><TableHead className="text-right">Встречи</TableHead><TableHead className="text-right">Продажи</TableHead></TableRow></TableHeader>
            <TableBody>{trend.map((month) => <MonthRow key={month.period} month={month} />)}</TableBody>
          </Table>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">Пустые исходные значения отображаются как «—» и не подменяются нулями.</CardFooter>
      </Card>
    </section>
  )
}

function PeriodSelect({ period, periods, onChange }: { period: string; periods: string[]; onChange: (value: string) => void }) {
  const options = [{ value: "all", label: "Накопительно" }, ...periods.map((value) => ({ value, label: `${value} 2026` }))]
  return <div className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-medium text-muted-foreground">Период сводки</span><Select value={period} onValueChange={(value) => value && onChange(value)} items={options}><SelectTrigger className="w-full sm:w-48" aria-label="Период сводки"><SelectValue /></SelectTrigger><SelectContent side="bottom" align="start" alignItemWithTrigger={false}><SelectGroup><SelectLabel>Период сводки</SelectLabel>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
}

function MetricCard({ label, value, detail, icon: Icon, progress }: { label: string; value: string; detail: string; icon: React.ComponentType; progress?: number | null }) {
  return <Card className="@container/card"><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl font-semibold tabular-nums @min-[250px]/card:text-3xl">{value}</CardTitle><CardAction><span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon /></span></CardAction></CardHeader><CardFooter className="flex-col items-start gap-2 text-sm">{progress !== undefined && <Progress value={Math.min((progress ?? 0) * 100, 100)} className="w-full" />}<span className="text-muted-foreground">{detail}</span></CardFooter></Card>
}

function MonthRow({ month }: { month: ReturnType<typeof salesStatisticsTrend>[number] }) {
  const meetings = sumKnown([month.demoSvlFact, month.demoCopFact])
  const sales = sumKnown([month.newClientSales, month.activeClientSales, month.inactiveClientSales])
  const status = month.salesCompletion === null ? "Нет данных" : month.salesCompletion >= 1 ? "Выполнен" : month.salesCompletion >= 0.7 ? "В зоне контроля" : "Отстаёт"
  return <TableRow><TableCell className="font-medium">{month.period}</TableCell><TableCell className="whitespace-nowrap text-right tabular-nums">{formatCurrency(month.salesPlan)}</TableCell><TableCell className="whitespace-nowrap text-right tabular-nums">{formatCurrency(month.salesFact)}</TableCell><TableCell><div className="flex items-center gap-2"><Progress value={Math.min((month.salesCompletion ?? 0) * 100, 100)} className="w-16" /><Badge variant={month.salesCompletion !== null && month.salesCompletion < 0.7 ? "destructive" : month.salesCompletion !== null && month.salesCompletion >= 1 ? "default" : "secondary"}>{status}</Badge></div></TableCell><TableCell className="text-right tabular-nums">{formatNumber(month.qualifiedLeads)}</TableCell><TableCell className="text-right tabular-nums">{formatNumber(meetings)}</TableCell><TableCell className="text-right tabular-nums">{formatNumber(sales)}</TableCell></TableRow>
}

function sumKnown(values: Array<number | null>) {
  const known = values.filter((value): value is number => value !== null)
  return known.length ? known.reduce((sum, value) => sum + value, 0) : null
}

function conversion(from: number | null, to: number | null) {
  return from && to !== null ? to / from : null
}

function shortMonth(value: string) {
  return value.slice(0, 3)
}

function formatCurrency(value: number | null) {
  return value === null ? "—" : `${compact.format(value)} ₽`
}

function formatNumber(value: number | null) {
  return value === null ? "—" : number.format(value)
}

function formatPercent(value: number | null) {
  return value === null ? "—" : percent.format(value)
}
