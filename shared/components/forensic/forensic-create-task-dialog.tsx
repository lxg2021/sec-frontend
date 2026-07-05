"use client"

import type { FormEvent } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, Check, ChevronRight, Loader2, Search, Send } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { ScrollArea } from "@/shared/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Separator } from "@/shared/ui/separator"
import { Textarea } from "@/shared/ui/textarea"
import { cn, createRequestId } from "@/shared/lib/utils"
import {
  createForensicTask,
  getForensicArtifactDefinition,
  listForensicArtifacts,
  listForensicEndpoints,
} from "@/shared/lib/forensic/api"
import type {
  CreateForensicTaskRequest,
  ForensicArtifactDefinitionItem,
  ForensicArtifactParamField,
  ForensicEndpointItem,
  ForensicOverviewContext,
  ForensicTaskItem,
} from "@/shared/lib/forensic/types"

type ParamValues = Record<string, unknown>

interface ForensicCreateTaskDialogProps {
  open: boolean
  context: ForensicOverviewContext
  initialArtifactKey?: string
  onOpenChange: (open: boolean) => void
  onCreated?: (task: ForensicTaskItem) => void
}

interface ForensicCreateTaskFormProps {
  context: ForensicOverviewContext
  initialArtifactKey?: string
  active?: boolean
  layout?: "stacked" | "workspace"
  formId?: string
  showFooter?: boolean
  className?: string
  footerClassName?: string
  onCancel?: () => void
  onCreated?: (task: ForensicTaskItem) => void
}

function stringValue(value: unknown, locale?: string): string {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>
    const exact = locale ? obj[locale] : undefined
    const zh = obj["zh-CN"]
    const en = obj["en-US"] ?? obj.en
    if (typeof exact === "string") return exact
    if (typeof zh === "string") return zh
    if (typeof en === "string") return en
  }
  if (Array.isArray(value) && value.length > 0) return String(value[0])
  return ""
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function parseJsonObject(value?: string): Record<string, unknown> {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

function normalizeSchemaType(schema: Record<string, unknown>): ForensicArtifactParamField["type"] {
  if (schema.type === "array") return "string_array"
  if (schema.type === "boolean") return "boolean"
  if (schema.type === "number" || schema.type === "integer") return "number"
  return "string"
}

function parseInputSchemaFields(
  artifact: ForensicArtifactDefinitionItem,
  locale: string,
): ForensicArtifactParamField[] {
  if (!artifact.input_schema_json) return []
  try {
    const parsed = JSON.parse(artifact.input_schema_json)
    if (Array.isArray(parsed?.fields)) {
      return parsed.fields.map((field: Record<string, unknown>) => ({
        key: String(field.key ?? field.name ?? ""),
        label: stringValue(field.label, locale) || String(field.key ?? field.name ?? ""),
        type: (field.type as ForensicArtifactParamField["type"]) || "string",
        required: Boolean(field.required),
        description: stringValue(field.description, locale),
        default: field.default,
        maxItems: numberValue(field.maxItems),
        maxLength: numberValue(field.maxLength),
        min: numberValue(field.min),
        max: numberValue(field.max),
        placeholder: stringValue(field.placeholder, locale),
        enum: Array.isArray(field.enum) ? field.enum.map(String) : undefined,
      })).filter((field: ForensicArtifactParamField) => field.key)
    }

    const required = Array.isArray(parsed?.required)
      ? new Set<string>(parsed.required.map(String))
      : new Set<string>()
    const properties =
      parsed && typeof parsed.properties === "object" && parsed.properties
        ? (parsed.properties as Record<string, Record<string, unknown>>)
        : {}

    return Object.entries(properties).map(([key, schema]) => ({
      key,
      label: stringValue(schema.title, locale) || key,
      type: normalizeSchemaType(schema),
      required: required.has(key),
      description: stringValue(schema.description, locale),
      default: schema.default,
      maxItems: numberValue(schema.maxItems),
      maxLength: numberValue(schema.maxLength),
      min: numberValue(schema.minimum),
      max: numberValue(schema.maximum),
      placeholder: stringValue(schema.examples, locale),
      enum: Array.isArray(schema.enum) ? schema.enum.map(String) : undefined,
    }))
  } catch {
    return []
  }
}

function parseNativeFields(
  artifact: ForensicArtifactDefinitionItem,
  locale: string,
): ForensicArtifactParamField[] {
  if (!artifact.upstream_json) return []
  try {
    const parsed = JSON.parse(artifact.upstream_json)
    const native = parsed?.native && typeof parsed.native === "object" ? parsed.native : parsed
    const parameters = Array.isArray(native?.parameters) ? native.parameters : []
    return parameters
      .map((param: Record<string, unknown>) => {
        const key = String(param.name ?? param.key ?? "")
        return {
          key,
          label: key,
          type: "string" as const,
          required: Boolean(param.required),
          description: stringValue(param.description, locale),
          default: param.default,
          placeholder: stringValue(param.placeholder, locale),
          enum: Array.isArray(param.choices)
            ? param.choices.map(String)
            : Array.isArray(param.enum)
              ? param.enum.map(String)
              : undefined,
        }
      })
      .filter((field: ForensicArtifactParamField) => field.key)
  } catch {
    return []
  }
}

function parseParamFields(
  artifact: ForensicArtifactDefinitionItem,
  locale: string,
): ForensicArtifactParamField[] {
  const schemaFields = parseInputSchemaFields(artifact, locale)
  if (schemaFields.length > 0) return schemaFields
  return parseNativeFields(artifact, locale)
}

function buildInitialValues(
  artifact: ForensicArtifactDefinitionItem,
  fields: ForensicArtifactParamField[],
): ParamValues {
  const values: ParamValues = parseJsonObject(artifact.default_params_json)
  for (const field of fields) {
    if (values[field.key] === undefined && field.default !== undefined) {
      values[field.key] = field.default
    }
  }
  return values
}

function validateParams(
  fields: ForensicArtifactParamField[],
  values: ParamValues,
  t: (key: string, values?: Record<string, number | string>) => string,
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of fields) {
    const value = values[field.key]
    if (field.type === "string_array") {
      const array = Array.isArray(value) ? value : []
      if (field.required && array.length === 0) {
        errors[field.key] = t("validation.required")
      } else if (field.maxItems && array.length > field.maxItems) {
        errors[field.key] = t("validation.maxItems", { count: field.maxItems })
      }
    } else if (field.type === "number") {
      if (value === undefined || value === null || value === "") {
        if (field.required) errors[field.key] = t("validation.required")
      } else if (Number.isNaN(Number(value))) {
        errors[field.key] = t("validation.number")
      }
    } else {
      const text = typeof value === "string" ? value : String(value ?? "")
      if (field.required && !text.trim()) {
        errors[field.key] = t("validation.required")
      } else if (field.maxLength && text.length > field.maxLength) {
        errors[field.key] = t("validation.maxLength", { count: field.maxLength })
      }
    }
  }
  return errors
}

