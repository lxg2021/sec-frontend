// mock-soft-uninstall-progress.ts
import type { SoftwareUninstallProgress } from "@/lib/task-soft-uninstall-progress"
import type { TaskSchedule } from "@/lib/task-soft-uninstall" // IMMEDIATE | SCHEDULED (executeAt)[attached_file:1][attached_file:2]

const now = new Date()

const iso = (d: Date) => d.toISOString() // helper[attached_file:1][attached_file:2]

const scheduledIn = (mins: number): TaskSchedule => ({
  type: "SCHEDULED",
  executeAt: iso(new Date(now.getTime() + mins * 60 * 1000)),
}) // helper[attached_file:2]

const makeHost = (
  i: number,
  prefix: string,
  status: "SUCCESS" | "FAILED" | "PENDING",
  withError = false,
  uninstalledAt?: string,
) => ({
  hostId: `${prefix}-host-${i}`,
  hostName: `${prefix}-WIN-${String(i).padStart(3, "0")}`,
  status,
  ...(status === "SUCCESS" && uninstalledAt ? { uninstalledAt } : {}),
  ...(withError ? { errorMessage: `ExitCode ${100 + i}: Silent uninstall failed` } : {}),
}) // HostUninstallStatus builder[attached_file:1]

export const mockUninstallProgressList: SoftwareUninstallProgress[] = [
  // 1) 刚创建，未开始，定时执行
  {
    type: "quietUninstall",
    taskId: "T-QU-0001",
    taskName: "Chrome 静默卸载 - 批次A",
    createdAt: iso(now),
    retryCount: 2,
    schedule: scheduledIn(30),
    hash: "sha256:chrome_116.0.5845.97_x64",
    name: "Google Chrome",
    version: "116.0.5845.97",
    vendor: "Google LLC",
    overallProgress: 0,
    totalHosts: 10,
    successCount: 0,
    failedCount: 0,
    pendingCount: 10,
    successHosts: [],
    failedHosts: [],
    pendingHosts: Array.from({ length: 10 }, (_, i) => makeHost(i + 1, "A", "PENDING")),
  }, // 软件、字段与类型符合接口；pending 全量，进度为 0%[attached_file:1][attached_file:2]

  // 2) 进行中，部分成功，部分失败，部分等待，立即执行
  {
    type: "uninstall",
    taskId: "T-UN-0002",
    taskName: "Node.js 卸载 - 运维周更",
    createdAt: iso(new Date(now.getTime() - 5 * 60 * 1000)),
    retryCount: 1,
    schedule: { type: "IMMEDIATE" },
    hash: "sha256:nodejs_18.17.1_x64",
    name: "Node.js",
    version: "18.17.1",
    vendor: "OpenJS Foundation",
    overallProgress: 45, // 9/20 完成(含失败+成功) -> 45% 仅示例用
    totalHosts: 20,
    successCount: 7,
    failedCount: 2,
    pendingCount: 11,
    successHosts: Array.from({ length: 7 }, (_, i) =>
      makeHost(i + 1, "B", "SUCCESS", false, iso(new Date(now.getTime() - (60 - i * 5) * 1000))),
    ),
    failedHosts: [makeHost(8, "B", "FAILED", true), makeHost(9, "B", "FAILED", true)],
    pendingHosts: Array.from({ length: 11 }, (_, i) => makeHost(10 + i + 1, "B", "PENDING")),
  }, // 即时执行，进度中；失败条目带 errorMessage；数量合计一致[attached_file:1][attached_file:2]

  // 3) 基本完成，仅剩少量 Pending
  {
    type: "quietUninstall",
    taskId: "T-QU-0003",
    taskName: "WinRAR 静默卸载 - 部门C",
    createdAt: iso(new Date(now.getTime() - 30 * 60 * 1000)),
    retryCount: 3,
    schedule: { type: "IMMEDIATE" },
    hash: "sha256:winrar_6.23_x64",
    name: "WinRAR",
    version: "6.23",
    vendor: "win.rar GmbH",
    overallProgress: 92, // 46/50 完成 -> 92%
    totalHosts: 50,
    successCount: 44,
    failedCount: 2,
    pendingCount: 4,
    successHosts: Array.from({ length: 44 }, (_, i) =>
      makeHost(i + 1, "C", "SUCCESS", false, iso(new Date(now.getTime() - (25 * 60 - i * 30) * 1000))),
    ),
    failedHosts: [makeHost(45, "C", "FAILED", true), makeHost(46, "C", "FAILED", true)],
    pendingHosts: [
      makeHost(47, "C", "PENDING"),
      makeHost(48, "C", "PENDING"),
      makeHost(49, "C", "PENDING"),
      makeHost(50, "C", "PENDING"),
    ],
  }, // 大规模任务高完成度；计数与进度相符[attached_file:1][attached_file:2]

  // 4) 全部成功
  {
    type: "uninstall",
    taskId: "T-UN-0004",
    taskName: "7-Zip 卸载 - 批次D",
    createdAt: iso(new Date(now.getTime() - 2 * 60 * 60 * 1000)),
    retryCount: 0,
    schedule: { type: "IMMEDIATE" },
    hash: "sha256:7zip_23.01_x64",
    name: "7-Zip",
    version: "23.01",
    vendor: "Igor Pavlov",
    overallProgress: 100,
    totalHosts: 5,
    successCount: 5,
    failedCount: 0,
    pendingCount: 0,
    successHosts: Array.from({ length: 5 }, (_, i) =>
      makeHost(i + 1, "D", "SUCCESS", false, iso(new Date(now.getTime() - (110 - i * 10) * 60 * 1000))),
    ),
    failedHosts: [],
    pendingHosts: [],
  }, // 完成态；进度 100%，仅 successHosts 填充[attached_file:1][attached_file:2]

  // 5) 全部失败（用于前端错误态校验）
  {
    type: "quietUninstall",
    taskId: "T-QU-0005",
    taskName: "Adobe Reader 静默卸载 - 夜间任务",
    createdAt: iso(new Date(now.getTime() - 15 * 60 * 1000)),
    retryCount: 2,
    schedule: scheduledIn(0), // 视作立即生效的定时点
    hash: "sha256:acrobat_reader_2023.008_x64",
    name: "Adobe Acrobat Reader",
    version: "2023.008",
    vendor: "Adobe",
    overallProgress: 100,
    totalHosts: 8,
    successCount: 0,
    failedCount: 8,
    pendingCount: 0,
    successHosts: [],
    failedHosts: Array.from({ length: 8 }, (_, i) => makeHost(i + 1, "E", "FAILED", true)),
    pendingHosts: [],
  }, // 失败全量；errorMessage 全部存在，便于前端错误展示验证[attached_file:1][attached_file:2]

  // 6) 大任务，分布均衡，定时未来时间
  {
    type: "uninstall",
    taskId: "T-UN-0006",
    taskName: "Java 8 卸载 - 全域",
    createdAt: iso(new Date(now.getTime() - 10 * 60 * 1000)),
    retryCount: 1,
    schedule: scheduledIn(120), // 2小时后执行
    hash: "sha256:java8_1.8.0_381_x64",
    name: "Java 8",
    version: "1.8.0_381",
    vendor: "Oracle",
    overallProgress: 0, // 尚未开始
    totalHosts: 120,
    successCount: 0,
    failedCount: 0,
    pendingCount: 120,
    successHosts: [],
    failedHosts: [],
    pendingHosts: Array.from({ length: 120 }, (_, i) => makeHost(i + 1, "F", "PENDING")),
  }, // 未来定时；全量 pending，适配大列表虚拟滚动测试[attached_file:1][attached_file:2]

  // 7) 重试中的任务（失败+成功+等待，retryCount>0）
  {
    type: "quietUninstall",
    taskId: "T-QU-0007",
    taskName: "Slack 静默卸载 - 重试批次",
    createdAt: iso(new Date(now.getTime() - 45 * 60 * 1000)),
    retryCount: 3,
    schedule: { type: "IMMEDIATE" },
    hash: "sha256:slack_4.38.121_x64",
    name: "Slack",
    version: "4.38.121",
    vendor: "Slack Technologies, LLC",
    overallProgress: 60, // 18/30 完成
    totalHosts: 30,
    successCount: 14,
    failedCount: 4,
    pendingCount: 12,
    successHosts: Array.from({ length: 14 }, (_, i) =>
      makeHost(i + 1, "G", "SUCCESS", false, iso(new Date(now.getTime() - (40 - i * 2) * 60 * 1000))),
    ),
    failedHosts: Array.from({ length: 4 }, (_, i) => makeHost(14 + i + 1, "G", "FAILED", true)),
    pendingHosts: Array.from({ length: 12 }, (_, i) => makeHost(18 + i + 1, "G", "PENDING")),
  }, // 展示重试能力；三种状态并存；进度与计数一致[attached_file:1][attached_file:2]

  // 8) 极小任务，含单个失败错误信息
  {
    type: "uninstall",
    taskId: "T-UN-0008",
    taskName: "VLC 卸载 - 双机验证",
    createdAt: iso(new Date(now.getTime() - 2 * 60 * 1000)),
    retryCount: 1,
    schedule: { type: "IMMEDIATE" },
    hash: "sha256:vlc_3.0.21_x64",
    name: "VLC media player",
    version: "3.0.21",
    vendor: "VideoLAN",
    overallProgress: 50,
    totalHosts: 2,
    successCount: 1,
    failedCount: 1,
    pendingCount: 0,
    successHosts: [makeHost(1, "H", "SUCCESS", false, iso(new Date(now.getTime() - 90 * 1000)))],
    failedHosts: [makeHost(2, "H", "FAILED", true)],
    pendingHosts: [],
  }, // 小样本边界；50% 进度；错误态显示验证[attached_file:1][attached_file:2]

  // 9) 元数据缺省场景（无 name/version/vendor）
  {
    type: "quietUninstall",
    taskId: "T-QU-0009",
    taskName: "未知条目静默卸载",
    createdAt: iso(new Date(now.getTime() - 8 * 60 * 1000)),
    retryCount: 0,
    schedule: { type: "IMMEDIATE" },
    hash: "sha256:unknown_pkg_x64_build_42",
    overallProgress: 10,
    totalHosts: 10,
    successCount: 1,
    failedCount: 0,
    pendingCount: 9,
    successHosts: [makeHost(1, "I", "SUCCESS", false, iso(new Date(now.getTime() - 6 * 60 * 1000)))],
    failedHosts: [],
    pendingHosts: Array.from({ length: 9 }, (_, i) => makeHost(i + 2, "I", "PENDING")),
  }, // 可选字段缺省覆盖；仍满足接口要求[attached_file:1][attached_file:2]

  // 10) 中等规模，失败多，便于错误列表渲染
  {
    type: "uninstall",
    taskId: "T-UN-0010",
    taskName: "Python 3.11 卸载 - 区域J",
    createdAt: iso(new Date(now.getTime() - 20 * 60 * 1000)),
    retryCount: 2,
    schedule: { type: "IMMEDIATE" },
    hash: "sha256:python_3.11.6_x64",
    name: "Python",
    version: "3.11.6",
    vendor: "Python Software Foundation",
    overallProgress: 70, // 14/20 完成
    totalHosts: 20,
    successCount: 9,
    failedCount: 5,
    pendingCount: 6,
    successHosts: Array.from({ length: 9 }, (_, i) =>
      makeHost(i + 1, "J", "SUCCESS", false, iso(new Date(now.getTime() - (18 - i) * 60 * 1000))),
    ),
    failedHosts: Array.from({ length: 5 }, (_, i) => makeHost(9 + i + 1, "J", "FAILED", true)),
    pendingHosts: Array.from({ length: 6 }, (_, i) => makeHost(14 + i + 1, "J", "PENDING")),
  },
]

export default mockUninstallProgressList
