"use client"

import * as React from "react"
import { ArrowUpDownIcon, Building2Icon, CalendarDaysIcon, ExternalLinkIcon, LinkIcon, SearchIcon, VideoIcon } from "lucide-react"
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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { DashboardSnapshot, Meeting } from "@/lib/dashboard/types"

const monthFormatter = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric", timeZone: "UTC" })
const fullDate = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })

export function MeetingsDashboard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const months = [...new Set(snapshot.meetings.map((item) => item.date.slice(0, 7)))].sort().reverse()
  const [month, setMonth] = React.useState(months[0] ?? "all")
  const [manager, setManager] = React.useState("all")
  const filtered = snapshot.meetings.filter((item) => (month === "all" || item.date.startsWith(month)) && (manager === "all" || item.manager === manager))
  const companies = new Set(filtered.map((item) => item.company)).size
  const withRecording = filtered.filter((item) => item.nasUrl).length
  const latest = filtered.toSorted((a, b) => b.date.localeCompare(a.date))[0]

  return (
    <section className="flex flex-col gap-6 px-4 py-5 lg:px-6 lg:py-6">
      <PageHeading eyebrow="Работа с клиентами" title="Журнал встреч" description="Встречи менеджеров со ссылками на сделки и записи во внутреннем хранилище." actions={<div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><FilterSelect label="Период" value={month} onChange={setMonth} options={["all", ...months]} /><FilterSelect label="Менеджер" value={manager} onChange={setManager} options={["all", ...snapshot.managers]} /></div>} />
      <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <SummaryCard label="Встречи" value={String(filtered.length)} detail="По выбранным фильтрам" icon={CalendarDaysIcon} />
        <SummaryCard label="Компании" value={String(companies)} detail="Уникальных клиентов" icon={Building2Icon} />
        <SummaryCard label="Записи" value={String(withRecording)} detail={filtered.length ? `${Math.round(withRecording / filtered.length * 100)}% встреч со ссылкой` : "Нет встреч"} icon={VideoIcon} />
        <SummaryCard label="Последняя встреча" value={latest ? fullDate.format(new Date(`${latest.date}T00:00:00Z`)) : "—"} detail={latest ? `${latest.company} · ${latest.manager}` : "Нет данных"} icon={CalendarDaysIcon} />
      </div>
      <Card>
        <CardHeader><CardTitle>Все встречи</CardTitle><CardDescription>Сортировка, поиск и быстрый переход к материалам встречи</CardDescription></CardHeader>
        <CardContent><MeetingsTable records={filtered} /></CardContent>
        <CardFooter className="text-xs text-muted-foreground">Ссылки на NAS могут требовать подключения к корпоративной сети или VPN.</CardFooter>
      </Card>
    </section>
  )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  const labelFor = (option: string) => option === "all" ? (label === "Менеджер" ? "Все менеджеры" : "Все периоды") : label === "Период" ? monthFormatter.format(new Date(`${option}-01T00:00:00Z`)) : option
  const items = options.map((option) => ({ value: option, label: labelFor(option) }))
  return <div className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-medium text-muted-foreground">{label}</span><Select value={value} onValueChange={(next) => next && onChange(next)} items={items}><SelectTrigger className="w-full sm:w-52" aria-label={label}><SelectValue /></SelectTrigger><SelectContent side="bottom" align="start" alignItemWithTrigger={false}><SelectGroup><SelectLabel>{label}</SelectLabel>{items.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
}

function SummaryCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: React.ComponentType }) {
  return <Card><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle><CardAction><span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon /></span></CardAction></CardHeader><CardFooter className="text-sm text-muted-foreground">{detail}</CardFooter></Card>
}

