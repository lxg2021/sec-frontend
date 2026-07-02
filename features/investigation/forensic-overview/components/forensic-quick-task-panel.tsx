"use client"

import { useCallback, useEffect, useState } from "react"
import { Send, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { Separator } from "@/shared/ui/separator"
import { getForensicArtifactDefinition } from "../api"
import {
  parseDefaultParams,
  parseParamSchema,
  resolveTarget,
} from "../mappers"
import type {
  CreateForensicTaskRequest,
  ForensicArtifactDefinitionItem,
  ForensicContext,
  ForensicEndpointItem,
} from "../types"
import { ForensicArtifactPicker } from "./forensic-artifact-picker"
import { ForensicEndpointPicker } from "./forensic-endpoint-picker"
import {
  ForensicArtifactParamForm,
  buildParamsObject,
  validateParams,
  type ParamValues,
} from "./forensic-artifact-param-form"

interface Props {
  ctx: ForensicContext
  endpoints: ForensicEndpointItem[]
  artifacts: ForensicArtifactDefinitionItem[]
  externalSelectedEndpoint?: ForensicEndpointItem
  createdBy?: string
  onCreate: (req: CreateForensicTaskRequest) => Promise<{
    task_id: string
    task: { remote_flow_id?: string; status: string }
  }>
}

function genRequestId() {
  return `req-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

export function ForensicQuickTaskPanel({
  ctx,
  endpoints,
  artifacts,
  externalSelectedEndpoint,
  createdBy,
  onCreate,
}: Props) {
  const [endpoint, setEndpoint] = useState<ForensicEndpointItem | undefined>(
    externalSelectedEndpoint,
  )
  const [artifactDef, setArtifactDef] =
    useState<ForensicArtifactDefinitionItem | null>(null)
  const [loadingDef, setLoadingDef] = useState(false)
  const [values, setValues] = useState<ParamValues>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [confirmHighRisk, setConfirmHighRisk] = useState(false)

  useEffect(() => {
    if (externalSelectedEndpoint) setEndpoint(externalSelectedEndpoint)
  }, [externalSelectedEndpoint])

  const handleSelectArtifact = useCallback(
    async (artifact: ForensicArtifactDefinitionItem) => {
      setLoadingDef(true)
      setErrors({})
      setConfirmHighRisk(false)
      try {
        const def = await getForensicArtifactDefinition(artifact.artifact_key)
        setArtifactDef(def)
        const nextValues = parseDefaultParams(def)
        for (const field of parseParamSchema(def)) {
          if (nextValues[field.key] === undefined && field.default !== undefined) {
            nextValues[field.key] = field.default
          }
        }
        setValues(nextValues)
      } catch {
        toast.error("加载工件定义失败", {
          description: "请刷新工件列表后重试。",
        })
        setArtifactDef(null)
      } finally {
        setLoadingDef(false)
      }
    },
    [],
  )

  const fields = artifactDef ? parseParamSchema(artifactDef) : []

  // 平台不匹配提示
  const platformMismatch =
    endpoint &&
    artifactDef &&
    artifactDef.platform !== "all" &&
    endpoint.os &&
    endpoint.os.toLowerCase() !== artifactDef.platform

  const canDispatch = Boolean(endpoint?.velociraptor_client_id)

  const reset = () => {
    setArtifactDef(null)
    setValues({})
    setErrors({})
    setConfirmHighRisk(false)
  }

  const handleSubmit = async () => {
    if (!endpoint) {
      toast.error("请选择目标终端")
      return
    }
    if (!endpoint.velociraptor_client_id) {
      toast.error("该终端无 velociraptor_client_id，后台无法下发")
      return
    }
    if (!artifactDef) {
      toast.error("请选择取证工件")
      return
    }
    const validationErrors = validateParams(fields, values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      toast.error("参数校验未通过", {
        description: "请修正标红的参数字段。",
      })
      return
    }
    if (artifactDef.risk_level === "high" && !confirmHighRisk) {
      toast.warning("这是高风险工件", {
        description: "请勾选风险确认后再提交。",
      })
      return
    }

    const paramsObj = buildParamsObject(fields, values)
    let paramsJson: string
    try {
      paramsJson = JSON.stringify(paramsObj)
    } catch {
      toast.error("参数序列化失败")
      return
    }

    const target = resolveTarget(endpoint)
    const req: CreateForensicTaskRequest = {
      request_id: genRequestId(),
      case_id: ctx.case_id,
      workflow_id: ctx.workflow_id,
      workflow_action_id: ctx.workflow_action_id,
      // 目标身份优先级 agent_id > endpoint_id，同时透传 vr client 供后端兜底
      agent_id: target.agent_id,
      endpoint_id: target.agent_id ? undefined : endpoint.endpoint_id,
      velociraptor_client_id: endpoint.velociraptor_client_id,
      artifact_key: artifactDef.artifact_key,
      params_json: paramsJson,
      created_by: createdBy,
    }

    setSubmitting(true)
    try {
      const res = await onCreate(req)
      if (res.task.remote_flow_id) {
        toast.success(`任务已创建并下发：${res.task_id}`, {
          description: `flow: ${res.task.remote_flow_id}`,
        })
      } else {
        toast.warning(`任务已落库但未下发：${res.task_id}`, {
          description:
            "remote_flow_id 为空，后端可能处于 velociraptor.enabled=false 或 Noop 下发状态。",
        })
      }
      // 保留终端，清空工件与参数，便于继续创建
      reset()
    } catch (e) {
      toast.error("创建任务失败", {
        description: (e as Error).message || "后端返回错误，请稍后重试。",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Send className="size-4 text-primary" />
          快速创建取证任务
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">目标终端</Label>
            <ForensicEndpointPicker
              endpoints={endpoints}
              selected={endpoint}
              onSelect={setEndpoint}
            />
            {endpoint && !canDispatch ? (
              <p className="flex items-center gap-1 text-[11px] text-destructive">
                <TriangleAlert className="size-3" />
                该终端无 velociraptor_client_id，无法下发任务。
              </p>
            ) : endpoint && endpoint.status !== "online" ? (
              <p className="flex items-center gap-1 text-[11px] text-amber-600">
                <TriangleAlert className="size-3" />
                终端当前非在线状态，任务可能处于 pending 或失败。
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">取证工件</Label>
            <ForensicArtifactPicker
              artifacts={artifacts}
              selectedKey={artifactDef?.artifact_key}
              onSelect={handleSelectArtifact}
            />
            {platformMismatch ? (
              <p className="flex items-center gap-1 text-[11px] text-amber-600">
                <TriangleAlert className="size-3" />
                工件平台（{artifactDef?.platform}）与终端系统（
                {endpoint?.os}）不匹配，请确认后再提交。
              </p>
            ) : null}
          </div>
        </div>

        {artifactDef ? (
          <>
            <Separator />
            <div className="space-y-3">
              <Label className="text-xs font-medium text-muted-foreground">
                工件参数
              </Label>
              {loadingDef ? (
                <p className="text-xs text-muted-foreground">加载参数定义…</p>
              ) : (
                <ForensicArtifactParamForm
                  fields={fields}
                  values={values}
                  errors={errors}
                  onChange={(key, value) => {
                    setValues((prev) => ({ ...prev, [key]: value }))
                    setErrors((prev) => {
                      if (!prev[key]) return prev
                      const next = { ...prev }
                      delete next[key]
                      return next
                    })
                  }}
                />
              )}

              {artifactDef.risk_level === "high" ? (
                <label className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  <input
                    type="checkbox"
                    checked={confirmHighRisk}
                    onChange={(e) => setConfirmHighRisk(e.target.checked)}
                    className="size-3.5 accent-[var(--destructive)]"
                  />
                  我确认这是高风险取证工件，仍要继续下发。
                </label>
              ) : null}
            </div>
          </>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            提交使用 CreateForensicTask，参数由后端映射为 Velociraptor 参数，前端不涉及 VQL。
          </p>
          <div className="flex gap-2">
            {artifactDef ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={reset}
                disabled={submitting}
              >
                重置
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || !endpoint || !artifactDef || !canDispatch}
            >
              <Send />
              {submitting ? "提交中…" : "创建任务"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


