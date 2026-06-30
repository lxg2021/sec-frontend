"use client"

import * as React from "react"
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Badge,
  Body1,
  Body1Strong,
  Button,
  Caption1,
  Divider,
  Field,
  FluentProvider,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Subtitle1,
  Subtitle2,
  Title2,
  Title3,
  ToggleButton,
  Tooltip,
  makeStyles,
  tokens,
  typographyStyles,
  webDarkTheme,
  webLightTheme,
} from "@fluentui/react-components"
import {
  CheckmarkCircle20Regular,
  ClipboardTask24Regular,
  Code24Regular,
  Database24Regular,
  DocumentSearch24Regular,
  Info20Regular,
  Lightbulb24Regular,
  Play24Regular,
  Search24Regular,
  ShieldKeyhole24Regular,
  Target24Regular,
  Warning20Regular,
  WeatherMoon24Regular,
  WeatherSunny24Regular,
} from "@fluentui/react-icons"

import {
  executeInvestigationQuestionQuery,
  refreshInvestigationQuestionContract,
  type InvestigationExecutionContextInput,
  type InvestigationQueryConclusion,
  type InvestigationQuestionExecutionData,
} from "@/features/investigation-next-review/api"
import type {
  InvestigationBatchReview,
  InvestigationCollectionTarget,
  InvestigationLanguage,
  InvestigationRuleReview,
  InvestigationTemplate,
} from "@/features/investigation-next-review/types"

type Confidence = "high" | "medium" | "low"
type ThemeMode = "light" | "dark"
type ExecutionAction = "refresh" | "execute"

