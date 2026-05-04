"use client"

import { useState } from "react"
import { TaskCreator } from "@/features/task/components/task-creator"
import { TaskList } from "@/features/task/components/task-list"
import type { Task, TaskType } from "@/features/task/types"
import { createTask, mockCreateTask, mockUpdateTask, updateTask } from "@/features/task/api"
import { useToast } from "@/shared/hooks/use-toast"
import { Toaster } from "@/shared/ui/toaster"
import { ClipboardList, Clock } from "lucide-react"
import { useTranslations } from "next-intl"

export default function Home() {
  const t = useTranslations("pages.control.task")
  const [tasks, setTasks] = useState<Task[]>([])
  const [editingTask, setEditingTask] = useState<{ type: TaskType; task: Task } | undefined>()
  const { toast } = useToast()

  const handleTaskCreated = async (task: Task) => {
    console.log("handleTaskCreated called with task:", task)

    try {
      if (editingTask) {
        // 更新现有任务
        //      const updatedTask = await updateTask(task.id, task)
        const updatedTask = await mockUpdateTask(task.id, task)
        setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)))
        toast({
          title: t("taskUpdated"),
          description: t("taskUpdatedDescription", { name: task.name }),
        })
        setEditingTask(undefined)
      } else {
        // 创建新任务
        //      const createdTask = await createTask(task)
        const createdTask = await mockCreateTask(task)
        setTasks((prev) => [...prev, createdTask])
        toast({
          title: t("taskCreated"),
          description: t("taskCreatedDescription", { name: task.name }),
        })
      }
    } catch (error) {
      console.error("Error in handleTaskCreated:", error)
      toast({
        title: editingTask ? t("updateFailed") : t("createFailed"),
        description: error instanceof Error ? error.message : t("operationFailed"),
        variant: "destructive",
      })
    }
  }

  /* 编辑任务，滚动到顶部以显示编辑表单 */
  const handleEdit = (type: TaskType, task: Task) => {
    setEditingTask({ type, task })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCancelEdit = () => {
    setEditingTask(undefined)
  }

  const handleDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ClipboardList className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
              <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="space-y-8">
          <TaskCreator
            onTaskCreated={handleTaskCreated}
            editingTask={editingTask}
            onCancelEdit={handleCancelEdit}
          />

          <TaskList
            tasks={tasks}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        <Toaster />
      </div>
    </div>
  )
}
