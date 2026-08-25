"use client"

import * as React from "react"
import { ArrowUpDownIcon, BriefcaseBusinessIcon, CircleCheckIcon, ExternalLinkIcon, SearchIcon, WalletCardsIcon } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  FlexRender,
  rowPaginationFeature,
  rowSortingFeature,
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
import type { DashboardSnapshot, Opportunity } from "@/lib/dashboard/types"

const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
const currency = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 })
const compactCurrency = new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 })
const chartConfig = { amount: { label: "Прогноз", color: "var(--chart-1)" } } satisfies ChartConfig

function isRejected(item: Opportunity) {
  return /отказ/i.test(item.note ?? "")
}

function isActive(item: Opportunity) {
  return !item.sold && !isRejected(item)
}

export function OpportunitiesDashboard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const currentPeriod = snapshot.periods.at(-1) ?? "Август"
  const nextPeriod = months[months.indexOf(currentPeriod) + 1]
  const availablePeriods = [...new Set([currentPeriod, nextPeriod, ...snapshot.opportunities.map((item) => item.period)].filter(Boolean))]
  const [period, setPeriod] = React.useState(currentPeriod)
  const [manager, setManager] = React.useState("all")
  const filtered = snapshot.opportunities.filter((item) => item.period === period && (manager === "all" || item.manager === manager))
  const active = filtered.filter(isActive)
  const sold = filtered.filter((item) => item.sold)
  const activeAmount = active.reduce((sum, item) => sum + item.amount, 0)
  const soldAmount = sold.reduce((sum, item) => sum + item.amount, 0)
  const nextItems = snapshot.opportunities.filter((item) => item.period === nextPeriod && isActive(item))
  const nextAmount = nextItems.reduce((sum, item) => sum + item.amount, 0)
  const chartData = snapshot.managers.map((name) => ({
    manager: name,
    amount: filtered.filter((item) => item.manager === name && isActive(item)).reduce((sum, item) => sum + item.amount, 0),
  }))

  return (
    <section className="flex flex-col gap-6 px-4 py-5 lg:px-6 lg:py-6">
      <PageHeading eyebrow="Прогноз продаж" title="Высоковероятные проекты" description="Сумма активных проектов по месяцам, менеджерам и текущему статусу сделки." actions={<div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><FilterSelect label="Месяц" value={period} onChange={setPeriod} options={availablePeriods} /><FilterSelect label="Менеджер" value={manager} onChange={setManager} options={["all", ...snapshot.managers]} allLabel="Весь отдел" /></div>} />

      <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <SummaryCard label={`Прогноз · ${period}`} value={`${compactCurrency.format(activeAmount)} ₽`} detail={`${active.length} активных проектов`} icon={WalletCardsIcon} />
        <SummaryCard label="Продано" value={`${compactCurrency.format(soldAmount)} ₽`} detail={`${sold.length} проектов отмечено проданными`} icon={CircleCheckIcon} />
        <SummaryCard label={`Следующий месяц · ${nextPeriod ?? "—"}`} value={nextItems.length ? `${compactCurrency.format(nextAmount)} ₽` : "—"} detail={nextItems.length ? `${nextItems.length} активных проектов` : "Данные пока не внесены"} icon={BriefcaseBusinessIcon} />
        <SummaryCard label="Средний активный проект" value={active.length ? `${compactCurrency.format(activeAmount / active.length)} ₽` : "—"} detail="По выбранным фильтрам" icon={BriefcaseBusinessIcon} />
      </div>

      <div className="grid grid-cols-1 gap-4 @5xl/main:grid-cols-5">
        <Card className="@5xl/main:col-span-2">
          <CardHeader><CardTitle>Прогноз по менеджерам</CardTitle><CardDescription>{period} 2026 · только активные сделки</CardDescription></CardHeader>
          <CardContent><ChartContainer config={chartConfig} className="h-72 w-full"><BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 12 }}><CartesianGrid horizontal={false} stroke="var(--border)" /><XAxis type="number" hide /><YAxis dataKey="manager" type="category" width={100} tickLine={false} axisLine={false} tickFormatter={(value) => String(value).split(" ")[0]} tick={{ fill: "var(--muted-foreground)" }} /><ChartTooltip content={<ChartTooltipContent formatter={(value) => currency.format(Number(value))} />} /><Bar dataKey="amount" fill="var(--color-amount)" radius={3} isAnimationActive={false} /></BarChart></ChartContainer></CardContent>
        </Card>
        <Card className="@5xl/main:col-span-3">
          <CardHeader><CardTitle>Реестр проектов</CardTitle><CardDescription>Статусы, суммы и ссылки на карточки сделок</CardDescription></CardHeader>
          <CardContent><OpportunitiesTable records={filtered} /></CardContent>
          <CardFooter className="text-xs text-muted-foreground">Прогноз = непроданные проекты без пометки «отказ». Нулевые суммы не увеличивают прогноз.</CardFooter>
        </Card>
      </div>
    </section>
  )
}

