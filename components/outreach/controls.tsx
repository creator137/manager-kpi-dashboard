"use client"

import { InfoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STAGES, type Stage } from "@/lib/outreach/model"

export function OutreachSelect({ label, value, options, onChange, disabled }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; disabled?: boolean }) {
  return <Select value={value} items={options} onValueChange={(v) => v !== null && onChange(v)} disabled={disabled}><SelectTrigger className="w-full min-w-0" aria-label={label}><SelectValue className="min-w-0 overflow-hidden" /></SelectTrigger><SelectContent alignItemWithTrigger={false}><SelectGroup>{options.map((option) => <SelectItem key={option.value} value={option.value} className="[&>div]:min-w-0 [&>div]:shrink [&>div]:whitespace-normal">{option.label}</SelectItem>)}</SelectGroup></SelectContent></Select>
}

export function StageHelp({ stage }: { stage: Stage }) {
  const info = STAGES.find((s) => s.id === stage)!
  const content = <div className="flex flex-col gap-2"><p className="font-medium">{info.label}</p><p>{info.description}</p><p className="font-medium">{info.trigger}</p><p className="text-muted-foreground">{info.condition}</p></div>
  return <Popover><Tooltip><TooltipTrigger render={<PopoverTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Описание этапа: ${info.label}`} />} />}><InfoIcon /></TooltipTrigger><TooltipContent className="max-w-80">{info.description}<br />{info.condition}</TooltipContent></Tooltip><PopoverContent className="w-80 max-w-[calc(100vw-2rem)]">{content}</PopoverContent></Popover>
}
