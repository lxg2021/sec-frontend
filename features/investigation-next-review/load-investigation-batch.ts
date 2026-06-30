import fs from "node:fs/promises"
import path from "node:path"
import { parse } from "yaml"

import type {
  InvestigationBatchReview,
  InvestigationCasePlan,
  InvestigationCaseTriggeredRule,
  InvestigationCollectionTarget,
  InvestigationLanguage,
  InvestigationReviewIssue,
  InvestigationRuleReview,
  InvestigationTemplate,
} from "@/features/investigation-next-review/types"

const INVESTIGATION_ROOT = "D:\\coding\\sec-server\\bin\\conf\\investigation"

type ParsedFile = {
  fileName: string
  baseName: string
  language: InvestigationLanguage
  template: InvestigationTemplate
}

function normalizeBatchName(value?: string | string[] | null) {
  const raw = Array.isArray(value) ? value[0] : value
  const normalized = raw?.trim()

  return normalized ? path.basename(normalized) : ""
}

function templateBaseName(fileName: string) {
  return fileName
    .replace(/\.next\.zh-CN\.yml$/i, "")
    .replace(/\.next\.yml$/i, "")
}

function templateLanguage(fileName: string): InvestigationLanguage {
  return /\.zh-CN\.yml$/i.test(fileName) ? "zh-CN" : "en"
}

function isInvestigationTemplate(fileName: string) {
  return /\.next(\.zh-CN)?\.yml$/i.test(fileName)
}

async function listAvailableBatches() {
  try {
    const entries = await fs.readdir(INVESTIGATION_ROOT, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("next_ai_collection"))
      .map((entry) => entry.name)
      .sort()
  } catch {
    return []
  }
}

function allTargets(template?: InvestigationTemplate) {
  return (template?.question_plan ?? []).flatMap((question) => question.collection_targets ?? [])
}

function targetKey(target: InvestigationCollectionTarget) {
  return `${target.type ?? ""}\u0000${target.path ?? ""}`.toLowerCase()
}

function duplicateTargetCount(targets: InvestigationCollectionTarget[]) {
  const seen = new Set<string>()
  let duplicates = 0

  for (const target of targets) {
    const key = targetKey(target)
    if (!target.type || !target.path) {
      continue
    }
    if (seen.has(key)) {
      duplicates += 1
      continue
    }
    seen.add(key)
  }

  return duplicates
}

function isBadEventLogPath(target: InvestigationCollectionTarget) {
  if (target.type !== "event_log") {
    return false
  }

  const targetPath = target.path ?? ""
  return !/\\winevt\\logs\\/i.test(targetPath) || !/\.evtx$/i.test(targetPath)
}

function buildIssues(rule: InvestigationRuleReview, template?: InvestigationTemplate) {
  const issues: InvestigationReviewIssue[] = []
  const questionCount = template?.question_plan?.length ?? 0

  if (!rule.templates.en) {
    issues.push({ severity: "error", message: "缺少英文模板" })
  }

  if (!rule.templates["zh-CN"]) {
    issues.push({ severity: "error", message: "缺少中文模板" })
  }

  if (questionCount > 14) {
    issues.push({ severity: "error", message: `调查问题 ${questionCount} 个，超过硬上限 14 个` })
  } else if (questionCount < 6) {
    issues.push({ severity: "warning", message: `调查问题只有 ${questionCount} 个，需要确认是否覆盖核心证据` })
  }

  if (rule.stats.duplicateTargetCount > 0) {
    issues.push({ severity: "warning", message: `存在 ${rule.stats.duplicateTargetCount} 个重复采集目标` })
  }

  if (rule.stats.badEventLogPathCount > 0) {
    issues.push({ severity: "error", message: `存在 ${rule.stats.badEventLogPathCount} 个不可操作的事件日志路径` })
  }

  return issues
}

function buildRuleReview(baseName: string, files: ParsedFile[]): InvestigationRuleReview {
  const templates: InvestigationRuleReview["templates"] = {}
  const fileNames: InvestigationRuleReview["files"] = {}

  for (const file of files) {
    templates[file.language] = file.template
    if (file.language === "zh-CN") {
      fileNames.zhCN = file.fileName
    } else {
      fileNames.en = file.fileName
    }
  }

  const displayTemplate = templates["zh-CN"] ?? templates.en
  const targets = allTargets(displayTemplate)
  const rule: InvestigationRuleReview = {
    key: baseName,
    baseName,
    files: fileNames,
    templates,
    stats: {
      questionCount: displayTemplate?.question_plan?.length ?? 0,
      collectionTargetCount: targets.length,
      duplicateTargetCount: duplicateTargetCount(targets),
      badEventLogPathCount: targets.filter(isBadEventLogPath).length,
    },
    issues: [],
  }

  rule.issues = buildIssues(rule, displayTemplate)
  return rule
}

async function loadBatchRules(batchName: string): Promise<InvestigationRuleReview[]> {
  const batchPath = path.join(INVESTIGATION_ROOT, batchName)
  let fileNames: string[] = []
  try {
    fileNames = await fs.readdir(batchPath)
  } catch {
    return []
  }

  const parsedFiles = await Promise.all(
    fileNames
      .filter(isInvestigationTemplate)
      .sort()
      .map(async (fileName): Promise<ParsedFile> => {
        const raw = await fs.readFile(path.join(batchPath, fileName), "utf8")
        return {
          fileName,
          baseName: templateBaseName(fileName),
          language: templateLanguage(fileName),
          template: parse(raw) as InvestigationTemplate,
        }
      }),
  )

  const byBaseName = new Map<string, ParsedFile[]>()
  for (const file of parsedFiles) {
    byBaseName.set(file.baseName, [...(byBaseName.get(file.baseName) ?? []), file])
  }

  return [...byBaseName.entries()].map(([baseName, files]) => buildRuleReview(baseName, files))
}

