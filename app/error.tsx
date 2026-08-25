"use client"

import { CircleAlertIcon, RotateCcwIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4"><Alert variant="destructive" className="max-w-xl"><CircleAlertIcon /><AlertTitle>Дашборд не загрузился</AlertTitle><AlertDescription className="flex flex-col items-start gap-4"><span>Проверьте доступность источника и повторите запрос.</span><Button variant="outline" size="sm" onClick={reset}><RotateCcwIcon data-icon="inline-start" />Повторить</Button></AlertDescription></Alert></main>
}
