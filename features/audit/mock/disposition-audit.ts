// mock-disposition-audit.ts
import type { DispositionAudit, DispositionActionType } from "@/features/audit/types"

export const mockDispositionAudits: DispositionAudit[] = [
  {
    // 基础审计字段
    id: "host-001",
    name: "WIN-PC-001",
    triggeredAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 83000).toISOString(),
    severity: "HIGH",
    status: "SUCCESS",
    ruleId: "rule-malware-001",
    ruleName: "恶意软件检测与处置",
    message: "自动检测并隔离恶意文件",
    tags: ["自动处置", "恶意软件", "高优先级"],

    // 处置特定字段
    auditType: "DISPOSITION",
    actionType: "ISOLATE",
    executionSource: "ENDPOINT",
    handledBy: "system",

    // 处置详情 - 文件隔离
    details: {
      targetType: "FILE",
      filePath: "C:\\Windows\\System32\\malicious.exe",
      fileName: "malicious.exe",
      fileHash: "a1b2c3d4e5f678901234567890123456789012345",
      fileSize: 2621440,
      fileSizeHuman: "2.5 MB",
      threatType: "Trojan",
      threatName: "Win32/Trojan.Generic",
      quarantinePath: "C:\\Quarantine\\malicious.exe_20240120100123",
      originalPath: "C:\\Windows\\System32\\malicious.exe",
      isolationTime: new Date(Date.now() - 4 * 60 * 60 * 1000 + 83000).toISOString(),
      backupCreated: true,
      detectionMethod: "Signature+Heuristic",
      confidence: "HIGH",
    },
  },
  {
    id: "host-002",
    name: "SRV-DB-002",
    triggeredAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 5000).toISOString(),
    severity: "CRITICAL",
    status: "SUCCESS",
    ruleId: "rule-mining-002",
    ruleName: "挖矿程序检测",
    message: "检测到挖矿程序，已自动终止进程",
    tags: ["挖矿程序", "资源滥用", "严重威胁"],

    auditType: "DISPOSITION",
    actionType: "TERMINATE",
    executionSource: "HIDS",
    handledBy: "system",

    // 处置详情 - 进程终止
    details: {
      targetType: "PROCESS",
      processName: "xmrig.exe",
      processId: 1234,
      parentProcess: "explorer.exe",
      parentProcessId: 567,
      commandLine: "xmrig.exe --mining --pool xmr.pool.com:8080 --user wallet123",
      memoryUsage: 536870912,
      startTime: "2024-01-20T09:50:00Z",
      userName: "SYSTEM",
      terminationReason: "Suspicious mining activity detected",
      networkConnections: [
        {
          remoteAddress: "45.76.123.89",
          remotePort: 8080,
          protocol: "TCP",
        },
      ],
    },
  },
  {
    id: "host-003",
    name: "WS-USER-003",
    triggeredAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 10 * 60 * 60 * 1000 + 1000).toISOString(),
    severity: "HIGH",
    status: "FAILED",
    ruleId: "rule-c2-003",
    ruleName: "C2通信阻断",
    message: "网络连接阻断失败：权限不足",
    tags: ["C2通信", "网络攻击"],

    auditType: "DISPOSITION",
    actionType: "DISCONNECT",
    executionSource: "FIREWALL",
    handledBy: "system",

    // 处置详情 - 连接阻断
    details: {
      targetType: "NETWORK",
      localAddress: "192.168.1.100",
      localPort: 54321,
      remoteAddress: "185.243.112.34",
      remotePort: 443,
      protocol: "TCP",
      processName: "malware_service.exe",
      processId: 2345,
      connectionState: "ESTABLISHED",
      bytesSent: 1048576,
      bytesReceived: 524288,
      blockDirection: "OUTBOUND",
      threatCategory: "C2 Communication",
      failureReason: "Insufficient firewall permissions",
      duration: "00:05:23",
    },
  },
  {
    id: "host-004",
    name: "WIN-DEV-004",
    triggeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    severity: "MEDIUM",
    status: "SUCCESS",
    ruleId: "rule-macro-004",
    ruleName: "恶意宏文件拦截",
    message: "检测到可疑宏文件，已阻止下载",
    tags: ["宏病毒", "文档安全"],

    auditType: "DISPOSITION",
    actionType: "QUARANTINE",
    executionSource: "ENDPOINT",
    handledBy: "system",

    // 处置详情 - 文件拦截
    details: {
      targetType: "FILE",
      filePath: "C:\\Users\\john\\Downloads\\invoice.doc",
      fileName: "invoice.doc",
      fileType: "DOCUMENT",
      fileHash: "b2c3d4e5f678901234567890123456789012345a1",
      fileSize: 3145728,
      fileSizeHuman: "3 MB",
      blockReason: "Suspicious macro content detected",
      policyName: "Document Security Policy",
      ruleTriggered: "MacroDetection",
      userAction: "BLOCKED",
      attemptTime: "2024-01-20T11:15:00Z",
      downloadSource: "http://malicious-site.com/invoice.doc",
      user: "john",
      scanResult: "Malicious macros identified",
    },
  },
  {
    id: "host-005",
    name: "SRV-WEB-005",
    triggeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30000).toISOString(),
    severity: "HIGH",
    status: "SUCCESS",
    ruleId: "rule-ransomware-005",
    ruleName: "勒索软件防护",
    message: "检测到勒索软件行为，文件已隔离",
    tags: ["勒索软件", "文件保护"],

    auditType: "DISPOSITION",
    actionType: "ISOLATE",
    executionSource: "ENDPOINT",
    handledBy: "admin",

    // 处置详情 - 文件隔离（勒索软件）
    details: {
      targetType: "FILE",
      filePath: "C:\\Data\\important.docx",
      fileName: "important.docx",
      fileHash: "c3d4e5f678901234567890123456789012345a1b2",
      fileSize: 1048576,
      threatType: "Ransomware",
      threatName: "CryptoLocker",
      quarantinePath: "C:\\Quarantine\\important.docx_20240120120030",
      originalPath: "C:\\Data\\important.docx",
      isolationTime: "2024-01-20T12:00:30Z",
      backupCreated: true,
      encryptionAttempt: true,
      suspiciousActivity: "Mass file encryption detected",
    },
  },
  {
    id: "host-006",
    name: "WIN-TEST-006",
    triggeredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2000).toISOString(),
    severity: "MEDIUM",
    status: "SUCCESS",
    ruleId: "rule-phishing-006",
    ruleName: "钓鱼软件终止",
    message: "检测到钓鱼软件进程，已终止",
    tags: ["钓鱼软件", "社会工程"],

    auditType: "DISPOSITION",
    actionType: "TERMINATE",
    executionSource: "ENDPOINT",
    handledBy: "system",

    // 处置详情 - 进程终止（钓鱼软件）
    details: {
      targetType: "PROCESS",
      processName: "fake_browser.exe",
      processId: 3456,
      parentProcess: "userinit.exe",
      parentProcessId: 789,
      commandLine: "fake_browser.exe --phishing --url http://fake-bank.com",
      memoryUsage: 268435456,
      startTime: "2024-01-20T13:40:00Z",
      userName: "testuser",
      terminationReason: "Phishing software detected",
      browserHijack: true,
      fakeUrl: "http://fake-bank.com",
    },
  },
  {
    id: "host-007",
    name: "SRV-FILE-007",
    triggeredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 1000).toISOString(),
    severity: "HIGH",
    status: "SUCCESS",
    ruleId: "rule-botnet-007",
    ruleName: "僵尸网络连接阻断",
    message: "检测到僵尸网络通信，连接已阻断",
    tags: ["僵尸网络", "DDoS"],

    auditType: "DISPOSITION",
    actionType: "DISCONNECT",
    executionSource: "FIREWALL",
    handledBy: "system",

    // 处置详情 - 连接阻断（僵尸网络）
    details: {
      targetType: "NETWORK",
      localAddress: "192.168.1.200",
      localPort: 12345,
      remoteAddress: "198.51.100.23",
      remotePort: 6667,
      protocol: "TCP",
      processName: "bot_client.exe",
      processId: 4567,
      connectionState: "ESTABLISHED",
      bytesSent: 2097152,
      bytesReceived: 1048576,
      blockDirection: "OUTBOUND",
      threatCategory: "Botnet Communication",
      ircChannel: "#botnet",
      ddosPotential: true,
    },
  },
  {
    id: "host-008",
    name: "WIN-USER-008",
    triggeredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    severity: "LOW",
    status: "SUCCESS",
    ruleId: "rule-pua-008",
    ruleName: "潜在不受欢迎程序拦截",
    message: "检测到PUA程序，下载已阻止",
    tags: ["PUA", "广告软件"],

    auditType: "DISPOSITION",
    actionType: "QUARANTINE",
    executionSource: "ENDPOINT",
    handledBy: "system",

    // 处置详情 - 文件拦截（PUA）
    details: {
      targetType: "FILE",
      filePath: "C:\\Users\\alice\\Downloads\\toolbar_setup.exe",
      fileName: "toolbar_setup.exe",
      fileType: "EXECUTABLE",
      fileHash: "d4e5f678901234567890123456789012345a1b2c3",
      fileSize: 5242880,
      fileSizeHuman: "5 MB",
      blockReason: "Potentially Unwanted Application",
      policyName: "PUA Blocking Policy",
      ruleTriggered: "PUA Detection",
      userAction: "BLOCKED",
      attemptTime: "2024-01-20T15:10:00Z",
      downloadSource: "http://free-toolbar.com/setup.exe",
      user: "alice",
      puaCategory: "Adware",
      reputation: "LOW",
    },
  },
  {
    id: "host-009",
    name: "SRV-MAIL-009",
    triggeredAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 25000).toISOString(),
    severity: "CRITICAL",
    status: "SUCCESS",
    ruleId: "rule-backdoor-009",
    ruleName: "后门程序清除",
    message: "检测到后门程序，文件已隔离，进程已终止",
    tags: ["后门程序", "持久化威胁"],

    auditType: "DISPOSITION",
    actionType: "ISOLATE",
    executionSource: "ENDPOINT",
    handledBy: "security_team",

    // 处置详情 - 文件隔离（后门程序）
    details: {
      targetType: "FILE",
      filePath: "C:\\Windows\\Temp\\backdoor.dll",
      fileName: "backdoor.dll",
      fileHash: "e5f678901234567890123456789012345a1b2c3d4",
      fileSize: 1572864,
      threatType: "Backdoor",
      threatName: "Win32/Backdoor.Agent",
      quarantinePath: "C:\\Quarantine\\backdoor.dll_20240120160525",
      originalPath: "C:\\Windows\\Temp\\backdoor.dll",
      isolationTime: "2024-01-20T16:05:25Z",
      backupCreated: true,
      persistence: true,
      startupLocation: "Registry Run Key",
      networkCapability: true,
    },
  },
  {
    id: "host-010",
    name: "WIN-GAME-010",
    triggeredAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000 + 3000).toISOString(),
    severity: "MEDIUM",
    status: "FAILED",
    ruleId: "rule-cheat-010",
    ruleName: "游戏作弊软件终止",
    message: "游戏作弊软件终止失败：进程保护",
    tags: ["游戏作弊", "反作弊"],

    auditType: "DISPOSITION",
    actionType: "TERMINATE",
    executionSource: "ENDPOINT",
    handledBy: "system",

    // 处置详情 - 进程终止失败
    details: {
      targetType: "PROCESS",
      processName: "game_cheat.exe",
      processId: 5678,
      parentProcess: "steam.exe",
      parentProcessId: 123,
      commandLine: "game_cheat.exe --aimbot --wallhack",
      cpuUsage: 15.2,
      memoryUsage: 134217728,
      memoryUsageHuman: "128 MB",
      startTime: "2024-01-20T17:25:00Z",
      userName: "gamer",
      terminationReason: "Game cheating software detected",
      failureReason: "Process is protected by anti-tampering mechanism",
      protectionLevel: "HIGH",
      retryAttempts: 3,
    },
  },
]