function stableHash(value: string) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0)
}

function pickTriggeredRules(caseId: string, rules: InvestigationRuleReview[]) {
  if (rules.length <= 5) return rules

  const hash = stableHash(caseId || "default-case")
  const count = 3 + (hash % 3)
  const picked: InvestigationRuleReview[] = []
  const used = new Set<string>()
  let cursor = hash % rules.length
  const step = 17

  while (picked.length < count && used.size < rules.length) {
    const rule = rules[cursor % rules.length]
    cursor += step
    if (!rule || used.has(rule.key)) continue
    used.add(rule.key)
    picked.push(rule)
  }

  return picked
}

function buildTriggeredRule(
  caseId: string,
  rule: InvestigationRuleReview,
  index: number,
): InvestigationCaseTriggeredRule {
  const template = rule.templates["zh-CN"] ?? rule.templates.en
  const hash = stableHash(`${caseId}:${rule.key}`)
  const triggerCount = 1 + (hash % 5)
  const minute = 10 + index * 6

  return {
    ruleKey: rule.key,
    ruleId: template?.source_rule?.id,
    title: template?.source_rule?.title ?? rule.baseName,
    severity: index === 0 ? "high" : index === 1 ? "medium" : "low",
    triggerCount,
    firstSeen: `2026-06-29T14:${String(minute).padStart(2, "0")}:03+08:00`,
    lastSeen: `2026-06-29T14:${String(minute + 3).padStart(2, "0")}:21+08:00`,
    context: {
      tenantId: "default",
      agentId: `AGT-${23 + index}`,
      sourceTable: "sensor.process_create",
      uniqueId: `${caseId}:${rule.key}`,
      attackMark: rule.baseName,
      processGuid: `{8f31d94c-95a4-4d69-9a6c-${String(hash).slice(0, 12).padStart(12, "0")}}`,
    },
  }
}

export async function loadInvestigationCasePlan({
  batch,
  caseId,
}: {
  batch?: string | string[] | null
  caseId?: string | string[] | null
}): Promise<{ batch: InvestigationBatchReview; casePlan?: InvestigationCasePlan }> {
  const availableBatches = await listAvailableBatches()
  const requestedBatchName = normalizeBatchName(batch)
  const sourceBatchNames = requestedBatchName
    ? [requestedBatchName]
    : availableBatches

  const allRulesByKey = new Map<string, InvestigationRuleReview>()
  for (const batchName of sourceBatchNames) {
    const rules = await loadBatchRules(batchName)
    for (const rule of rules) {
      allRulesByKey.set(rule.key, rule)
    }
  }

  const allRules = [...allRulesByKey.values()].sort((a, b) => a.key.localeCompare(b.key))
  if (allRules.length === 0) {
    return {
      batch: {
        batchName: requestedBatchName || "case-runtime",
        batchPath: INVESTIGATION_ROOT,
        availableBatches,
        rules: [],
      },
      casePlan: undefined,
    }
  }

  const normalizedCaseId = (Array.isArray(caseId) ? caseId[0] : caseId)?.trim() || "CASE-20260629-000184"
  const triggeredRules = pickTriggeredRules(normalizedCaseId, allRules)
  const casePlan: InvestigationCasePlan = {
    caseId: normalizedCaseId,
    planId: `plan_${normalizedCaseId.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase()}`,
    timeWindowStart: "2026-06-29T14:03:21+08:00",
    timeWindowEnd: "2026-06-29T14:48:21+08:00",
    timezone: "Asia/Shanghai",
    triggeredRules: triggeredRules.map((rule, index) => buildTriggeredRule(normalizedCaseId, rule, index)),
  }

  return {
    batch: {
      batchName: requestedBatchName || `case:${normalizedCaseId}`,
      batchPath: INVESTIGATION_ROOT,
      availableBatches,
      rules: triggeredRules,
    },
    casePlan,
  }
}

export async function loadInvestigationBatch(
  batch?: string | string[] | null,
): Promise<InvestigationBatchReview> {
  const availableBatches = await listAvailableBatches()
  const requestedBatchName = normalizeBatchName(batch)
  const batchName = requestedBatchName || availableBatches[availableBatches.length - 1] || "next"
  const batchPath = path.join(INVESTIGATION_ROOT, batchName)

  let fileNames: string[] = []
  try {
    fileNames = await fs.readdir(batchPath)
  } catch {
    return {
      batchName,
      batchPath,
      availableBatches,
      rules: [],
    }
  }

  const parsedFiles = await Promise.all(
    fileNames
      .filter(isInvestigationTemplate)
      .sort()
      .map(async (fileName): Promise<ParsedFile> => {
        const raw = await fs.readFile(path.join(batchPath, fileName), "utf8")
        return {
          fileName,
          baseName: templateBaseName(fileName),
          language: templateLanguage(fileName),
          template: parse(raw) as InvestigationTemplate,
        }
      }),
  )

  const byBaseName = new Map<string, ParsedFile[]>()
  for (const file of parsedFiles) {
    byBaseName.set(file.baseName, [...(byBaseName.get(file.baseName) ?? []), file])
  }

  return {
    batchName,
    batchPath,
    availableBatches,
    rules: [...byBaseName.entries()].map(([baseName, files]) => buildRuleReview(baseName, files)),
  }
}
