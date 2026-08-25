"use client"

import * as React from "react"
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
import { ArrowUpDownIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { completion, kpiLabels, statusFor } from "@/lib/dashboard/calculate"
import type { DashboardRecord } from "@/lib/dashboard/types"

const features = tableFeatures({
  rowPaginationFeature,
  rowSortingFeature,
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
})

const columnHelper = createColumnHelper<typeof features, DashboardRecord>()

const number = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 })
const percent = new Intl.NumberFormat("ru-RU", { style: "percent", maximumFractionDigits: 1 })

const statusLabels = {
  done: "План выполнен",
  risk: "В зоне риска",
  behind: "Отставание",
  "no-data": "Нет данных",
}

const columns = columnHelper.columns([
  columnHelper.accessor("manager", {
    header: ({ column }) => <SortButton label="Менеджер" onClick={() => column.toggleSorting()} />,
    cell: ({ row }) => <span className="block max-w-64 font-medium whitespace-normal">{row.original.manager}</span>,
  }),
  columnHelper.accessor("kpi", {
    header: "Показатель",
    cell: ({ row }) => <span className="text-muted-foreground">{kpiLabels[row.original.kpi]}</span>,
  }),
  columnHelper.accessor("plan", {
    header: ({ column }) => <SortButton label="План" onClick={() => column.toggleSorting()} />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.plan === null ? "—" : number.format(row.original.plan)}</span>,
  }),
  columnHelper.accessor("fact", {
    header: ({ column }) => <SortButton label="Факт" onClick={() => column.toggleSorting()} />,
    cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.fact === null ? "—" : number.format(row.original.fact)}</span>,
  }),
  columnHelper.display({
    id: "completion",
    header: "Выполнение",
    cell: ({ row }) => {
      const value = completion(row.original.plan, row.original.fact)
      return (
        <div className="flex min-w-32 items-center gap-3">
          <Progress value={Math.min((value ?? 0) * 100, 100)} className="w-20" />
          <span className="w-14 text-right text-sm tabular-nums">{value === null ? "—" : percent.format(value)}</span>
        </div>
      )
    },
  }),
  columnHelper.display({
    id: "status",
    header: "Статус",
    cell: ({ row }) => {
      const status = statusFor(completion(row.original.plan, row.original.fact))
      return <Badge variant={status === "behind" ? "destructive" : status === "done" ? "default" : "secondary"}>{statusLabels[status]}</Badge>
    },
  }),
])

function SortButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="-ml-3">
      {label}
      <ArrowUpDownIcon data-icon="inline-end" />
    </Button>
  )
}

export function KpiDataTable({ records }: { records: DashboardRecord[] }) {
  const [query, setQuery] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 8 })
  const data = React.useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ru")
    if (!normalized) return records
    return records.filter((record) =>
      `${record.manager} ${kpiLabels[record.kpi]}`.toLocaleLowerCase("ru").includes(normalized),
    )
  }, [query, records])

  const table = useTable({
    features,
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getRowId: (row) => `${row.period}-${row.manager}-${row.kpi}`,
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <InputGroup className="w-full sm:max-w-xs">
          <InputGroupAddon><SearchIcon /></InputGroupAddon>
          <InputGroupInput value={query} onChange={(event) => { setQuery(event.target.value); setPagination((current) => ({ ...current, pageIndex: 0 })) }} placeholder="Поиск по менеджеру или KPI" aria-label="Поиск по таблице" />
        </InputGroup>
        <span className="text-sm text-muted-foreground">{data.length} показателей</span>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => <TableHead key={header.id}>{header.isPlaceholder ? null : <FlexRender header={header} />}</TableHead>)}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => <TableCell key={cell.id}><FlexRender cell={cell} /></TableCell>)}
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64">
                    <Empty>
                      <EmptyHeader><EmptyMedia variant="icon"><SearchIcon /></EmptyMedia><EmptyTitle>Ничего не найдено</EmptyTitle><EmptyDescription>Измените запрос или фильтры.</EmptyDescription></EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Страница {table.state.pagination.pageIndex + 1} из {Math.max(table.getPageCount(), 1)}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Предыдущая страница"><ChevronLeftIcon /></Button>
          <Button variant="outline" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Следующая страница"><ChevronRightIcon /></Button>
        </div>
      </div>
    </div>
  )
}
