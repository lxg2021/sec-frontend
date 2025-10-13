"use client"

import { useState } from "react"
import { TaskCreator } from "@/components/task/task-creator"
import { TaskList } from "@/components/task/task-list"
import type { Task, TaskType } from "@/lib/task/task-types"
import { createTask, mockCreateTask, mockUpdateTask, updateTask } from "@/lib/task/api"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [editingTask, setEditingTask] = useState<{ type: TaskType; task: Task } | undefined>()
  const { toast } = useToast()

  const handleTaskCreated = async (task: Task) => {
    console.log("[v0] handleTaskCreated called with task:", task)

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
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">任务管理系统</h1>
        <p className="mt-2 text-muted-foreground">创建和管理扫描任务</p>
      </div>

      <div className="space-y-8">
        <TaskCreator onTaskCreated={handleTaskCreated} editingTask={editingTask} onCancelEdit={handleCancelEdit} />
        <TaskList tasks={tasks} onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      <Toaster />
    </div>
  )
}
