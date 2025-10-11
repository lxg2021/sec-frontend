import type { Task } from "@/lib/task/task-types"

/** API 基础 URL */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

/** 创建任务 */
export async function createTask(task: Task): Promise<Task> {
  console.log("[v0] createTask called with:", task)
  console.log("[v0] API_BASE_URL:", API_BASE_URL)

  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  })

  console.log("[v0] createTask response status:", response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] createTask failed:", errorText)
    throw new Error(`Failed to create task: ${response.statusText}`)
  }

  const result = await response.json()
  console.log("[v0] createTask result:", result)
  return result
}

/** 更新任务 */
export async function updateTask(id: string, task: Task): Promise<Task> {
  console.log("[v0] updateTask called with id:", id, "and task:", task)
  console.log("[v0] API_BASE_URL:", API_BASE_URL)

  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  })

  console.log("[v0] updateTask response status:", response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] updateTask failed:", errorText)
    throw new Error(`Failed to update task: ${response.statusText}`)
  }

  const result = await response.json()
  console.log("[v0] updateTask result:", result)
  return result
}

/** 删除任务 */
export async function deleteTask(id: string): Promise<void> {
  console.log("[v0] deleteTask called with id:", id)
  console.log("[v0] API_BASE_URL:", API_BASE_URL)

  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "DELETE",
  })

  console.log("[v0] deleteTask response status:", response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] deleteTask failed:", errorText)
    throw new Error(`Failed to delete task: ${response.statusText}`)
  }
}

/** 获取所有任务 */
export async function getTasks(): Promise<Task[]> {
  console.log("[v0] getTasks called")
  console.log("[v0] API_BASE_URL:", API_BASE_URL)

  const response = await fetch(`${API_BASE_URL}/tasks`)

  console.log("[v0] getTasks response status:", response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] getTasks failed:", errorText)
    throw new Error(`Failed to fetch tasks: ${response.statusText}`)
  }

  const result = await response.json()
  console.log("[v0] getTasks result:", result)
  return result
}
