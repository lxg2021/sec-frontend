"use client"

import { useState } from "react"
import { TaskCreator } from "@/components/task/task-creator"
import { TaskList } from "@/components/task/task-list"
import type { Task, TaskType } from "@/lib/task/task-types"
import { createTask, mockCreateTask, mockUpdateTask, updateTask } from "@/lib/task/api"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ClipboardList, Clock } from "lucide-react"

export default function Home() {
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
          title: "任务已更新",
          description: `任务 "${task.name}" 已成功更新`,
        })
        setEditingTask(undefined)
      } else {
        // 创建新任务
        //      const createdTask = await createTask(task)
        const createdTask = await mockCreateTask(task)
        setTasks((prev) => [...prev, createdTask])
        toast({
          title: "任务已创建",
          description: `任务 "${task.name}" 已成功创建`,
        })
      }
    } catch (error) {
      console.error("Error in handleTaskCreated:", error)
      toast({
        title: editingTask ? "更新失败" : "创建失败",
        description: error instanceof Error ? error.message : "操作任务时发生错误",
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
              <h1 className="text-2xl font-semibold text-gray-900">任务管理</h1>
              <p className="text-sm text-gray-500 mt-1">Task Management System</p>
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
