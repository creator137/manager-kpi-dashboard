"use client"

import * as React from "react"
import { ArrowUpDownIcon, BriefcaseBusinessIcon, CircleCheckIcon, ExternalLinkIcon, SearchIcon, TrophyIcon, WalletCardsIcon } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  FlexRender,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type SortingState,
} from "@tanstack/react-table"

import { PageHeading } from "@/components/dashboard/page-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { isActiveOpportunity, isRejectedOpportunity, isTenderOpportunity, matchesOpportunityStatus, summarizeOpportunities, type OpportunityStatus } from "@/lib/dashboard/opportunities"
import type { DashboardSnapshot, Opportunity } from "@/lib/dashboard/types"

const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
const currency = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 })
const compactCurrency = new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 })
const chartConfig = { amount: { label: "Прогноз", color: "var(--chart-1)" } } satisfies ChartConfig

const statusOptions: Array<{ value: OpportunityStatus; label: string }> = [
  { value: "all", label: "Все статусы" },
  { value: "active", label: "В работе" },
  { value: "tender", label: "Тендеры" },
  { value: "sold", label: "Продано" },
  { value: "rejected", label: "Отказ" },
]

export function OpportunitiesDashboard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const periodsWithProjects = new Set(snapshot.opportunities.map((item) => item.period))
  const availablePeriods = months.filter((month) => periodsWithProjects.has(month))
  const defaultPeriod = availablePeriods.findLast((month) => snapshot.opportunities.some((item) => item.period === month && item.amount !== null))
    ?? availablePeriods.at(-1)
    ?? snapshot.periods.at(-1)
    ?? "Август"
  const [period, setPeriod] = React.useState(defaultPeriod)
  const [manager, setManager] = React.useState("all")
  const [status, setStatus] = React.useState<OpportunityStatus>("all")
  const periodItems = snapshot.opportunities.filter((item) => item.period === period && (manager === "all" || item.manager === manager))
  const summary = summarizeOpportunities(periodItems)
  const filtered = periodItems.filter((item) => matchesOpportunityStatus(item, status))
  const chartData = snapshot.managers.map((name) => ({
    manager: name,
    amount: periodItems
      .filter((item) => item.manager === name && isActiveOpportunity(item) && item.amount !== null)
      .reduce((sum, item) => sum + (item.amount ?? 0), 0),
  }))

  return (
    <section className="flex flex-col gap-6 px-4 py-5 lg:px-6 lg:py-6">
      <PageHeading eyebrow="Прогноз продаж" title="Высоковероятные проекты" description="Общая сумма проектов, тендеры и продажи по флажку из Google Sheets." actions={<div className="grid grid-cols-1 gap-2 sm:grid-cols-3"><FilterSelect label="Месяц" value={period} onChange={setPeriod} options={availablePeriods.map((value) => ({ value, label: `${value} 2026` }))} /><FilterSelect label="Менеджер" value={manager} onChange={setManager} options={[{ value: "all", label: "Весь отдел" }, ...snapshot.managers.map((value) => ({ value, label: value }))]} /><FilterSelect label="Статус" value={status} onChange={(value) => setStatus(value as OpportunityStatus)} options={statusOptions} /></div>} />

      <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <SummaryCard label={`Всего без отказов · ${period}`} summary={summary.total} icon={WalletCardsIcon} />
        <SummaryCard label="Из них тендеры" summary={summary.tender} icon={TrophyIcon} />
        <SummaryCard label="Продано по флажку" summary={summary.sold} icon={CircleCheckIcon} />
        <SummaryCard label="В работе" summary={summary.active} icon={BriefcaseBusinessIcon} />
      </div>

      <div className="grid grid-cols-1 gap-4 @5xl/main:grid-cols-5">
        <Card className="@5xl/main:col-span-2">
          <CardHeader><CardTitle>В работе по менеджерам</CardTitle><CardDescription>{period} 2026 · без проданных проектов и отказов</CardDescription></CardHeader>
          <CardContent><ChartContainer config={chartConfig} className="h-72 w-full"><BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 12 }}><CartesianGrid horizontal={false} stroke="var(--border)" /><XAxis type="number" hide /><YAxis dataKey="manager" type="category" width={100} tickLine={false} axisLine={false} tickFormatter={(value) => String(value).split(" ")[0]} tick={{ fill: "var(--muted-foreground)" }} /><ChartTooltip content={<ChartTooltipContent formatter={(value) => currency.format(Number(value))} />} /><Bar dataKey="amount" fill="var(--color-amount)" radius={3} isAnimationActive={false} /></BarChart></ChartContainer></CardContent>
        </Card>
        <Card className="@5xl/main:col-span-3">
          <CardHeader><CardTitle>Реестр проектов</CardTitle><CardDescription>Статусы, суммы и ссылки на карточки сделок</CardDescription></CardHeader>
          <CardContent><OpportunitiesTable records={filtered} /></CardContent>
          <CardFooter className="text-xs text-muted-foreground">Статус «Продано» читается из флажка в Google Sheets. Пустая сумма отображается как «—» и не подменяется нулём.</CardFooter>
        </Card>
      </div>
    </section>
  )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <div className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-medium text-muted-foreground">{label}</span><Select value={value} onValueChange={(next) => next && onChange(next)} items={options}><SelectTrigger className="w-full sm:w-48" aria-label={label}><SelectValue /></SelectTrigger><SelectContent side="bottom" align="start" alignItemWithTrigger={false}><SelectGroup><SelectLabel>{label}</SelectLabel>{options.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
}