type ExecutionState = {
  loading?: ExecutionAction
  data?: InvestigationQuestionExecutionData | null
  error?: string
}

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground1,
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXXL}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  headerBrand: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    color: tokens.colorBrandForeground1,
  },
  headerControls: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
  },
  main: {
    width: "min(1140px, 100%)",
    marginLeft: "auto",
    marginRight: "auto",
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXXL} ${tokens.spacingVerticalXXXL}`,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXL,
  },
  selectorPanel: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    padding: tokens.spacingHorizontalL,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  selectorRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
  },
  selectorLabel: {
    minWidth: "44px",
    color: tokens.colorNeutralForeground3,
  },
  hero: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalXS,
  },
  metaItem: {
    display: "flex",
    flexDirection: "column",
    minWidth: "150px",
  },
  metaLabel: {
    color: tokens.colorNeutralForeground3,
  },
  metaValue: {
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyMonospace,
    overflowWrap: "anywhere",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  surface: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    padding: tokens.spacingHorizontalL,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  coreQuestion: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    borderRadius: tokens.borderRadiusLarge,
    borderLeft: `${tokens.strokeWidthThicker} solid ${tokens.colorBrandStroke1}`,
    padding: tokens.spacingHorizontalL,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  evidenceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: tokens.spacingHorizontalL,
  },
  list: {
    margin: 0,
    paddingLeft: 0,
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  listItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
  },
  listIcon: {
    flexShrink: 0,
    marginTop: "2px",
  },
  successIcon: {
    color: tokens.colorStatusSuccessForeground1,
  },
  warningIcon: {
    color: tokens.colorStatusWarningForeground1,
  },
  brandIcon: {
    color: tokens.colorBrandForeground1,
  },
  panelInner: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
  },
  accordionHeaderText: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  stepIndex: {
    ...typographyStyles.caption1Strong,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "24px",
    height: "24px",
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    flexShrink: 0,
  },
  gapBlock: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  targetBlock: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    padding: tokens.spacingHorizontalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  targetItem: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    paddingTop: tokens.spacingVerticalS,
  },
  targetFirstItem: {
    borderTop: "none",
    paddingTop: 0,
  },
  targetPath: {
    fontFamily: tokens.fontFamilyMonospace,
    color: tokens.colorNeutralForeground1,
    overflowWrap: "anywhere",
  },
  contextGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
  questionActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
  },
  resultBlock: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    padding: tokens.spacingHorizontalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  conclusionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
  },
  conclusionStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
  statBox: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    padding: tokens.spacingHorizontalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  sourceList: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
  },
  jsonPanel: {
    borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    paddingTop: tokens.spacingVerticalS,
  },
  resultPre: {
    margin: 0,
    maxHeight: "260px",
    overflow: "auto",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
  },
  artifactCode: {
    fontFamily: tokens.fontFamilyMonospace,
    color: tokens.colorBrandForeground1,
  },
})

const confidenceMeta: Record<Confidence, { label: string; color: "success" | "warning" | "danger" }> = {
  high: { label: "高置信度", color: "success" },
  medium: { label: "中等置信度", color: "warning" },
  low: { label: "低置信度", color: "danger" },
}

const categoryLabels: Record<string, string> = {
  triage: "初步研判",
  registry: "注册表",
  policy: "策略",
  defense_evasion: "防御规避",
  process: "进程",
  scope: "影响范围",
  closure: "闭环",
  review: "复核",
  evidence: "证据",
  timeline: "时间线",
  exposure: "暴露面",
  configuration: "配置",
  attribution: "归因",
  identity: "身份",
}

const statusMeta: Record<string, { label: string; color: "success" | "warning" | "danger" | "informative" | "brand" }> = {
  evidence_found: { label: "已命中证据", color: "success" },
  partial_evidence: { label: "部分证据", color: "warning" },
  no_rows: { label: "未命中数据", color: "informative" },
  no_evidence: { label: "未命中数据", color: "informative" },
  blocked: { label: "缺少上下文", color: "danger" },
  needs_collection: { label: "需要补采", color: "warning" },
}

function pickTemplate(rule: InvestigationRuleReview, language: InvestigationLanguage) {
  return rule.templates[language] ?? rule.templates["zh-CN"] ?? rule.templates.en
}

function confidenceOf(value?: string): Confidence {
  return value === "medium" || value === "low" ? value : "high"
}

function textList(items?: string[]) {
  return items?.filter(Boolean) ?? []
}

function pathText(path?: string) {
  return path?.trim() || "<missing path>"
}

function targetKey(target: InvestigationCollectionTarget) {
  return `${target.type ?? ""}\u0000${pathText(target.path)}`.toLowerCase()
}

function duplicateTargetKeys(template?: InvestigationTemplate) {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const question of template?.question_plan ?? []) {
    for (const target of question.collection_targets ?? []) {
      const key = targetKey(target)
      if (seen.has(key)) {
        duplicates.add(key)
      } else {
        seen.add(key)
      }
    }
  }

  return duplicates
}

function onBatchChange(batchName: string) {
  const url = new URL(window.location.href)
  url.searchParams.set("batch", batchName)
  window.location.href = url.toString()
}

function prettyJSON(raw?: string) {
  if (!raw) return ""
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

function parseJSON<T>(raw?: string): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function executionStateKey(questionIndex: number) {
  return String(questionIndex)
}

function normalizedConclusion(data?: InvestigationQuestionExecutionData | null) {
  if (!data) return null
  if (data.conclusion) return data.conclusion
  const result = parseJSON<{ conclusion?: InvestigationQueryConclusion }>(data.execution_result_json)
  return result?.conclusion ?? parseJSON<InvestigationQueryConclusion>(data.conclusion_json) ?? null
}

function evidenceSources(conclusion?: InvestigationQueryConclusion | null) {
  const raw = conclusion?.evidence_by_source
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.filter((item) => item.source)
  }
  return Object.entries(raw).map(([source, count]) => ({ source, count }))
}

function BulletList({
  items,
  variant,
}: {
  items: string[]
  variant: "success" | "warning" | "brand"
}) {
  const styles = useStyles()
  const iconClass =
    variant === "success"
      ? styles.successIcon
      : variant === "warning"
        ? styles.warningIcon
        : styles.brandIcon

  if (items.length === 0) return <Caption1 className={styles.metaLabel}>暂无</Caption1>

  return (
    <ul className={styles.list}>
      {items.map((item, i) => (
        <li key={`${i}-${item}`} className={styles.listItem}>
          <span className={`${styles.listIcon} ${iconClass}`}>
            {variant === "warning" ? (
              <Warning20Regular />
            ) : variant === "brand" ? (
              <Info20Regular />
            ) : (
              <CheckmarkCircle20Regular />
            )}
          </span>
          <Body1>{item}</Body1>
        </li>
      ))}
    </ul>
  )
}

function CollectionTargets({
  targets,
  duplicateKeys,
}: {
  targets?: InvestigationCollectionTarget[]
  duplicateKeys: Set<string>
}) {
  const styles = useStyles()
  const normalized = targets ?? []

  if (normalized.length === 0) return null

  return (
    <div className={styles.targetBlock}>
      <span className={styles.accordionHeaderText}>
        <DocumentSearch24Regular className={styles.brandIcon} />
        <Caption1 className={styles.metaLabel}>远程取证采集目标</Caption1>
        <Badge appearance="outline" color="informative" size="small">
          {normalized.length}
        </Badge>
      </span>
      {normalized.map((target, index) => {
        const duplicate = duplicateKeys.has(targetKey(target))
        return (
          <div
            key={`${target.id ?? index}-${target.path ?? ""}`}
            className={`${styles.targetItem} ${index === 0 ? styles.targetFirstItem : ""}`}
          >
            <span className={styles.accordionHeaderText}>
              <Badge appearance="tint" color="brand" size="small">
                {target.type ?? "unknown"}
              </Badge>
              {duplicate ? (
                <Badge appearance="filled" color="warning" size="small">
                  重复
                </Badge>
              ) : null}
              {typeof target.recursive === "boolean" ? (
                <Badge appearance="outline" color="informative" size="small">
                  recursive: {String(target.recursive)}
                </Badge>
              ) : null}
            </span>
            <Caption1 className={styles.targetPath}>{pathText(target.path)}</Caption1>
            {target.purpose ? <Body1>{target.purpose}</Body1> : null}
          </div>
        )
      })}
    </div>
  )
}

function ExecutionContextForm({
  value,
  onChange,
}: {
  value: InvestigationExecutionContextInput
  onChange: (next: InvestigationExecutionContextInput) => void
}) {
  const styles = useStyles()
  const setValue = (key: keyof InvestigationExecutionContextInput, nextValue: string) => {
    onChange({ ...value, [key]: nextValue })
  }

  return (
    <div className={styles.surface}>
      <div className={styles.sectionTitle}>
        <DocumentSearch24Regular className={styles.brandIcon} />
        <Body1Strong>查询执行上下文</Body1Strong>
      </div>
      <div className={styles.contextGrid}>
        <Field label="Plan ID" required>
          <Input value={value.plan_id} onChange={(_, data) => setValue("plan_id", data.value)} />
        </Field>
        <Field label="Tenant ID">
          <Input value={value.tenant_id ?? ""} onChange={(_, data) => setValue("tenant_id", data.value)} />
        </Field>
        <Field label="Agent ID">
          <Input value={value.agent_id ?? ""} onChange={(_, data) => setValue("agent_id", data.value)} />
        </Field>
        <Field label="Time window start">
          <Input value={value.time_window_start ?? ""} onChange={(_, data) => setValue("time_window_start", data.value)} />
        </Field>
        <Field label="Time window end">
          <Input value={value.time_window_end ?? ""} onChange={(_, data) => setValue("time_window_end", data.value)} />
        </Field>
        <Field label="Process GUID">
          <Input value={value.process_guid ?? ""} onChange={(_, data) => setValue("process_guid", data.value)} />
        </Field>
        <Field label="File name">
          <Input value={value.file_name ?? ""} onChange={(_, data) => setValue("file_name", data.value)} />
        </Field>
        <Field label="File MD5">
          <Input value={value.file_md5 ?? ""} onChange={(_, data) => setValue("file_md5", data.value)} />
        </Field>
        <Field label="Registry object name">
          <Input value={value.object_name ?? ""} onChange={(_, data) => setValue("object_name", data.value)} />
        </Field>
        <Field label="URL">
          <Input value={value.url ?? ""} onChange={(_, data) => setValue("url", data.value)} />
        </Field>
        <Field label="Domain">
          <Input value={value.domain ?? ""} onChange={(_, data) => setValue("domain", data.value)} />
        </Field>
        <Field label="Destination IP">
          <Input value={value.destination_ip ?? ""} onChange={(_, data) => setValue("destination_ip", data.value)} />
        </Field>
        <Field label="Source table">
          <Input value={value.source_table ?? ""} onChange={(_, data) => setValue("source_table", data.value)} />
        </Field>
        <Field label="Unique ID">
          <Input value={value.unique_id ?? ""} onChange={(_, data) => setValue("unique_id", data.value)} />
        </Field>
        <Field label="Attack mark">
          <Input value={value.attack_mark ?? ""} onChange={(_, data) => setValue("attack_mark", data.value)} />
        </Field>
      </div>
    </div>
  )
}

function QueryConclusionCard({ conclusion }: { conclusion?: InvestigationQueryConclusion | null }) {
  const styles = useStyles()
  if (!conclusion) return null

  const status = statusMeta[conclusion.status ?? ""] ?? {
    label: conclusion.status || "未知状态",
    color: "informative" as const,
  }
  const sourceItems = evidenceSources(conclusion)
  const evidenceCount = conclusion.evidence_count ?? 0

  return (
    <div className={styles.resultBlock}>
      <div className={styles.conclusionHeader}>
        <span className={styles.sectionTitle}>
          <Database24Regular className={styles.brandIcon} />
          <Body1Strong>{conclusion.display_title || "查询结论"}</Body1Strong>
        </span>
        <span className={styles.badgeRow}>
          <Badge appearance="filled" color={status.color}>
            {status.label}
          </Badge>
          <Badge appearance="outline" color="informative">
            {conclusion.confidence || "none"}
          </Badge>
        </span>
      </div>

      <div className={styles.conclusionStats}>
        <div className={styles.statBox}>
          <Caption1 className={styles.metaLabel}>证据数量</Caption1>
          <Body1Strong>{evidenceCount}</Body1Strong>
        </div>
        <div className={styles.statBox}>
          <Caption1 className={styles.metaLabel}>来源表</Caption1>
          <div className={styles.sourceList}>
            {sourceItems.length > 0 ? (
              sourceItems.map((item) => (
                <Badge key={item.source} appearance="outline" color="brand">
                  {item.source}: {item.count}
                </Badge>
              ))
            ) : (
              <Caption1 className={styles.metaLabel}>暂无</Caption1>
            )}
          </div>
        </div>
      </div>

      <div>
        <Caption1 className={styles.metaLabel}>主要发现</Caption1>
        <BulletList items={textList(conclusion.primary_findings)} variant="success" />
      </div>

      {textList(conclusion.key_entities).length > 0 ? (
        <div>
          <Caption1 className={styles.metaLabel}>关键实体</Caption1>
          <div className={styles.sourceList}>
            {textList(conclusion.key_entities).map((item) => (
              <Badge key={item} appearance="tint" color="informative">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <Caption1 className={styles.metaLabel}>仍需确认</Caption1>
        <BulletList items={textList(conclusion.remaining_gaps)} variant="warning" />
      </div>

      {conclusion.recommended_collection ? (
        <div className={styles.targetBlock}>
          <span className={styles.accordionHeaderText}>
            <DocumentSearch24Regular className={styles.brandIcon} />
            <Body1Strong>建议补充取证</Body1Strong>
            <Badge appearance="outline" color="warning">
              {conclusion.recommended_collection.method || "collection"}
            </Badge>
            {conclusion.recommended_collection.priority ? (
              <Badge appearance="tint" color="warning">
                {conclusion.recommended_collection.priority}
              </Badge>
            ) : null}
          </span>
          {conclusion.recommended_collection.reason ? <Body1>{conclusion.recommended_collection.reason}</Body1> : null}
          <BulletList items={textList(conclusion.recommended_collection.collect)} variant="brand" />
        </div>
      ) : null}
    </div>
  )
}

function QuestionExecutionResult({ state }: { state?: ExecutionState }) {
  const styles = useStyles()
  if (!state?.data && !state?.error) return null

  const conclusion = normalizedConclusion(state.data)

  return (
    <div className={styles.section}>
      {state.error ? (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>执行失败</MessageBarTitle>
            {state.error}
          </MessageBarBody>
        </MessageBar>
      ) : null}
      <QueryConclusionCard conclusion={conclusion} />
      {state.data ? (
        <Accordion collapsible>
          <AccordionItem value="raw-json">
            <AccordionHeader>
              <span className={styles.accordionHeaderText}>
                <Code24Regular className={styles.brandIcon} />
                <Body1Strong>原始执行数据</Body1Strong>
              </span>
            </AccordionHeader>
            <AccordionPanel>
              <div className={styles.jsonPanel}>
                {state.data.execution_contract_json ? (
                  <>
                    <Caption1 className={styles.metaLabel}>Execution contract</Caption1>
                    <pre className={styles.resultPre}>{prettyJSON(state.data.execution_contract_json)}</pre>
                  </>
                ) : null}
                {state.data.execution_result_json ? (
                  <>
                    <Caption1 className={styles.metaLabel}>Execution result</Caption1>
                    <pre className={styles.resultPre}>{prettyJSON(state.data.execution_result_json)}</pre>
                  </>
                ) : null}
              </div>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      ) : null}
    </div>
  )
}

function GuideContent({
  batch,
  rule,
  template,
  language,
  mode,
  setMode,
  setRuleKey,
  setLanguage,
  executionContext,
  setExecutionContext,
}: {
  batch: InvestigationBatchReview
  rule: InvestigationRuleReview
  template?: InvestigationTemplate
  language: InvestigationLanguage
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  setRuleKey: (key: string) => void
  setLanguage: (language: InvestigationLanguage) => void
  executionContext: InvestigationExecutionContextInput
  setExecutionContext: (value: InvestigationExecutionContextInput) => void
}) {
  const styles = useStyles()
  const [executionStates, setExecutionStates] = React.useState<Record<string, ExecutionState>>({})
  const confidence = confidenceMeta[confidenceOf(template?.inferred?.confidence)]
  const questions = template?.question_plan ?? []
  const duplicateKeys = duplicateTargetKeys(template)
  const sourceRule = template?.source_rule
  const attackCore = template?.attack_core
  const issueCount = rule.issues.length

  const runQuestionAction = async (
    action: ExecutionAction,
    questionIndex: number,
    questionId?: string,
  ) => {
    const key = executionStateKey(questionIndex)
    if (!executionContext.plan_id.trim()) {
      setExecutionStates((current) => ({
        ...current,
        [key]: { error: "请先填写 Plan ID。" },
      }))
      return
    }
    setExecutionStates((current) => ({
      ...current,
      [key]: { ...current[key], loading: action, error: undefined },
    }))
    try {
      const data =
        action === "refresh"
          ? await refreshInvestigationQuestionContract({
              context: executionContext,
              questionIndex,
              questionId,
            })
          : await executeInvestigationQuestionQuery({
              context: executionContext,
              questionIndex,
              questionId,
            })
      setExecutionStates((current) => ({
        ...current,
        [key]: { data, loading: undefined },
      }))
    } catch (error) {
      setExecutionStates((current) => ({
        ...current,
        [key]: {
          loading: undefined,
          error: error instanceof Error ? error.message : "请求失败",
        },
      }))
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <ShieldKeyhole24Regular />
          <Subtitle1>安全调查指南</Subtitle1>
        </div>
        <div className={styles.headerControls}>
          <Tooltip content={mode === "light" ? "切换到深色主题" : "切换到浅色主题"} relationship="label">
            <ToggleButton
              checked={mode === "dark"}
              onClick={() => setMode(mode === "light" ? "dark" : "light")}
              icon={mode === "light" ? <WeatherMoon24Regular /> : <WeatherSunny24Regular />}
              appearance="subtle"
              aria-label="切换主题"
            />
          </Tooltip>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.selectorPanel} aria-label="调查指南选择">
          <div className={styles.selectorRow}>
            <Caption1 className={styles.selectorLabel}>规则</Caption1>
            {batch.rules.map((item) => {
              const itemTemplate = item.templates["zh-CN"] ?? item.templates.en
              return (
                <Button
                  key={item.key}
                  size="small"
                  appearance={item.key === rule.key ? "primary" : "secondary"}
                  onClick={() => setRuleKey(item.key)}
                >
                  {itemTemplate?.source_rule?.title ?? item.baseName}
                </Button>
              )
            })}
          </div>
          <div className={styles.selectorRow}>
            <Caption1 className={styles.selectorLabel}>语言</Caption1>
            <Button
              size="small"
              appearance={language === "zh-CN" ? "primary" : "secondary"}
              disabled={!rule.templates["zh-CN"]}
              onClick={() => setLanguage("zh-CN")}
            >
              中文
            </Button>
            <Button
              size="small"
              appearance={language === "en" ? "primary" : "secondary"}
              disabled={!rule.templates.en}
              onClick={() => setLanguage("en")}
            >
              English
            </Button>
          </div>
          {batch.availableBatches.length > 1 ? (
            <div className={styles.selectorRow}>
              <Caption1 className={styles.selectorLabel}>批次</Caption1>
              {batch.availableBatches.slice(-8).map((name) => (
                <Button
                  key={name}
                  size="small"
                  appearance={name === batch.batchName ? "primary" : "secondary"}
                  onClick={() => onBatchChange(name)}
                >
                  {name}
                </Button>
              ))}
            </div>
          ) : null}
        </section>

        <section className={styles.hero}>
          <div className={styles.badgeRow}>
            <Badge appearance="tint" color="brand">
              {attackCore?.type ?? "unknown_core"}
            </Badge>
            <Badge appearance="outline" color="informative">
              {template?.language ?? language}
            </Badge>
            <Badge appearance="filled" color={confidence.color}>
              {confidence.label}
            </Badge>
            <Badge appearance="ghost" color="warning">
              待人工复核
            </Badge>
            {issueCount > 0 ? (
              <Badge appearance="filled" color="warning">
                {issueCount} 条校验提示
              </Badge>
            ) : (
              <Badge appearance="outline" color="success">
                结构校验通过
              </Badge>
            )}
          </div>
          <Title2 as="h1">{sourceRule?.title ?? rule.baseName}</Title2>
          <Body1>{sourceRule?.description ?? "-"}</Body1>
          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <Caption1 className={styles.metaLabel}>规则 ID</Caption1>
              <Caption1 className={styles.metaValue}>{sourceRule?.id ?? "-"}</Caption1>
            </div>
            <div className={styles.metaItem}>
              <Caption1 className={styles.metaLabel}>匹配上下文</Caption1>
              <Caption1 className={styles.metaValue}>{template?.match_context?.target_hint ?? "-"}</Caption1>
            </div>
            <div className={styles.metaItem}>
              <Caption1 className={styles.metaLabel}>Schema 版本</Caption1>
              <Caption1 className={styles.metaValue}>{template?.schema_version ?? "-"}</Caption1>
            </div>
            <div className={styles.metaItem}>
              <Caption1 className={styles.metaLabel}>批次</Caption1>
              <Caption1 className={styles.metaValue}>{batch.batchName}</Caption1>
            </div>
          </div>
        </section>

        <Divider />

        <ExecutionContextForm value={executionContext} onChange={setExecutionContext} />

        <section className={styles.section} aria-labelledby="core-heading">
          <div className={styles.sectionTitle}>
            <Target24Regular className={styles.brandIcon} />
            <Title3 as="h2" id="core-heading">
              攻击核心
            </Title3>
          </div>
          <div className={styles.coreQuestion}>
            <Subtitle2>核心问题</Subtitle2>
            <Body1>{attackCore?.core_question ?? "-"}</Body1>
          </div>
          <div className={styles.surface}>
            <Body1Strong>为什么这是核心</Body1Strong>
            <BulletList items={textList(attackCore?.why_this_core)} variant="brand" />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="evidence-heading">
          <div className={styles.sectionTitle}>
            <DocumentSearch24Regular className={styles.brandIcon} />
            <Title3 as="h2" id="evidence-heading">
              关键证据与准确性
            </Title3>
          </div>
          <div className={styles.evidenceGrid}>
            <div className={styles.surface}>
              <Body1Strong>关键证据</Body1Strong>
              <BulletList items={textList(attackCore?.key_evidence)} variant="success" />
            </div>
            <div className={styles.surface}>
              <div className={styles.sectionTitle}>
                <Lightbulb24Regular className={styles.brandIcon} />
                <Body1Strong>准确性驱动因素</Body1Strong>
              </div>
              <BulletList items={textList(attackCore?.accuracy_drivers)} variant="brand" />
            </div>
          </div>
          <MessageBar intent="warning">
            <MessageBarBody>
              <MessageBarTitle>没有这些证据不能直接下结论</MessageBarTitle>
            </MessageBarBody>
          </MessageBar>
          <div className={styles.surface}>
            <BulletList items={textList(attackCore?.do_not_conclude_without)} variant="warning" />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="confidence-heading">
          <div className={styles.sectionTitle}>
            <Info20Regular className={styles.brandIcon} />
            <Title3 as="h2" id="confidence-heading">
              推断置信度
            </Title3>
          </div>
          <div className={styles.surface}>
            <div className={styles.badgeRow}>
              <Badge appearance="filled" color={confidence.color}>
                {confidence.label}
              </Badge>
            </div>
            <Body1>{template?.inferred?.confidence_reason ?? "-"}</Body1>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="plan-heading">
          <div className={styles.sectionTitle}>
            <ClipboardTask24Regular className={styles.brandIcon} />
            <Title3 as="h2" id="plan-heading">
              调查问题计划
            </Title3>
          </div>
          <Caption1 className={styles.metaLabel}>{`共 ${questions.length} 个调查问题，按顺序展开执行`}</Caption1>
          <Accordion multiple collapsible defaultOpenItems={[questions[0]?.id ?? ""]}>
            {questions.map((question, index) => {
              const state = executionStates[executionStateKey(index)]
              return (
                <AccordionItem key={question.id ?? index} value={question.id ?? String(index)}>
                  <AccordionHeader>
                    <span className={styles.accordionHeaderText}>
                      <span className={styles.stepIndex}>{index + 1}</span>
                      <Body1Strong>{question.title ?? question.id ?? "未命名问题"}</Body1Strong>
                      <Badge appearance="tint" color="informative" size="small">
                        {categoryLabels[question.category ?? ""] ?? question.category ?? "unknown"}
                      </Badge>
                      {(question.collection_targets ?? []).length > 0 ? (
                        <Badge appearance="outline" color="brand" size="small">
                          {(question.collection_targets ?? []).length} 个采集目标
                        </Badge>
                      ) : null}
                    </span>
                  </AccordionHeader>
                  <AccordionPanel>
                    <div className={styles.panelInner}>
                      <div>
                        <Caption1 className={styles.metaLabel}>调查目标</Caption1>
                        <Body1>{question.objective ?? "-"}</Body1>
                      </div>
                      <div className={styles.gapBlock}>
                        <span className={styles.accordionHeaderText}>
                          <Warning20Regular className={styles.warningIcon} />
                          <Caption1 className={styles.metaLabel}>缺失证据</Caption1>
                          <Caption1 className={styles.artifactCode}>{question.gap_when_missing?.artifact ?? "-"}</Caption1>
                        </span>
                        <Body1>{question.gap_when_missing?.message ?? "-"}</Body1>
                      </div>
                      <CollectionTargets targets={question.collection_targets} duplicateKeys={duplicateKeys} />
                      <div className={styles.questionActions}>
                        <Button
                          size="small"
                          appearance="secondary"
                          icon={<Search24Regular />}
                          disabled={state?.loading === "refresh"}
                          onClick={() => runQuestionAction("refresh", index, question.id)}
                        >
                          {state?.loading === "refresh" ? "刷新中" : "刷新判断"}
                        </Button>
                        <Button
                          size="small"
                          appearance="primary"
                          icon={<Play24Regular />}
                          disabled={state?.loading === "execute"}
                          onClick={() => runQuestionAction("execute", index, question.id)}
                        >
                          {state?.loading === "execute" ? "查询中" : "执行查询"}
                        </Button>
                      </div>
                      <QuestionExecutionResult state={state} />
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              )
            })}
          </Accordion>
        </section>
      </main>
    </div>
  )
}

export function InvestigationNextReview({ batch }: { batch: InvestigationBatchReview }) {
  const [mode, setMode] = React.useState<ThemeMode>("light")
  const [selectedKey, setSelectedKey] = React.useState(batch.rules[0]?.key ?? "")
  const [language, setLanguage] = React.useState<InvestigationLanguage>("zh-CN")
  const [executionContext, setExecutionContext] = React.useState<InvestigationExecutionContextInput>({
    plan_id: "",
    time_window_start: "",
    time_window_end: "",
  })
  const selectedRule = batch.rules.find((rule) => rule.key === selectedKey) ?? batch.rules[0]
  const template = selectedRule ? pickTemplate(selectedRule, language) : undefined

  if (!selectedRule) {
    return (
      <FluentProvider theme={mode === "light" ? webLightTheme : webDarkTheme}>
        <div className={useStyles().page}>
          <main className={useStyles().main}>
            <MessageBar intent="error">
              <MessageBarBody>
                <MessageBarTitle>没有读取到可审阅的 .next.yml 文件</MessageBarTitle>
                请确认批次目录存在：{batch.batchPath}
              </MessageBarBody>
            </MessageBar>
          </main>
        </div>
      </FluentProvider>
    )
  }

  return (
    <FluentProvider theme={mode === "light" ? webLightTheme : webDarkTheme}>
      <GuideContent
        batch={batch}
        rule={selectedRule}
        template={template}
        language={language}
        mode={mode}
        setMode={setMode}
        setRuleKey={setSelectedKey}
        setLanguage={setLanguage}
        executionContext={executionContext}
        setExecutionContext={setExecutionContext}
      />
    </FluentProvider>
  )
}
