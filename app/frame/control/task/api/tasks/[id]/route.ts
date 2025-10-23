import { NextResponse } from "next/server"
import type { Task } from "@/types/task-types"
import { taskStore } from "@/lib/task-store"

/** PUT /api/tasks/[id] - 更新任务 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const updatedTask: Task = await request.json()
    console.log("PUT /api/tasks/[id] - updating task:", id)
    console.log("PUT /api/tasks/[id] - current tasks count:", taskStore.count())

    const result = taskStore.update(id, {
      ...updatedTask,
      id,
      updatedAt: new Date().toISOString(),
    })

    if (!result) {
      console.error("PUT /api/tasks/[id] - task not found:", id)
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    console.log("PUT /api/tasks/[id] - task updated:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("PUT /api/tasks/[id] - error:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

/** DELETE /api/tasks/[id] - 删除任务 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    console.log("DELETE /api/tasks/[id] - deleting task:", id)

    const success = taskStore.delete(id)

    if (!success) {
      console.error("DELETE /api/tasks/[id] - task not found:", id)
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    console.log("DELETE /api/tasks/[id] - task deleted, remaining:", taskStore.count())
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/tasks/[id] - error:", error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