const features = tableFeatures({ rowPaginationFeature, rowSortingFeature, paginatedRowModel: createPaginatedRowModel(), sortedRowModel: createSortedRowModel() })
const columnHelper = createColumnHelper<typeof features, Meeting>()
const columns = columnHelper.columns([
  columnHelper.accessor("date", { header: ({ column }) => <SortButton label="Дата" onClick={() => column.toggleSorting()} />, cell: ({ row }) => <div className="whitespace-nowrap"><div className="font-medium">{row.original.dateLabel}</div><div className="text-xs text-muted-foreground">{row.original.time || "Время не указано"}</div></div> }),
  columnHelper.accessor("company", { header: ({ column }) => <SortButton label="Компания" onClick={() => column.toggleSorting()} />, cell: ({ row }) => <div className="min-w-44"><div className="font-medium">{row.original.company}</div><div className="text-xs text-muted-foreground">{row.original.project}</div></div> }),
  columnHelper.accessor("manager", { header: "Менеджер", cell: ({ row }) => <span className="whitespace-nowrap">{row.original.manager}</span> }),
  columnHelper.accessor("status", { header: "Статус", cell: ({ row }) => row.original.status ? <Badge variant="secondary">{row.original.status}</Badge> : <Badge variant="outline">Не указан</Badge> }),
  columnHelper.display({ id: "links", header: "Материалы", cell: ({ row }) => <div className="flex items-center gap-1">{row.original.dealUrls.map((url, index) => <Tooltip key={url}><TooltipTrigger render={<Button variant="ghost" size="icon-sm" nativeButton={false} render={<a href={url} target="_blank" rel="noreferrer" aria-label={`Открыть сделку ${index + 1}`} />} />}><LinkIcon /></TooltipTrigger><TooltipContent>Сделка {index + 1}</TooltipContent></Tooltip>)}{row.original.nasUrl && <Tooltip><TooltipTrigger render={<Button variant="outline" size="sm" nativeButton={false} render={<a href={row.original.nasUrl} target="_blank" rel="noreferrer" />} />}><VideoIcon data-icon="inline-start" />Запись<ExternalLinkIcon data-icon="inline-end" /></TooltipTrigger><TooltipContent>Открыть запись встречи</TooltipContent></Tooltip>}{!row.original.dealUrls.length && !row.original.nasUrl && <span className="text-muted-foreground">—</span>}</div> }),
])

function MeetingsTable({ records }: { records: Meeting[] }) {
  const [query, setQuery] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "date", desc: true }])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 8 })
  const data = React.useMemo(() => records.filter((item) => `${item.company} ${item.project} ${item.manager} ${item.status ?? ""}`.toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru"))), [query, records])
  const table = useTable({ features, data, columns, state: { sorting, pagination }, onSortingChange: setSorting, onPaginationChange: setPagination, getRowId: (row) => `${row.date}-${row.time}-${row.company}` })
  return <div className="flex flex-col gap-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><InputGroup className="w-full sm:max-w-sm"><InputGroupAddon><SearchIcon /></InputGroupAddon><InputGroupInput value={query} onChange={(event) => { setQuery(event.target.value); setPagination((current) => ({ ...current, pageIndex: 0 })) }} placeholder="Компания, проект, менеджер" aria-label="Поиск встреч" /></InputGroup><span className="text-sm text-muted-foreground">{data.length} встреч</span></div><div className="overflow-hidden rounded-lg border"><div className="overflow-x-auto"><Table><TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id}>{group.headers.map((header) => <TableHead key={header.id}>{header.isPlaceholder ? null : <FlexRender header={header} />}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getAllCells().map((cell) => <TableCell key={cell.id}><FlexRender cell={cell} /></TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length} className="h-64"><Empty><EmptyHeader><EmptyMedia variant="icon"><VideoIcon /></EmptyMedia><EmptyTitle>Встречи не найдены</EmptyTitle><EmptyDescription>Измените период, менеджера или поисковый запрос.</EmptyDescription></EmptyHeader></Empty></TableCell></TableRow>}</TableBody></Table></div></div><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Страница {table.state.pagination.pageIndex + 1} из {Math.max(table.getPageCount(), 1)}</span><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Назад</Button><Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Далее</Button></div></div></div>
}

function SortButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button variant="ghost" size="sm" className="-ml-3" onClick={onClick}>{label}<ArrowUpDownIcon data-icon="inline-end" /></Button>
}
