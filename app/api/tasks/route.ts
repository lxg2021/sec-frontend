import { NextResponse } from "next/server"
import type { Task } from "@/features/task/types"
import { taskStore } from "@/features/task/store"

/** GET /api/tasks - 获取所有任务 */
export async function GET() {
  const tasks = taskStore.getAll()
  console.log("[GET /api/tasks - returning tasks:", tasks)
  return NextResponse.json(tasks)
}

/** POST /api/tasks - 创建新任务 */
export async function POST(request: Request) {
  try {
    const task: Task = await request.json()
    console.log("POST /api/tasks - received task:", task)

    // 确保任务有必要的字段
    const newTask: Task = {
      ...task,
      id: task.id || crypto.randomUUID(),
      status: task.status || "pending",
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    taskStore.create(newTask)
    console.log("POST /api/tasks - task created:", newTask)
    console.log("POST /api/tasks - total tasks:", taskStore.count())

    return NextResponse.json(newTask, { status: 201 })
  } catch (error) {
    console.error("POST /api/tasks - error:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
