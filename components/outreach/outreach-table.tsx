"use client"

import * as React from "react"
import { createColumnHelper, createPaginatedRowModel, createSortedRowModel, FlexRender, rowPaginationFeature, rowSortingFeature, sortFn_alphanumeric, sortFn_text, tableFeatures, useTable, type SortingState } from "@tanstack/react-table"
import { ArrowUpDownIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { STAGES, qualificationLabels, type OutreachProject } from "@/lib/outreach/model"
import { StageHelp } from "./controls"

const features = tableFeatures({ rowPaginationFeature, rowSortingFeature, paginatedRowModel: createPaginatedRowModel(), sortedRowModel: createSortedRowModel(), sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text } })
const helper = createColumnHelper<typeof features, OutreachProject>()

export function OutreachTable({ records, onOpen }: { records: OutreachProject[]; onOpen: (id: string) => void }) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const columns = React.useMemo(() => helper.columns([
    helper.accessor((p) => p.catalog.name, { id: "name", header: ({ column }) => <Button variant="ghost" size="sm" onClick={() => column.toggleSorting()}>ЖК / застройщик<ArrowUpDownIcon data-icon="inline-end" /></Button>, cell: ({ row }) => <div className="min-w-56 max-w-80 whitespace-normal break-words"><button className="text-left font-medium hover:underline focus-visible:outline-ring" onClick={() => onOpen(row.original.id)}>{row.original.catalog.name}</button><div className="mt-1 text-xs text-muted-foreground">{[row.original.catalog.city, row.original.catalog.group || row.original.catalog.developer].filter(Boolean).join(" · ") || "Сведения не заполнены"}</div></div> }),
    helper.accessor((p) => p.workflow.manager, { id: "manager", header: "Ответственный", cell: ({ getValue }) => <span className="block max-w-44 whitespace-normal">{getValue() || "Не назначен"}</span> }),
    helper.accessor((p) => p.workflow.qualification, { id: "qualification", header: "Источник", cell: ({ getValue }) => <Badge variant={getValue() === "review" ? "secondary" : "outline"}>{qualificationLabels[getValue()]}</Badge> }),
    helper.accessor((p) => p.workflow.stage, { id: "stage", header: "Этап / условие", cell: ({ row }) => { const stage = STAGES.find((s) => s.id === row.original.workflow.stage)!; return <div className="flex min-w-48 items-center gap-1"><div><Tooltip><TooltipTrigger render={<button className="text-left font-medium" onClick={() => onOpen(row.original.id)} />}>{stage.label}</TooltipTrigger><TooltipContent className="max-w-80">{stage.description}<br />{stage.condition}</TooltipContent></Tooltip><div className="text-xs text-muted-foreground">{stage.trigger}</div></div><StageHelp stage={stage.id} /></div> } }),
    helper.accessor((p) => p.workflow.dueDate, { id: "dueDate", header: ({ column }) => <Button variant="ghost" size="sm" onClick={() => column.toggleSorting()}>Следующее действие<ArrowUpDownIcon data-icon="inline-end" /></Button>, cell: ({ row }) => <div className="min-w-40 max-w-64 whitespace-normal"><div>{row.original.workflow.nextAction || "Не запланировано"}</div>{row.original.workflow.dueDate && <time className="mt-1 block text-xs text-muted-foreground">{new Intl.DateTimeFormat("ru-RU").format(new Date(`${row.original.workflow.dueDate}T12:00:00`))}</time>}</div> }),
    helper.display({ id: "edit", header: "", cell: ({ row }) => <Tooltip><TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Открыть ${row.original.catalog.name}`} onClick={() => onOpen(row.original.id)} />}><PencilIcon /></TooltipTrigger><TooltipContent>Открыть карточку</TooltipContent></Tooltip> }),
  ]), [onOpen])
  const table = useTable({ features, data: records, columns, state: { sorting, pagination }, onSortingChange: setSorting, onPaginationChange: setPagination, getRowId: (row) => row.id })
  return <div className="flex min-w-0 flex-col gap-4"><div className="overflow-hidden rounded-lg border"><div className="overflow-x-auto"><Table><TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id}>{group.headers.map((header) => <TableHead key={header.id}><FlexRender header={header} /></TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getAllCells().map((cell) => <TableCell key={cell.id}><FlexRender cell={cell} /></TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={6}><Empty><EmptyHeader><EmptyTitle>ЖК не найдены</EmptyTitle><EmptyDescription>Измените фильтры или добавьте новый объект.</EmptyDescription></EmptyHeader></Empty></TableCell></TableRow>}</TableBody></Table></div></div><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-muted-foreground">{records.length} объектов · {pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)}</span><div className="flex gap-2"><Button variant="outline" size="icon-sm" aria-label="Предыдущая страница" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}><ChevronLeftIcon /></Button><Button variant="outline" size="icon-sm" aria-label="Следующая страница" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}><ChevronRightIcon /></Button></div></div></div>
}
