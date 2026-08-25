"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  BriefcaseBusinessIcon,
  ExternalLinkIcon,
  FileSpreadsheetIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon,
  UserRoundCheckIcon,
  VideoIcon,
} from "lucide-react"

import { logout } from "@/app/login/actions"
import { Button } from "@/components/ui/button"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const sheetUrl = "https://docs.google.com/spreadsheets/d/1UyVjJaVMZlufAZ4uWuQ9GvdCWb2xE-z-sTAm2dQcDX0/edit?usp=drivesdk"
const asOfFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Yekaterinburg",
})

const nav = [
  { title: "Обзор", href: "/", icon: LayoutDashboardIcon },
  { title: "Проекты", href: "/projects", icon: BriefcaseBusinessIcon },
  { title: "Журнал встреч", href: "/meetings", icon: VideoIcon },
  { title: "Итоги года", href: "/managers", icon: UserRoundCheckIcon },
]

const pageTitles: Record<string, string> = {
  "/": "Дашборд блока центральных продаж",
  "/projects": "Высоковероятные проекты",
  "/meetings": "Журнал встреч",
  "/managers": "Показатели менеджеров за год",
}

export function DashboardFrame({ children, sourceLabel, asOf }: { children: React.ReactNode; sourceLabel: string; asOf: string }) {
  const pathname = usePathname()

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem", "--header-height": "3.5rem" } as React.CSSProperties}>
      <DashboardSidebar sourceLabel={sourceLabel} pathname={pathname} />
      <SidebarInset className="min-w-0 bg-muted/30 dark:bg-background">
        <header className="sticky top-0 z-20 flex h-(--header-height) items-center border-b bg-background/95 backdrop-blur">
          <div className="flex w-full items-center gap-3 px-4 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <div className="min-w-0 flex-1">
              <BrandLogo className="sm:hidden" width={135} height={30} />
              <h1 className="hidden truncate text-sm font-semibold sm:block">{pageTitles[pathname] ?? "Virtual Land KPI Dashboard"}</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">Данные на {asOfFormatter.format(new Date(asOf))}</p>
            </div>
            <ThemeToggle />
            <Tooltip>
              <TooltipTrigger render={<Button nativeButton={false} variant="outline" size="sm" render={<a href={sheetUrl} target="_blank" rel="noreferrer" />} />}>
                <FileSpreadsheetIcon data-icon="inline-start" /><span className="hidden sm:inline">Открыть источник</span><ExternalLinkIcon data-icon="inline-end" />
              </TooltipTrigger>
              <TooltipContent>Google Sheets откроется в новой вкладке</TooltipContent>
            </Tooltip>
          </div>
        </header>
        <main className="@container/main flex flex-1 flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function DashboardSidebar({ sourceLabel, pathname }: { sourceLabel: string; pathname: string }) {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border px-5 py-5">
        <SidebarMenu><SidebarMenuItem><SidebarMenuButton size="lg" className="h-auto px-0 hover:bg-transparent active:bg-transparent" render={<Link href="/" aria-label="Virtual Land — KPI dashboard" />}><span className="flex flex-col items-start gap-2"><BrandLogo width={162} height={36} priority /><span className="text-[11px] font-medium text-sidebar-foreground/55">KPI dashboard отдела продаж</span></span></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Аналитика</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{nav.map((item) => <SidebarMenuItem key={item.href}><SidebarMenuButton isActive={pathname === item.href} tooltip={item.title} render={<Link href={item.href} />}><item.icon /><span>{item.title}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Источник</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton tooltip="Google Sheets" render={<a href={sheetUrl} target="_blank" rel="noreferrer" />}><FileSpreadsheetIcon /><span>Рабочая таблица</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-3 border-t border-sidebar-border p-4">
        <div className="flex items-center gap-2 text-xs text-sidebar-foreground/65"><span className="size-2 rounded-full bg-chart-1" /><span className="truncate">{sourceLabel}</span></div>
        <form action={logout}>
          <SidebarMenuButton className="w-full" tooltip="Выйти" render={<button type="submit" />}><LogOutIcon /><span>Выйти</span></SidebarMenuButton>
        </form>
      </SidebarFooter>
    </Sidebar>
  )
}

export function BrandLogo({ className, width, height, priority = false }: { className?: string; width: number; height: number; priority?: boolean }) {
  return <span className={`inline-flex shrink-0 ${className ?? ""}`} style={{ width, height }}><Image src="/virtual-land-logo.svg" alt="Virtual Land" width={width} height={height} priority={priority} className="dark:hidden" /><Image src="/virtual-land-logo-dark.svg" alt="Virtual Land" width={width} height={height} priority={priority} className="hidden dark:block" /></span>
}

function ThemeToggle() {
  const { setTheme } = useTheme()
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" size="icon-sm" aria-label="Переключить цветовую тему" onClick={() => setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")} />}>
        <MoonIcon className="dark:hidden" /><SunIcon className="hidden dark:block" />
      </TooltipTrigger>
      <TooltipContent>Переключить тему</TooltipContent>
    </Tooltip>
  )
}
