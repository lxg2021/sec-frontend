"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VulnerabilityScanForm } from "./task-forms/vulnerability-scan-form"
import { AttckScanForm } from "./task-forms/attck-scan-form"
import { BaselineScanForm } from "./task-forms/baseline-scan-form"
import type { VulnerabilityScanTask } from "@/lib/task/vulnerability-scan-task"
import type { AttckScanTask } from "@/lib/task/attck-scan-task"
import type { BaselineScanTask } from "@/lib/task/baseline-scan-task"
import type { Task, TaskType } from "@/lib/task/task-types"

interface TaskCreatorProps {
  onTaskCreated: (task: Task) => void
  editingTask?: { type: TaskType; task: Task }
  onCancelEdit?: () => void
}

export function TaskCreator({ onTaskCreated, editingTask, onCancelEdit }: TaskCreatorProps) {
  const [activeTab, setActiveTab] = useState<TaskType>(editingTask?.type || "vulnerability")

  // 当有编辑任务时，自动切换到对应的 Tab
  if (editingTask && activeTab !== editingTask.type) {
    setActiveTab(editingTask.type)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingTask ? "编辑任务" : "创建任务"}</CardTitle>
        <CardDescription>{editingTask ? "修改任务配置并保存" : "选择任务类型并配置扫描参数"}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TaskType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vulnerability">漏洞扫描</TabsTrigger>
            <TabsTrigger value="attck">ATT&CK 扫描</TabsTrigger>
            <TabsTrigger value="baseline">基线扫描</TabsTrigger>
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