function SummaryCard({ label, summary, icon: Icon }: { label: string; summary: { amount: number | null; count: number; missingAmountCount: number }; icon: React.ComponentType }) {
  const missing = summary.missingAmountCount ? ` · без суммы: ${summary.missingAmountCount}` : ""
  return <Card><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl font-semibold tabular-nums">{summary.amount === null ? "—" : `${compactCurrency.format(summary.amount)} ₽`}</CardTitle><CardAction><span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon /></span></CardAction></CardHeader><CardFooter className="text-sm text-muted-foreground">{projectCountLabel(summary.count)}{missing}</CardFooter></Card>
}

function projectCountLabel(count: number) {
  const mod100 = count % 100
  const mod10 = count % 10
  const noun = mod100 >= 11 && mod100 <= 14 ? "проектов" : mod10 === 1 ? "проект" : mod10 >= 2 && mod10 <= 4 ? "проекта" : "проектов"
  return `${count} ${noun}`
}

const features = tableFeatures({ rowPaginationFeature, rowSortingFeature, paginatedRowModel: createPaginatedRowModel(), sortedRowModel: createSortedRowModel(), sortFns: { alphanumeric: sortFn_alphanumeric, datetime: sortFn_datetime, text: sortFn_text } })
const columnHelper = createColumnHelper<typeof features, Opportunity>()
const columns = columnHelper.columns([
  columnHelper.accessor("company", { header: ({ column }) => <SortButton label="Компания" onClick={() => column.toggleSorting()} />, cell: ({ row }) => <div className="min-w-36"><div className="font-medium">{row.original.company}</div><div className="text-xs text-muted-foreground">{row.original.project}</div></div> }),
  columnHelper.accessor("product", { header: "Продукт", cell: ({ row }) => row.original.product ? <Badge variant="secondary">{row.original.product}</Badge> : <span className="text-muted-foreground">—</span> }),
  columnHelper.accessor("manager", { header: "Менеджер", cell: ({ row }) => <span className="whitespace-nowrap">{row.original.manager}</span> }),
  columnHelper.accessor("amount", { header: ({ column }) => <SortButton label="Сумма" onClick={() => column.toggleSorting()} />, cell: ({ row }) => <span className="whitespace-nowrap font-medium tabular-nums">{row.original.amount === null ? "—" : currency.format(row.original.amount)}</span> }),
  columnHelper.display({ id: "status", header: "Статус", cell: ({ row }) => <ProjectStatus item={row.original} /> }),
  columnHelper.display({ id: "link", header: "Сделка", cell: ({ row }) => row.original.dealUrl ? <Button variant="ghost" size="icon-sm" nativeButton={false} render={<a href={row.original.dealUrl} target="_blank" rel="noreferrer" aria-label={`Открыть сделку ${row.original.project}`} />}><ExternalLinkIcon /></Button> : <span className="text-muted-foreground">—</span> }),
])

function OpportunitiesTable({ records }: { records: Opportunity[] }) {
  const [query, setQuery] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 6 })
  const data = React.useMemo(() => records.filter((item) => `${item.company} ${item.project} ${item.product ?? ""} ${item.manager} ${item.note ?? ""}`.toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru"))), [query, records])
  const table = useTable({ features, data, columns, state: { sorting, pagination }, onSortingChange: setSorting, onPaginationChange: setPagination, getRowId: (row) => `${row.period}-${row.company}-${row.project}` })
  return <div className="flex flex-col gap-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><InputGroup className="w-full sm:max-w-xs"><InputGroupAddon><SearchIcon /></InputGroupAddon><InputGroupInput value={query} onChange={(event) => { setQuery(event.target.value); setPagination((current) => ({ ...current, pageIndex: 0 })) }} placeholder="Компания, проект, менеджер" aria-label="Поиск проектов" /></InputGroup><span className="text-sm text-muted-foreground">{data.length} проектов</span></div><div className="overflow-hidden rounded-lg border"><div className="overflow-x-auto"><Table><TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id}>{group.headers.map((header) => <TableHead key={header.id}>{header.isPlaceholder ? null : <FlexRender header={header} />}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getAllCells().map((cell) => <TableCell key={cell.id}><FlexRender cell={cell} /></TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length} className="h-56"><Empty><EmptyHeader><EmptyMedia variant="icon"><SearchIcon /></EmptyMedia><EmptyTitle>Проекты не найдены</EmptyTitle><EmptyDescription>Измените месяц, менеджера или поисковый запрос.</EmptyDescription></EmptyHeader></Empty></TableCell></TableRow>}</TableBody></Table></div></div><TablePager table={table} /></div>
}

function ProjectStatus({ item }: { item: Opportunity }) {
  if (item.sold) return <Badge>Продано</Badge>
  if (isRejectedOpportunity(item)) return <Badge variant="destructive">Отказ</Badge>
  if (isTenderOpportunity(item)) return <Badge variant="secondary">Тендер</Badge>
  if (/обновить/i.test(item.note ?? "")) return <Badge variant="secondary">Обновить</Badge>
  return <Badge variant="outline">В работе</Badge>
}

function SortButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button variant="ghost" size="sm" className="-ml-3" onClick={onClick}>{label}<ArrowUpDownIcon data-icon="inline-end" /></Button>
}

type PageableTable = {
  state: { pagination: { pageIndex: number } }
  getPageCount: () => number
  previousPage: () => void
  nextPage: () => void
  getCanPreviousPage: () => boolean
  getCanNextPage: () => boolean
}

function TablePager({ table }: { table: PageableTable }) {
  return <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Страница {table.state.pagination.pageIndex + 1} из {Math.max(table.getPageCount(), 1)}</span><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Назад</Button><Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Далее</Button></div></div>
}
