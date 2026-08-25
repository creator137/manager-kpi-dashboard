import { Skeleton } from "@/components/ui/skeleton"

export function DashboardLoading() {
  return (
    <main className="min-h-screen bg-muted/30 p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between"><Skeleton className="h-9 w-72 max-w-[60vw]" /><Skeleton className="h-9 w-36" /></div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-40" />)}</div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5"><Skeleton className="h-96 xl:col-span-3" /><Skeleton className="h-96 xl:col-span-2" /></div>
        <Skeleton className="h-96" />
      </div>
    </main>
  )
}
