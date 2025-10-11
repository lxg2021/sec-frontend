import type { VulnerabilityScanTask } from "./vulnerability-scan-task"
import type { AttckScanTask } from "./attck-scan-task"
import type { BaselineScanTask } from "./baseline-scan-task"

/** 统一的任务类型 */
export type Task = VulnerabilityScanTask | AttckScanTask | BaselineScanTask

/** 任务类型标识 */
export type TaskType = "vulnerability" | "attck" | "baseline"

/** 带类型标识的任务 */
export interface TaskWithType {
  type: TaskType
  task: Task
}

/** 判断任务类型的辅助函数 */
export function getTaskType(task: Task): TaskType {
  if ("targetHosts" in task && "scheduled" in task) {
    return "vulnerability"
  }
  if ("dataSources" in task) {
    return "attck"
  }
  if ("policy" in task) {
    return "baseline"
  }
  throw new Error("Unknown task type")
}