function buildParamsObject(
  fields: ForensicArtifactParamField[],
  values: ParamValues,
): Record<string, unknown> {
  const output: Record<string, unknown> = {}
  for (const field of fields) {
    const value = values[field.key]
    if (field.type === "string_array") {
      const array = Array.isArray(value) ? value.filter(Boolean) : []
      if (array.length > 0) output[field.key] = array
    } else if (field.type === "boolean") {
      output[field.key] = value === true
    } else if (field.type === "number") {
      if (value !== undefined && value !== null && value !== "") output[field.key] = Number(value)
    } else if (typeof value === "string") {
      if (value.trim()) output[field.key] = value
    } else if (value !== undefined && value !== null) {
      output[field.key] = value
    }
  }
  return output
}

function endpointLabel(endpoint: ForensicEndpointItem): string {
  return (
    endpoint.hostname ||
    endpoint.fqdn ||
    endpoint.agent_id ||
    endpoint.endpoint_id ||
    endpoint.velociraptor_client_id ||
    "-"
  )
}

function endpointValue(endpoint: ForensicEndpointItem): string {
  return endpoint.endpoint_id || endpoint.velociraptor_client_id || endpoint.agent_id || endpointLabel(endpoint)
}

function FieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: ForensicArtifactParamField
  value: unknown
  error?: string
  onChange: (value: unknown) => void
}) {
  const id = `forensic-param-${field.key}`
  const textValue = value === undefined || value === null ? "" : String(value)

  if (field.enum?.length) {
    return (
      <Select value={textValue} onValueChange={onChange}>
        <SelectTrigger id={id} className={cn("h-9", error && "border-red-300")}>
          <SelectValue placeholder={field.placeholder || field.label} />
        </SelectTrigger>
        <SelectContent>
          {field.enum.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (field.type === "boolean") {
    return (
      <label className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
        <Checkbox checked={value === true} onCheckedChange={(checked) => onChange(checked === true)} />
        <span className="text-sm text-slate-700">{field.label}</span>
      </label>
    )
  }

  if (field.type === "string_array") {
    return (
      <Textarea
        id={id}
        rows={3}
        value={Array.isArray(value) ? value.join("\n") : ""}
        placeholder={field.placeholder}
        className={cn("font-mono text-xs", error && "border-red-300")}
        onChange={(event) =>
          onChange(event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))
        }
      />
    )
  }

  if (field.type === "number") {
    return (
      <Input
        id={id}
        type="number"
        value={textValue}
        min={field.min}
        max={field.max}
        className={cn("h-9", error && "border-red-300")}
        onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
      />
    )
  }

  if (textValue.includes("\n") || textValue.length > 80) {
    return (
      <Textarea
        id={id}
        rows={3}
        value={textValue}
        placeholder={field.placeholder}
        className={cn("font-mono text-xs", error && "border-red-300")}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }

  return (
    <Input
      id={id}
      value={textValue}
      placeholder={field.placeholder}
      className={cn("h-9 font-mono text-xs", error && "border-red-300")}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export function ForensicCreateTaskForm({
  context,
  initialArtifactKey,
  active = true,
  layout = "stacked",
  formId,
  showFooter = true,
  className,
  footerClassName,
  onCancel,
  onCreated,
}: ForensicCreateTaskFormProps) {
  const t = useTranslations("pages.investigation.tasks.create")
  const locale = useLocale()
  const [endpoints, setEndpoints] = useState<ForensicEndpointItem[]>([])
  const [artifacts, setArtifacts] = useState<ForensicArtifactDefinitionItem[]>([])
  const [endpointId, setEndpointId] = useState("")
  const [artifactKey, setArtifactKey] = useState("")
  const [artifactDef, setArtifactDef] = useState<ForensicArtifactDefinitionItem | null>(null)
  const [values, setValues] = useState<ParamValues>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [loadingArtifact, setLoadingArtifact] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [endpointKeyword, setEndpointKeyword] = useState("")
  const [confirmHighRisk, setConfirmHighRisk] = useState(false)
  const [initialArtifactApplied, setInitialArtifactApplied] = useState(false)

  const fields = useMemo(
    () => (artifactDef ? parseParamFields(artifactDef, locale) : []),
    [artifactDef, locale],
  )

  const selectedEndpoint = endpoints.find((item) => endpointValue(item) === endpointId)

  const filteredEndpoints = useMemo(() => {
    const keyword = endpointKeyword.trim().toLowerCase()
    if (!keyword) return endpoints
    return endpoints.filter((item) =>
      [
        item.hostname,
        item.fqdn,
        item.agent_id,
        item.endpoint_id,
        item.velociraptor_client_id,
        item.os,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    )
  }, [endpointKeyword, endpoints])

  const handleArtifactChange = useCallback(
    async (nextKey: string) => {
      setArtifactKey(nextKey)
      setArtifactDef(null)
      setValues({})
      setErrors({})
      setConfirmHighRisk(false)
      setLoadingArtifact(true)
      try {
        const definition = await getForensicArtifactDefinition(nextKey)
        const nextFields = parseParamFields(definition, locale)
        setArtifactDef(definition)
        setValues(buildInitialValues(definition, nextFields))
      } catch (error) {
        toast.error(t("toast.artifactFailed"), {
          description: error instanceof Error ? error.message : t("toast.retry"),
        })
      } finally {
        setLoadingArtifact(false)
      }
    },
    [locale, t],
  )

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true)
    try {
      const [endpointResult, artifactResult] = await Promise.all([
        listForensicEndpoints({ page: 1, page_size: 200 }),
        listForensicArtifacts({ enabled: true }),
      ])
      setEndpoints(endpointResult.items)
      setArtifacts(artifactResult.items.filter((item) => item.enabled))

      const contextEndpoint = endpointResult.items.find(
        (item) =>
          (context.endpoint_id && item.endpoint_id === context.endpoint_id) ||
          (context.agent_id && item.agent_id === context.agent_id),
      )
      if (contextEndpoint) setEndpointId(endpointValue(contextEndpoint))
    } catch (error) {
      toast.error(t("toast.optionsFailed"), {
        description: error instanceof Error ? error.message : t("toast.retry"),
      })
    } finally {
      setLoadingOptions(false)
    }
  }, [context.agent_id, context.endpoint_id, t])

  useEffect(() => {
    if (active) void loadOptions()
  }, [active, loadOptions])

  useEffect(() => {
    if (!active) {
      setArtifactKey("")
      setArtifactDef(null)
      setValues({})
      setErrors({})
      setConfirmHighRisk(false)
      setInitialArtifactApplied(false)
    }
  }, [active])

  useEffect(() => {
    const nextKey = initialArtifactKey?.trim()
    if (!active || !nextKey || initialArtifactApplied || loadingArtifact) return
    if (artifactKey === nextKey) {
      setInitialArtifactApplied(true)
      return
    }
    if (artifacts.length > 0 && !artifacts.some((item) => item.artifact_key === nextKey)) return
    setInitialArtifactApplied(true)
    void handleArtifactChange(nextKey)
  }, [
    artifactKey,
    artifacts,
    handleArtifactChange,
    initialArtifactApplied,
    initialArtifactKey,
    loadingArtifact,
    active,
  ])

  const handleSubmit = useCallback(async () => {
    if (!selectedEndpoint) {
      toast.error(t("toast.endpointRequired"))
      return
    }
    if (!selectedEndpoint.velociraptor_client_id) {
      toast.error(t("toast.clientRequired"))
      return
    }
    if (!artifactDef) {
      toast.error(t("toast.artifactRequired"))
      return
    }

    const nextErrors = validateParams(fields, values, t)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error(t("toast.validationFailed"))
      return
    }

    if (artifactDef.risk_level === "high" && !confirmHighRisk) {
      toast.warning(t("toast.highRiskTitle"), {
        description: t("toast.highRiskDescription"),
      })
      return
    }

    const payload: CreateForensicTaskRequest = {
      request_id: createRequestId(),
      case_id: context.case_id,
      workflow_id: context.workflow_id,
      workflow_action_id: context.workflow_action_id,
      agent_id: selectedEndpoint.agent_id,
      endpoint_id: selectedEndpoint.agent_id ? undefined : selectedEndpoint.endpoint_id,
      velociraptor_client_id: selectedEndpoint.velociraptor_client_id,
      artifact_key: artifactDef.artifact_key,
      params_json: JSON.stringify(buildParamsObject(fields, values)),
    }

    setSubmitting(true)
    try {
      const result = await createForensicTask(payload)
      toast.success(t("toast.created"), {
        description: result.task.remote_flow_id
          ? t("toast.createdFlow", { flowId: result.task.remote_flow_id })
          : t("toast.createdNoFlow"),
      })
      onCreated?.(result.task)
      onCancel?.()
    } catch (error) {
      toast.error(t("toast.createFailed"), {
        description: error instanceof Error ? error.message : t("toast.retry"),
      })
    } finally {
      setSubmitting(false)
    }
  }, [
    artifactDef,
    confirmHighRisk,
    context.case_id,
    context.workflow_action_id,
    context.workflow_id,
    fields,
    onCancel,
    onCreated,
    selectedEndpoint,
    t,
    values,
  ])

  const handleFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void handleSubmit()
    },
    [handleSubmit],
  )

  const endpointSection = (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-semibold text-slate-800">{t("endpoint.title")}</Label>
        {loadingOptions ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={endpointKeyword}
          onChange={(event) => setEndpointKeyword(event.target.value)}
          placeholder={t("endpoint.search")}
          className="h-9 bg-white pl-9"
        />
      </div>
      <div className="max-h-56 space-y-2 overflow-auto pr-1">
        {filteredEndpoints.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-8 text-center text-sm text-slate-500">
            {t("endpoint.empty")}
          </div>
        ) : (
          filteredEndpoints.map((endpoint) => {
            const value = endpointValue(endpoint)
            const selected = value === endpointId
            return (
              <button
                key={value}
                type="button"
                onClick={() => setEndpointId(value)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md",
                  selected ? "border-sky-300 ring-2 ring-sky-100" : "border-slate-200",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-800">
                    {endpointLabel(endpoint)}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[11px] text-slate-500">
                    {endpoint.agent_id || endpoint.endpoint_id || "-"} / {endpoint.velociraptor_client_id || "-"}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      endpoint.status === "online" && "bg-emerald-500",
                      endpoint.status === "offline" && "bg-slate-400",
                      endpoint.status === "unknown" && "bg-amber-500",
                    )}
                  />
                  {selected ? (
                    <Check className="h-4 w-4 text-sky-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  )}
                </span>
              </button>
            )
          })
        )}
      </div>
    </section>
  )

  const artifactSection = (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-semibold text-slate-800">{t("artifact.title")}</Label>
        {loadingArtifact ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
      </div>
      <Select value={artifactKey} onValueChange={(value) => void handleArtifactChange(value)}>
        <SelectTrigger className="h-9 bg-white">
          <SelectValue placeholder={t("artifact.placeholder")} />
        </SelectTrigger>
        <SelectContent>
          {artifacts.map((artifact) => (
            <SelectItem key={artifact.artifact_key} value={artifact.artifact_key}>
              {artifact.name || artifact.artifact_key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {artifactDef ? (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-mono text-xs font-semibold text-slate-800">
                {artifactDef.artifact_key}
              </div>
              <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-500">
                {artifactDef.description || t("artifact.noDescription")}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase text-slate-600">
              {artifactDef.platform}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-8 text-center text-sm text-slate-500">
          {t("artifact.empty")}
        </div>
      )}
    </section>
  )

  const paramsContent = !artifactDef ? (
    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
      {t("params.selectArtifactFirst")}
    </div>
  ) : fields.length === 0 ? (
    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
      {t("params.empty")}
    </div>
  ) : (
    <div className="grid gap-4 lg:grid-cols-2">
      {fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          {field.type !== "boolean" ? (
            <Label htmlFor={`forensic-param-${field.key}`} className="text-xs font-medium text-slate-700">
              {field.label}
              {field.required ? <span className="text-red-500"> *</span> : null}
            </Label>
          ) : null}
          <FieldInput
            field={field}
            value={values[field.key]}
            error={errors[field.key]}
            onChange={(value) => {
              setValues((current) => ({ ...current, [field.key]: value }))
              setErrors((current) => {
                if (!current[field.key]) return current
                const next = { ...current }
                delete next[field.key]
                return next
              })
            }}
          />
          {errors[field.key] ? (
            <p className="text-[11px] text-red-600">{errors[field.key]}</p>
          ) : field.description ? (
            <p className="line-clamp-2 text-[11px] leading-5 text-slate-500">{field.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  )

  const highRiskConfirm = artifactDef?.risk_level === "high" ? (
    <label className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
      <Checkbox checked={confirmHighRisk} onCheckedChange={(checked) => setConfirmHighRisk(checked === true)} />
      <AlertTriangle className="h-3.5 w-3.5" />
      {t("params.confirmHighRisk")}
    </label>
  ) : null

  const footer = (
    <div className={cn("flex items-center justify-end gap-2 pt-4", footerClassName)}>
      {onCancel ? (
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          {t("actions.cancel")}
        </Button>
      ) : null}
      <Button
        type="submit"
        disabled={submitting || !selectedEndpoint || !artifactDef}
        className="bg-slate-950 text-white hover:bg-slate-800"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {submitting ? t("actions.submitting") : t("actions.submit")}
      </Button>
    </div>
  )

  if (layout === "workspace") {
    return (
      <form id={formId} onSubmit={handleFormSubmit} className={cn("space-y-0", className)}>
        <div className="grid items-stretch gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-4">
            {endpointSection}
            {artifactSection}
          </aside>

          <section className="flex min-h-[416px] self-stretch flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <Label className="text-sm font-semibold text-slate-800">{t("params.title")}</Label>
              <span className="text-xs text-slate-500">{t("params.nativeHint")}</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 pr-3">
              <div className="space-y-4">
                {paramsContent}
                {highRiskConfirm}
              </div>
            </div>
          </section>
        </div>
        {showFooter ? footer : null}
      </form>
    )
  }

  return (
    <form id={formId} onSubmit={handleFormSubmit} className={cn("space-y-5", className)}>
      <div className="grid gap-4 lg:grid-cols-2">
        {endpointSection}
        {artifactSection}
      </div>

      <Separator />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-sm font-semibold text-slate-800">{t("params.title")}</Label>
          <span className="text-xs text-slate-500">{t("params.nativeHint")}</span>
        </div>
        {paramsContent}
        {highRiskConfirm}
      </section>
      {showFooter ? footer : null}
    </form>
  )
}

export function ForensicCreateTaskDialog({
  open,
  context,
  initialArtifactKey,
  onOpenChange,
  onCreated,
}: ForensicCreateTaskDialogProps) {
  const t = useTranslations("pages.investigation.tasks.create")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-200 px-6 py-5">
          <DialogTitle className="text-lg font-semibold text-slate-950">{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(88vh-6.5rem)]">
          <ForensicCreateTaskForm
            active={open}
            context={context}
            initialArtifactKey={initialArtifactKey}
            onCancel={() => onOpenChange(false)}
            onCreated={onCreated}
            className="px-6 py-5"
            footerClassName="-mx-6 -mb-5 border-t border-slate-200 bg-white px-6 py-4"
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
