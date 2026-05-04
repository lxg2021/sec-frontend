"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Button } from "@/shared/ui/button"
import { Download, Shield } from "lucide-react"
import { TaskDispatchAudit } from "./task-dispatch-audit"
import { UserActivityAudit } from "./user-activity-audit"
import { DefenseAudit } from "./defense-audit"
import { DispositionAudit } from "./disposition-audit"
import { GlobalFilters } from "./global-filters"
import { mockTaskDispatchReports } from "@/features/audit/mock/task-dispatch-report"
import { mockUserAuditData } from "@/features/audit/mock/user-audit"
import { mockDefenseAudits } from "@/features/audit/mock/defense-audit"
import { mockDispositionAudits } from "@/features/audit/mock/disposition-audit"

export type AuditTab = "task" | "user" | "defense" | "disposition"

export function AuditCenter() {
  const [activeTab, setActiveTab] = useState<AuditTab>("task")
  const [globalSearch, setGlobalSearch] = useState("")
  const [dateRange, setDateRange] = useState<string>("7d")
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>()
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>()

  const handleExport = () => {
    console.log("Exporting audit report...")
    // Export logic would go here
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              导出报告
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <GlobalFilters
            activeTab={activeTab}
            globalSearch={globalSearch}
            setGlobalSearch={setGlobalSearch}
            dateRange={dateRange}
            setDateRange={setDateRange}
            customDateFrom={customDateFrom}
            setCustomDateFrom={setCustomDateFrom}
            customDateTo={customDateTo}
            setCustomDateTo={setCustomDateTo}
          />

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AuditTab)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="task" className="flex items-center justify-center gap-2">
                <img src="/icons/audit/task-dispatch.svg" className="h-4 w-4" alt="任务下发图标" />
                任务下发审计
              </TabsTrigger>
              <TabsTrigger value="user" className="flex items-center justify-center gap-2">
                <img src="/icons/audit/user-activity.svg" className="h-4 w-4" alt="用户行为图标" />
                用户行为审计
              </TabsTrigger>
              <TabsTrigger value="defense" className="flex items-center justify-center gap-2">
                <img src="/icons/audit/defense.svg" className="h-4 w-4" alt="防御动作图标" />
                防御动作审计
              </TabsTrigger>
              <TabsTrigger value="disposition" className="flex items-center justify-center gap-2">
                <img src="/icons/audit/disposition.svg" className="h-4 w-4" alt="处置动作图标" />
                处置动作审计
              </TabsTrigger>
            </TabsList>

            <TabsContent value="task" className="mt-6">
              <TaskDispatchAudit
                data={mockTaskDispatchReports}
                globalSearch={globalSearch}
                dateRange={dateRange}
                customDateFrom={customDateFrom}
                customDateTo={customDateTo}
              />
            </TabsContent>

            <TabsContent value="user" className="mt-6">
              <UserActivityAudit
                data={mockUserAuditData}
                globalSearch={globalSearch}
                dateRange={dateRange}
                customDateFrom={customDateFrom}
                customDateTo={customDateTo}
              />
            </TabsContent>

            <TabsContent value="defense" className="mt-6">
              <DefenseAudit
                data={mockDefenseAudits}
                globalSearch={globalSearch}
                dateRange={dateRange}
                customDateFrom={customDateFrom}
                customDateTo={customDateTo}
              />
            </TabsContent>

            <TabsContent value="disposition" className="mt-6">
              <DispositionAudit
                data={mockDispositionAudits}
                globalSearch={globalSearch}
                dateRange={dateRange}
                customDateFrom={customDateFrom}
                customDateTo={customDateTo}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
