"use client"

import { Checkbox } from "@/shared/ui/checkbox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/lib/utils"
import type { ArtifactParamField } from "../types"

export type ParamValues = Record<string, unknown>

interface Props {
  fields: ArtifactParamField[]
  values: ParamValues
  errors: Record<string, string>
  onChange: (key: string, value: unknown) => void
}

export function ForensicArtifactParamForm({
  fields,
  values,
  errors,
  onChange,
}: Props) {
  if (fields.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
        该工件无可配置参数，或参数 schema 无法解析。
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const err = errors[field.key]
        const id = `param-${field.key}`
        return (
          <div key={field.key} className="space-y-1.5" data-param={field.key}>
            {field.type !== "boolean" ? (
              <Label htmlFor={id} className="text-xs">
                {field.label}
                {field.required ? (
                  <span className="text-destructive"> *</span>
                ) : null}
              </Label>
            ) : null}

            {field.type === "string_array" ? (
              <Textarea
                id={id}
                rows={4}
                value={
                  Array.isArray(values[field.key])
                    ? (values[field.key] as string[]).join("\n")
                    : ""
                }
                placeholder={field.placeholder ?? "每行一个值"}
                className={cn("font-mono text-xs", err && "border-destructive")}
                onChange={(e) =>
                  onChange(
                    field.key,
                    e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
              />
            ) : field.type === "boolean" ? (
              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                <Checkbox
                  id={id}
                  checked={Boolean(values[field.key])}
                  onCheckedChange={(c) => onChange(field.key, c === true)}
                />
                <Label htmlFor={id} className="text-xs font-normal">
                  {field.label}
                </Label>
              </div>
            ) : field.type === "number" ? (
              <Input
                id={id}
                type="number"
                value={
                  values[field.key] === undefined || values[field.key] === null
                    ? ""
                    : String(values[field.key])
                }
                min={field.min}
                max={field.max}
                className={cn(err && "border-destructive")}
                onChange={(e) =>
                  onChange(
                    field.key,
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
              />
            ) : (
              <Input
                id={id}
                value={(values[field.key] as string) ?? ""}
                placeholder={field.placeholder}
                className={cn("font-mono text-xs", err && "border-destructive")}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            )}

            {err ? (
              <p className="text-[11px] text-destructive">{err}</p>
            ) : field.description ? (
              <p className="text-[11px] text-muted-foreground">
                {field.description}
              </p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

// 校验参数值，返回错误映射（空表示通过）
export function validateParams(
  fields: ArtifactParamField[],
  values: ParamValues,
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of fields) {
    const v = values[field.key]
    if (field.type === "string_array") {
      const arr = Array.isArray(v) ? (v as string[]) : []
      if (field.required && arr.length === 0) {
        errors[field.key] = "至少填写一个值"
        continue
      }
      if (field.maxItems && arr.length > field.maxItems) {
        errors[field.key] = `最多 ${field.maxItems} 项`
        continue
      }
      if (
        field.maxLength &&
        arr.some((s) => s.length > (field.maxLength as number))
      ) {
        errors[field.key] = `单项最大 ${field.maxLength} 字符`
      }
    } else if (field.type === "string") {
      const s = typeof v === "string" ? v : ""
      if (field.required && !s.trim()) {
        errors[field.key] = "该字段必填"
        continue
      }
      if (field.maxLength && s.length > field.maxLength) {
        errors[field.key] = `最大 ${field.maxLength} 字符`
        continue
      }
      // RFC3339 时间校验
      if (
        (field.key === "start_date" || field.key === "end_date") &&
        s.trim()
      ) {
        if (Number.isNaN(Date.parse(s))) {
          errors[field.key] = "需要合法的 RFC3339 时间"
        }
      }
    } else if (field.type === "number") {
      if (v === undefined || v === null || v === "") {
        if (field.required) errors[field.key] = "该字段必填"
        continue
      }
      const n = Number(v)
      if (Number.isNaN(n)) {
        errors[field.key] = "需要数字"
        continue
      }
      if (field.min !== undefined && n < field.min)
        errors[field.key] = `不能小于 ${field.min}`
      if (field.max !== undefined && n > field.max)
        errors[field.key] = `不能大于 ${field.max}`
    }
  }
  return errors
}

// 清理输出：去掉空值，输出干净的参数对象
export function buildParamsObject(
  fields: ArtifactParamField[],
  values: ParamValues,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const field of fields) {
    const v = values[field.key]
    if (field.type === "string_array") {
      const arr = Array.isArray(v) ? (v as string[]) : []
      if (arr.length > 0) out[field.key] = arr
    } else if (field.type === "boolean") {
      out[field.key] = Boolean(v)
    } else if (field.type === "number") {
      if (v !== undefined && v !== null && v !== "") out[field.key] = Number(v)
    } else {
      if (typeof v === "string" && v.trim()) out[field.key] = v
    }
  }
  return out
}

