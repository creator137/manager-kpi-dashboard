"use client"

import { ExternalLinkIcon, InfoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { projectDescription, projectLinks } from "@/lib/outreach/project-info"
import type { CatalogItem } from "@/lib/outreach/model"

export function ProjectLinks({ catalog, firstOnly = false }: { catalog: CatalogItem; firstOnly?: boolean }) {
  const links = projectLinks(catalog)
  if (!links.length) return <span className="text-xs text-muted-foreground">Ссылка не указана</span>
  return <div className="flex flex-wrap gap-2">{(firstOnly ? links.slice(0, 1) : links).map(({ href, label }) => <Button key={href} variant="outline" size="sm" nativeButton={false} render={<a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label}: ${catalog.name}`} />}><ExternalLinkIcon data-icon="inline-start" />{label}</Button>)}</div>
}

export function ProjectInfo({ catalog, studyDescription }: { catalog: CatalogItem; studyDescription?: string }) {
  const description = studyDescription?.trim() || projectDescription(catalog)
  return <Popover><Tooltip><TooltipTrigger render={<PopoverTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Описание ЖК: ${catalog.name}`} />} />}><InfoIcon /></TooltipTrigger><TooltipContent className="max-w-80 break-words">{description}</TooltipContent></Tooltip><PopoverContent className="max-h-[min(32rem,75dvh)] w-96 max-w-[calc(100vw-2rem)] overflow-y-auto break-words"><PopoverTitle>{catalog.name}</PopoverTitle><PopoverDescription>{description}</PopoverDescription><ProjectLinks catalog={catalog} /></PopoverContent></Popover>
}