function FilterSelect({ label, value, onChange, options, allLabel }: { label: string; value: string; onChange: (value: string) => void; options: string[]; allLabel?: string }) {
  const items = options.map((option) => ({ value: option, label: option === "all" ? (allLabel ?? "Все") : `${option}${label === "Месяц" ? " 2026" : ""}` }))
  return <div className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-medium text-muted-foreground">{label}</span><Select value={value} onValueChange={(next) => next && onChange(next)} items={items}><SelectTrigger className="w-full sm:w-52" aria-label={label}><SelectValue /></SelectTrigger><SelectContent side="bottom" align="start" alignItemWithTrigger={false}><SelectGroup><SelectLabel>{label}</SelectLabel>{items.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
}

function SummaryCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: React.ComponentType }) {
  return <Card><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle><CardAction><span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon /></span></CardAction></CardHeader><CardFooter className="text-sm text-muted-foreground">{detail}</CardFooter></Card>
}

const features = tableFeatures({ rowPaginationFeature, rowSortingFeature, paginatedRowModel: createPaginatedRowModel(), sortedRowModel: createSortedRowModel() })
const columnHelper = createColumnHelper<typeof features, Opportunity>()
const columns = columnHelper.columns([
  columnHelper.accessor("company", { header: ({ column }) => <SortButton label="Компания" onClick={() => column.toggleSorting()} />, cell: ({ row }) => <div className="min-w-36"><div className="font-medium">{row.original.company}</div><div className="text-xs text-muted-foreground">{row.original.project}</div></div> }),
  columnHelper.accessor("manager", { header: "Менеджер", cell: ({ row }) => <span className="whitespace-nowrap">{row.original.manager}</span> }),
  columnHelper.accessor("amount", { header: ({ column }) => <SortButton label="Сумма" onClick={() => column.toggleSorting()} />, cell: ({ row }) => <span className="whitespace-nowrap font-medium tabular-nums">{row.original.amount ? currency.format(row.original.amount) : "—"}</span> }),
  columnHelper.display({ id: "status", header: "Статус", cell: ({ row }) => <ProjectStatus item={row.original} /> }),
  columnHelper.display({ id: "link", header: "Сделка", cell: ({ row }) => row.original.dealUrl ? <Button variant="ghost" size="icon-sm" nativeButton={false} render={<a href={row.original.dealUrl} target="_blank" rel="noreferrer" aria-label={`Открыть сделку ${row.original.project}`} />}><ExternalLinkIcon /></Button> : <span className="text-muted-foreground">—</span> }),
])

function OpportunitiesTable({ records }: { records: Opportunity[] }) {
  const [query, setQuery] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 6 })
  const data = React.useMemo(() => records.filter((item) => `${item.company} ${item.project} ${item.manager} ${item.note ?? ""}`.toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru"))), [query, records])
  const table = useTable({ features, data, columns, state: { sorting, pagination }, onSortingChange: setSorting, onPaginationChange: setPagination, getRowId: (row) => `${row.period}-${row.company}-${row.project}` })
  return <div className="flex flex-col gap-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><InputGroup className="w-full sm:max-w-xs"><InputGroupAddon><SearchIcon /></InputGroupAddon><InputGroupInput value={query} onChange={(event) => { setQuery(event.target.value); setPagination((current) => ({ ...current, pageIndex: 0 })) }} placeholder="Компания, проект, менеджер" aria-label="Поиск проектов" /></InputGroup><span className="text-sm text-muted-foreground">{data.length} проектов</span></div><div className="overflow-hidden rounded-lg border"><div className="overflow-x-auto"><Table><TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id}>{group.headers.map((header) => <TableHead key={header.id}>{header.isPlaceholder ? null : <FlexRender header={header} />}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getAllCells().map((cell) => <TableCell key={cell.id}><FlexRender cell={cell} /></TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length} className="h-56"><Empty><EmptyHeader><EmptyMedia variant="icon"><SearchIcon /></EmptyMedia><EmptyTitle>Проекты не найдены</EmptyTitle><EmptyDescription>Измените месяц, менеджера или поисковый запрос.</EmptyDescription></EmptyHeader></Empty></TableCell></TableRow>}</TableBody></Table></div></div><TablePager table={table} /></div>
}

function ProjectStatus({ item }: { item: Opportunity }) {
  if (item.sold) return <Badge>Продано</Badge>
  if (isRejected(item)) return <Badge variant="destructive">Отказ</Badge>
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