// 按处置类型分类的辅助函数
export const getDispositionAuditsByType = (actionType: DispositionActionType): DispositionAudit[] => {
  return mockDispositionAudits.filter((audit) => audit.actionType === actionType)
}

// 按严重等级分类的辅助函数
export const getDispositionAuditsBySeverity = (severity: string): DispositionAudit[] => {
  return mockDispositionAudits.filter((audit) => audit.severity === severity)
}

// 按状态分类的辅助函数
export const getDispositionAuditsByStatus = (status: string): DispositionAudit[] => {
  return mockDispositionAudits.filter((audit) => audit.status === status)
}

// 按处理人分类的辅助函数
export const getDispositionAuditsByHandler = (handler: string): DispositionAudit[] => {
  return mockDispositionAudits.filter((audit) => audit.handledBy === handler)
}

// 统计信息
export const getDispositionStats = () => {
  const total = mockDispositionAudits.length
  const success = mockDispositionAudits.filter((audit) => audit.status === "SUCCESS").length
  const failed = mockDispositionAudits.filter((audit) => audit.status === "FAILED").length
  const successRate = total > 0 ? (success / total) * 100 : 0

  // 按处置类型统计
  const isolateCount = mockDispositionAudits.filter((audit) => audit.actionType === "ISOLATE").length
  const terminateCount = mockDispositionAudits.filter((audit) => audit.actionType === "TERMINATE").length
  const disconnectCount = mockDispositionAudits.filter((audit) => audit.actionType === "DISCONNECT").length
  const quarantineCount = mockDispositionAudits.filter((audit) => audit.actionType === "QUARANTINE").length

  // 按严重等级统计
  const criticalCount = mockDispositionAudits.filter(
    (audit) => audit.severity === "HIGH" || audit.severity === "CRITICAL",
  ).length

  return {
    total,
    success,
    failed,
    successRate,
    isolateCount,
    terminateCount,
    disconnectCount,
    quarantineCount,
    criticalCount,
  }
}

export default mockDispositionAudits
