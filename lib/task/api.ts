import type { Task } from "@/lib/task/task-types"

/* 模拟的任务存储池（可以放在全局或单例模块中) */
let mockTasks: Task[] = []
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))


/** API 基础 URL */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

/** 创建任务 */
export async function createTask(task: Task): Promise<Task> {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  })

  console.log("[createTask response status:", response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[createTask failed:", errorText)
    throw new Error(`Failed to create task: ${response.statusText}`)
  }

  const result = await response.json()
  console.log("createTask result:", result)
  return result
}


/** 创建任务,模拟版本 */
export async function mockCreateTask(task: Task): Promise<Task> {
  console.log("[mockCreateTask] called with:", task)
  await delay(300)

  // 模拟后端生成任务对象
  const newTask: Task = {
    ...task,
    id: task.id ?? crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: task.status ?? "pending",
  }

  // 将新任务插入到 mock 数据列表中
  mockTasks.push(newTask)

  console.log("[mockCreateTask] success:", newTask)
  return newTask
}

/** 更新任务 */
export async function updateTask(id: string, task: Task): Promise<Task> {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to update task: ${response.statusText}`)
  }

  const result = await response.json()
  console.log("updateTask result:", result)
  return result
}


/** 更新任务模拟版本 */
export async function mockUpdateTask(id: string, task: Task): Promise<Task> {
  console.log("[mockUpdateTask] called with id:", id, "task:", task)
  await delay(300)

  // 查找任务
  const index = mockTasks.findIndex((t) => t.id === id)
  if (index === -1) {
    console.error("[mockUpdateTask] failed: task not found:", id)
    throw new Error(`Failed to update task: task with id ${id} not found`)
  }

  /* 模拟后端更新逻辑 */
  const updatedTask: Task = {
    ...mockTasks[index],
    ...task,
    id,
    updatedAt: new Date().toISOString(),
  }

  mockTasks[index] = updatedTask

  console.log("[mockUpdateTask] success:", updatedTask)
  return updatedTask
}


/** 删除任务 */
export async function deleteTask(id: string): Promise<void> {

  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "DELETE",
  })


  if (!response.ok) {
    const errorText = await response.text()
    console.error("[deleteTask failed:", errorText)
    throw new Error(`Failed to delete task: ${response.statusText}`)
  }
}

/** 删除任务（模拟版本） */
export async function mockDeleteTask(id: string): Promise<void> {
  console.log("[mockDeleteTask] called with id:", id)
  await delay(300)

  const index = mockTasks.findIndex((t) => t.id === id)
  if (index === -1) {
    console.error("[mockDeleteTask] failed: task not found:", id)
    throw new Error(`Failed to delete task: task with id ${id} not found`)
  }

  // 模拟后端删除逻辑
  mockTasks.splice(index, 1)

  console.log("[mockDeleteTask] success: task deleted:", id)
}


/** 获取所有任务 */
export async function getTasks(): Promise<Task[]> {

  const response = await fetch(`${API_BASE_URL}/tasks`)

  if (!response.ok) {
    const errorText = await response.text()
    console.error("getTasks failed:", errorText)
    throw new Error(`Failed to fetch tasks: ${response.statusText}`)
  }

  const result = await response.json()
  console.log("getTasks result:", result)
  return result
}
