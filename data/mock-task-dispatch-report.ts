// mock-task-dispatch-report.ts
import type { TaskDispatchReport, HostDispatchStatus } from "./task-dispatch-report"

// 生成主机状态数据的辅助函数
const generateHostStatus = (
  baseId: string,
  count: number,
  status: "SUCCESS" | "FAILED" | "PENDING",
): HostDispatchStatus[] => {
  return Array.from({ length: count }, (_, i) => {
    const hostNumber = i + 1
    const hostId = `${baseId}-host-${String(hostNumber).padStart(3, "0")}`
    const hostName = `Host-${String(hostNumber).padStart(3, "0")}`

    const baseTime = new Date("2024-01-20T10:00:00Z")
    const dispatchAt = new Date(baseTime.getTime() + i * 60000).toISOString() // 每分钟下发一台

    let executeAt: string | undefined
    let errorMessage: string | undefined

    if (status === "SUCCESS") {
      executeAt = new Date(baseTime.getTime() + i * 60000 + 30000).toISOString() // 30秒后执行成功
    } else if (status === "FAILED") {
      executeAt = new Date(baseTime.getTime() + i * 60000 + 15000).toISOString() // 15秒后执行失败
      errorMessage = i % 3 === 0 ? "连接超时" : i % 3 === 1 ? "权限不足" : "主机离线"
    }

    return {
      hostId,
      hostName,
      dispatchAt,
      executeAt,
      status,
      errorMessage,
    }
  })
}

