"use client"

import { useState } from "react"
import { RadioTower } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { syncForensicEndpoints } from "@/shared/lib/forensic/api"

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "同步终端失败"
}

export function ForensicConfigPage() {
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  async function handleSyncEndpoints() {
    setSyncing(true)
    try {
      setSyncError(null)
      setSyncMessage(null)
      const result = await syncForensicEndpoints()
      setSyncMessage(`已同步 ${result.synced_count} 台终端`)
    } catch (error) {
      setSyncError(getErrorMessage(error))
    } finally {
      setSyncing(false)
    }
  }

  return (
    <main className="w-full max-w-none px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">工件配置</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              管理文件、注册表、事件日志等取证工件配置，并维护可用于下发任务的取证终端。
            </p>
            {syncMessage && (
              <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {syncMessage}
              </p>
            )}
            {syncError && (
              <p className="mt-3 text-sm font-medium text-red-700 dark:text-red-300">
                {syncError}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-fit shrink-0"
            onClick={handleSyncEndpoints}
            disabled={syncing}
          >
            <RadioTower className={syncing ? "animate-pulse" : ""} />
            同步终端
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
