import { requireSession } from "@/lib/auth/session"
import { DashboardFrame } from "@/components/dashboard/dashboard-frame"
import { OutreachDashboard } from "@/components/outreach/outreach-dashboard"
import { CATALOG_URL, initialWorkspace } from "@/lib/outreach/catalog"
import { getOutreachRepository, outreachStorageMode } from "@/lib/outreach/repository"

export default async function OutreachPage() {
  await requireSession()
  const mode = outreachStorageMode()
  let data = initialWorkspace()
  let error = mode === "unavailable" ? "Подключение общей базы ожидает подтверждения владельцем Vercel. Пока доступен просмотр исходного списка." : ""
  if (!error) {
    try { data = (await getOutreachRepository().read()).data }
    catch { error = "Хранилище временно недоступно. Показан исходный каталог, сохранение отключено до восстановления соединения." }
  }
  return <DashboardFrame sourceLabel="Проработка ЖК · отдельная воронка" asOf={data.syncedAt ?? new Date().toISOString()} sourceUrl={CATALOG_URL}>
    <OutreachDashboard initial={data} mode={mode} error={error} />
  </DashboardFrame>
}