export const mockTaskDispatchReports: TaskDispatchReport[] = [
  {
    taskType: "TASK",
    id: "task-security-scan-001",
    name: "全盘安全扫描",
    level: 1,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    dispatchedBy: "admin",
    startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3.5 * 60 * 60 * 1000).toISOString(),
    overallProgress: 85,
    totalHosts: 100,
    successCount: 80,
    failedCount: 5,
    pendingCount: 15,
    successHosts: generateHostStatus("task-001", 80, "SUCCESS"),
    failedHosts: generateHostStatus("task-001", 5, "FAILED"),
    pendingHosts: generateHostStatus("task-001", 15, "PENDING"),
    priority: "HIGH",
    tags: ["安全扫描", "紧急", "全盘扫描"],
    details: {
      command: "scan --full --deep --quarantine",
      scanType: "FULL_SYSTEM",
      timeout: 7200,
      excludePaths: ["C:\\Windows\\Temp", "C:\\$Recycle.Bin"],
      includePaths: ["C:\\", "D:\\"],
      scanSensitivity: "HIGH",
      quarantineAction: "AUTO",
      reportFormat: "JSON",
    },
  },
  {
    taskType: "POLICY",
    id: "policy-firewall-update-002",
    name: "防火墙策略更新",
    level: 2,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    dispatchedBy: "security_admin",
    startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 1.75 * 60 * 60 * 1000).toISOString(),
    overallProgress: 100,
    totalHosts: 50,
    successCount: 50,
    failedCount: 0,
    pendingCount: 0,
    successHosts: generateHostStatus("policy-002", 50, "SUCCESS"),
    failedHosts: [],
    pendingHosts: [],
    priority: "HIGH",
    tags: ["策略更新", "防火墙", "网络安全"],
    details: {
      policyName: "Enhanced Firewall Policy v2.1",
      rules: [
        {
          action: "BLOCK",
          protocol: "TCP",
          port: "135-139,445",
          direction: "INBOUND",
          description: "Block SMB ports",
        },
        {
          action: "ALLOW",
          protocol: "TCP",
          port: "80,443",
          direction: "OUTBOUND",
          description: "Allow web browsing",
        },
      ],
      applyTo: "ALL_HOSTS",
      enforcement: "IMMEDIATE",
      rollbackEnabled: true,
    },
  },
  {
    taskType: "CONFIG",
    id: "config-antivirus-003",
    name: "杀毒软件配置更新",
    level: 1,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    dispatchedBy: "system_auto",
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 3.5 * 60 * 60 * 1000).toISOString(),
    overallProgress: 60,
    totalHosts: 200,
    successCount: 120,
    failedCount: 0,
    pendingCount: 80,
    successHosts: generateHostStatus("config-003", 120, "SUCCESS"),
    failedHosts: [],
    pendingHosts: generateHostStatus("config-003", 80, "PENDING"),
    priority: "MEDIUM",
    tags: ["配置更新", "杀毒软件", "自动任务"],
    details: {
      software: "Windows Defender",
      configVersion: "4.18.23080.1002",
      updates: {
        realtimeProtection: true,
        cloudProtection: true,
        sampleSubmission: "SAFE",
        exclusionPaths: ["C:\\DevTools", "D:\\Database"],
        scanSchedule: "DAILY_14:00",
        scanType: "QUICK",
      },
      signatureUpdate: true,
      rebootRequired: false,
    },
  },
  {
    taskType: "TASK",
    id: "task-patch-deployment-004",
    name: "安全补丁部署",
    level: 1,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    dispatchedBy: "patch_admin",
    startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
    overallProgress: 45,
    totalHosts: 300,
    successCount: 135,
    failedCount: 25,
    pendingCount: 140,
    successHosts: generateHostStatus("task-004", 135, "SUCCESS"),
    failedHosts: generateHostStatus("task-004", 25, "FAILED"),
    pendingHosts: generateHostStatus("task-004", 140, "PENDING"),
    priority: "HIGH",
    tags: ["补丁管理", "安全更新", "关键"],
    details: {
      patches: [
        {
          kb: "KB5005565",
          title: "Security Update for Windows",
          severity: "CRITICAL",
          reboot: "REQUIRED",
        },
        {
          kb: "KB5006670",
          title: "October 2024 Security Update",
          severity: "IMPORTANT",
          reboot: "REQUIRED",
        },
      ],
      deploymentStrategy: "PHASED",
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      rebootOptions: "AUTO_AFTER_HOURS",
      rollbackTimeout: 3600,
    },
  },
  {
    taskType: "POLICY",
    id: "policy-dlp-005",
    name: "数据防泄露策略部署",
    level: 3,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    dispatchedBy: "compliance_officer",
    startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 1.33 * 60 * 60 * 1000).toISOString(),
    overallProgress: 100,
    totalHosts: 75,
    successCount: 75,
    failedCount: 0,
    pendingCount: 0,
    successHosts: generateHostStatus("policy-005", 75, "SUCCESS"),
    failedHosts: [],
    pendingHosts: [],
    priority: "HIGH",
    tags: ["数据安全", "合规", "DLP"],
    details: {
      policyName: "Corporate DLP Policy v3.0",
      sensitiveDataTypes: ["CREDIT_CARD", "SOCIAL_SECURITY", "BANK_ACCOUNT", "HEALTH_RECORDS"],
      actions: {
        monitor: ["USB", "EMAIL", "CLOUD_UPLOAD"],
        block: ["UNENCRYPTED_EXTERNAL"],
        encrypt: ["ALL_EXTERNAL"],
      },
      userGroups: ["FINANCE", "HR", "EXECUTIVE"],
      reporting: {
        alerts: "REAL_TIME",
        reports: "DAILY",
        auditTrail: "ENABLED",
      },
    },
  },
  {
    taskType: "CONFIG",
    id: "config-backup-006",
    name: "备份客户端配置",
    level: 2,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    dispatchedBy: "backup_admin",
    startedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    overallProgress: 92,
    totalHosts: 150,
    successCount: 138,
    failedCount: 8,
    pendingCount: 4,
    successHosts: generateHostStatus("config-006", 138, "SUCCESS"),
    failedHosts: generateHostStatus("config-006", 8, "FAILED"),
    pendingHosts: generateHostStatus("config-006", 4, "PENDING"),
    priority: "MEDIUM",
    tags: ["备份配置", "数据保护", "维护"],
    details: {
      backupSoftware: "Veeam Backup",
      config: {
        backupSchedule: "DAILY_02:00",
        retentionPolicy: "30_DAYS",
        compression: "ENABLED",
        encryption: "AES_256",
        includePaths: ["C:\\Data", "D:\\Database"],
        excludePaths: ["C:\\Temp", "C:\\Cache"],
      },
      storage: {
        type: "NETWORK_SHARE",
        path: "\\\\backup-server\\veeam-backup",
        credentials: "DOMAIN_ACCOUNT",
      },
      verification: {
        enabled: true,
        schedule: "WEEKLY",
        method: "QUICK_VERIFY",
      },
    },
  },
  {
    taskType: "TASK",
    id: "task-inventory-007",
    name: "资产清点收集",
    level: 1,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    dispatchedBy: "inventory_system",
    startedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    overallProgress: 78,
    totalHosts: 500,
    successCount: 390,
    failedCount: 35,
    pendingCount: 75,
    successHosts: generateHostStatus("task-007", 390, "SUCCESS"),
    failedHosts: generateHostStatus("task-007", 35, "FAILED"),
    pendingHosts: generateHostStatus("task-007", 75, "PENDING"),
    priority: "LOW",
    tags: ["资产清点", "自动化", "报表"],
    details: {
      inventoryTypes: ["HARDWARE", "SOFTWARE", "NETWORK", "USER_ACCOUNTS"],
      collectionMethods: {
        hardware: "WMI",
        software: "REGISTRY+INSTALLED_PROGRAMS",
        network: "IPCONFIG+NETSTAT",
      },
      reportFormat: "JSON+CSV",
      dataRetention: "90_DAYS",
      autoClassification: true,
    },
  },
  {
    taskType: "POLICY",
    id: "policy-password-008",
    name: "密码策略强化",
    level: 2,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    dispatchedBy: "security_admin",
    startedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000 + 0.5 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000 + 0.75 * 60 * 60 * 1000).toISOString(),
    overallProgress: 100,
    totalHosts: 80,
    successCount: 80,
    failedCount: 0,
    pendingCount: 0,
    successHosts: generateHostStatus("policy-008", 80, "SUCCESS"),
    failedHosts: [],
    pendingHosts: [],
    priority: "HIGH",
    tags: ["密码策略", "安全强化", "合规"],
    details: {
      policySettings: {
        minLength: 12,
        complexity: true,
        history: 5,
        maxAge: 90,
        lockoutThreshold: 5,
        lockoutDuration: 30,
      },
      applyTo: "ALL_USERS",
      exceptions: ["SERVICE_ACCOUNTS"],
      gracePeriod: 7,
      notification: {
        enabled: true,
        daysBefore: 14,
        method: "EMAIL+SYSTEM_TRAY",
      },
    },
  },
  {
    taskType: "CONFIG",
    id: "config-monitoring-009",
    name: "监控代理配置",
    level: 1,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
    dispatchedBy: "monitoring_admin",
    startedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    overallProgress: 65,
    totalHosts: 250,
    successCount: 163,
    failedCount: 12,
    pendingCount: 75,
    successHosts: generateHostStatus("config-009", 163, "SUCCESS"),
    failedHosts: generateHostStatus("config-009", 12, "FAILED"),
    pendingHosts: generateHostStatus("config-009", 75, "PENDING"),
    priority: "MEDIUM",
    tags: ["监控配置", "性能收集", "代理更新"],
    details: {
      monitoringAgent: "Zabbix Agent 2",
      configVersion: "6.4.8",
      collectionIntervals: {
        cpu: 30,
        memory: 30,
        disk: 60,
        network: 30,
      },
      metrics: ["CPU_UTILIZATION", "MEMORY_USAGE", "DISK_SPACE", "NETWORK_TRAFFIC", "SERVICE_STATUS"],
      alerting: {
        enabled: true,
        thresholds: {
          cpu: 90,
          memory: 85,
          disk: 95,
        },
        notificationChannels: ["EMAIL", "SLACK"],
      },
    },
  },
  {
    taskType: "TASK",
    id: "task-cleanup-010",
    name: "临时文件清理",
    level: 1,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    dispatchedBy: "maintenance_system",
    startedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    overallProgress: 95,
    totalHosts: 400,
    successCount: 380,
    failedCount: 15,
    pendingCount: 5,
    successHosts: generateHostStatus("task-010", 380, "SUCCESS"),
    failedHosts: generateHostStatus("task-010", 15, "FAILED"),
    pendingHosts: generateHostStatus("task-010", 5, "PENDING"),
    priority: "LOW",
    tags: ["清理任务", "维护", "磁盘空间"],
    details: {
      cleanupTargets: [
        "C:\\Windows\\Temp\\*",
        "C:\\Users\\*\\AppData\\Local\\Temp\\*",
        "C:\\$Recycle.Bin\\*",
        "*.tmp",
        "*.log",
      ],
      retention: {
        olderThan: "7_DAYS",
        sizeLimit: "1GB",
      },
      backupBeforeDelete: false,
      reportDeletedFiles: true,
      excludePatterns: ["*.important.tmp", "system_*.log"],
    },
  },
]

