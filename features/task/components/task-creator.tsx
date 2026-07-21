"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { VulnerabilityScanForm } from "./forms/vulnerability-scan-form"
import { AttckScanForm } from "./forms/attck-scan-form"
import { BaselineScanForm } from "./forms/baseline-scan-form"
import type { VulnerabilityScanTask } from "@/features/task/models/vulnerability-scan-task"
import type { AttckScanTask } from "@/features/task/models/attck-scan-task"
import type { BaselineScanTask } from "@/features/task/models/baseline-scan-task"
import type { Task, TaskType } from "@/features/task/types"
import { useTranslations } from "next-intl"
import Image from "next/image"

interface TaskCreatorProps {
  onTaskCreated: (task: Task) => void
  editingTask?: { type: TaskType; task: Task }
  onCancelEdit?: () => void
}

export function TaskCreator({ onTaskCreated, editingTask, onCancelEdit }: TaskCreatorProps) {
  const t = useTranslations("pages.control.task.creator")
  const [activeTab, setActiveTab] = useState<TaskType>(editingTask?.type || "vulnerability")

  // 当有编辑任务时，自动切换到对应的 Tab
  if (editingTask && activeTab !== editingTask.type) {
    setActiveTab(editingTask.type)
  }

  return (
    <Card>
      <CardHeader>
        {/* <CardTitle>{editingTask ? "编辑任务" : "创建任务"}</CardTitle> */}
        {/* <CardDescription>{editingTask ? "修改任务配置并保存" : "选择任务类型并配置扫描参数"}</CardDescription> */}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TaskType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="vulnerability"
              className="flex items-center justify-center gap-2"
            >
              <Image
                src="/icons/system/vulnerability.svg"
                alt={t("vulnerabilityScan")}
                width={16}
                height={16}
                unoptimized
                className="w-4 h-4"
              />
              {t("vulnerabilityScan")}
            </TabsTrigger>

            <TabsTrigger
              value="attck"
              className="flex items-center justify-center gap-2"
            >
              <Image
                src="/icons/system/attack.svg"
                alt={t("attckScan")}
                width={16}
                height={16}
                unoptimized
                className="w-4 h-4"
              />
              {t("attckScan")}
            </TabsTrigger>

            <TabsTrigger
              value="baseline"
              className="flex items-center justify-center gap-2"
            >
              <Image
                src="/icons/system/baseline.svg"
                alt={t("baselineScan")}
                width={16}
                height={16}
                unoptimized
                className="w-4 h-4"
              />
              {t("baselineScan")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vulnerability" className="mt-6">
            <VulnerabilityScanForm
              initialData={
                editingTask?.type === "vulnerability" ? (editingTask.task as VulnerabilityScanTask) : undefined
              }
              onSubmit={onTaskCreated}
              onCancel={onCancelEdit}
            />
          </TabsContent>

          <TabsContent value="attck" className="mt-6">
            <AttckScanForm
              initialData={editingTask?.type === "attck" ? (editingTask.task as AttckScanTask) : undefined}
              onSubmit={onTaskCreated}
              onCancel={onCancelEdit}
            />
          </TabsContent>

          <TabsContent value="baseline" className="mt-6">
            <BaselineScanForm
              initialData={editingTask?.type === "baseline" ? (editingTask.task as BaselineScanTask) : undefined}
              onSubmit={onTaskCreated}
              onCancel={onCancelEdit}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
