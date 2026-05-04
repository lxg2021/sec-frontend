import type { Task } from "@/features/task/types"

class TaskStore {
  private tasks: Task[] = []

  getAll(): Task[] {
    return this.tasks
  }

  findById(id: string): Task | undefined {
    return this.tasks.find((t) => t.id === id)
  }

  create(task: Task): Task {
    this.tasks.push(task)
    return task
  }

  update(id: string, task: Task): Task | null {
    const index = this.tasks.findIndex((t) => t.id === id)
    if (index === -1) return null

    this.tasks[index] = task
    return this.tasks[index]
  }

  delete(id: string): boolean {
    const index = this.tasks.findIndex((t) => t.id === id)
    if (index === -1) return false

    this.tasks.splice(index, 1)
    return true
  }

  count(): number {
    return this.tasks.length
  }
}

// 导出单例实例
export const taskStore = new TaskStore()