// 按任务类型分类的辅助函数
export const getTaskReportsByType = (taskType: string): TaskDispatchReport[] => {
  return mockTaskDispatchReports.filter((report) => report.taskType === taskType)
}

// 按优先级分类的辅助函数
export const getTaskReportsByPriority = (priority: string): TaskDispatchReport[] => {
  return mockTaskDispatchReports.filter((report) => report.priority === priority)
}

// 按状态分类的辅助函数（根据进度）
export const getTaskReportsByProgress = (minProgress: number, maxProgress = 100): TaskDispatchReport[] => {
  return mockTaskDispatchReports.filter(
    (report) => report.overallProgress >= minProgress && report.overallProgress <= maxProgress,
  )
}

// 按操作人分类的辅助函数
export const getTaskReportsByDispatcher = (dispatcher: string): TaskDispatchReport[] => {
  return mockTaskDispatchReports.filter((report) => report.dispatchedBy === dispatcher)
}

// 统计信息
export const getTaskReportStats = () => {
  const total = mockTaskDispatchReports.length

  // 按任务类型统计
  const taskCount = mockTaskDispatchReports.filter((report) => report.taskType === "TASK").length
  const configCount = mockTaskDispatchReports.filter((report) => report.taskType === "CONFIG").length
  const policyCount = mockTaskDispatchReports.filter((report) => report.taskType === "POLICY").length

  // 按优先级统计
  const highPriorityCount = mockTaskDispatchReports.filter((report) => report.priority === "HIGH").length
  const mediumPriorityCount = mockTaskDispatchReports.filter((report) => report.priority === "MEDIUM").length
  const lowPriorityCount = mockTaskDispatchReports.filter((report) => report.priority === "LOW").length

  // 总体进度统计
  const totalProgress = mockTaskDispatchReports.reduce((sum, report) => sum + report.overallProgress, 0)
  const averageProgress = total > 0 ? totalProgress / total : 0

  // 主机统计
  const totalHosts = mockTaskDispatchReports.reduce((sum, report) => sum + report.totalHosts, 0)
  const totalSuccess = mockTaskDispatchReports.reduce((sum, report) => sum + report.successCount, 0)
  const totalFailed = mockTaskDispatchReports.reduce((sum, report) => sum + report.failedCount, 0)
  const totalPending = mockTaskDispatchReports.reduce((sum, report) => sum + report.pendingCount, 0)

  return {
    total,
    taskCount,
    configCount,
    policyCount,
    highPriorityCount,
    mediumPriorityCount,
    lowPriorityCount,
    averageProgress: Math.round(averageProgress),
    totalHosts,
    totalSuccess,
    totalFailed,
    totalPending,
    overallSuccessRate: totalHosts > 0 ? Math.round((totalSuccess / totalHosts) * 100) : 0,
  }
}

// 获取正在进行中的任务（进度 < 100%）
export const getInProgressTasks = (): TaskDispatchReport[] => {
  return mockTaskDispatchReports.filter((report) => report.overallProgress < 100)
}

// 获取已完成的任务（进度 = 100%）
export const getCompletedTasks = (): TaskDispatchReport[] => {
  return mockTaskDispatchReports.filter((report) => report.overallProgress === 100)
}

// 获取失败任务（有失败主机）
export const getTasksWithFailures = (): TaskDispatchReport[] => {
  return mockTaskDispatchReports.filter((report) => report.failedCount > 0)
}

export default mockTaskDispatchReports
