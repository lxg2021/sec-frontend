import fs from "node:fs/promises"
import path from "node:path"
import { parse } from "yaml"

import type {
  InvestigationBatchReview,
  InvestigationCollectionTarget,
  InvestigationLanguage,
  InvestigationReviewIssue,
  InvestigationRuleReview,
  InvestigationTemplate,
} from "@/features/investigation-next-review/types"

const INVESTIGATION_ROOT = "D:\\coding\\sec-server\\bin\\conf\\investigation"
const DEFAULT_BATCH = "next_ai_collection_v9_batch01_5"

type ParsedFile = {
  fileName: string
  baseName: string
  language: InvestigationLanguage
  template: InvestigationTemplate
}

function normalizeBatchName(value?: string | string[] | null) {
  const raw = Array.isArray(value) ? value[0] : value
  const normalized = raw?.trim()

  if (!normalized) {
    return DEFAULT_BATCH
  }

  return path.basename(normalized)
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

export async function loadInvestigationBatch(
  batch?: string | string[] | null,
): Promise<InvestigationBatchReview> {
  const batchName = normalizeBatchName(batch)
  const batchPath = path.join(INVESTIGATION_ROOT, batchName)
  const availableBatches = await listAvailableBatches()

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
