"use client"

import { useEffect, useState, type ReactNode } from "react"
import { CalendarCheck2, CalendarClock, Globe2, Loader2, Radar, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { fetchAttackTriggerDefaultRange, triggerCheck } from "@/features/attack/dashboard/api"
import type { TriggerCheckPayload } from "@/features/attack/dashboard/types"
import { Button } from "@/features/attack/dashboard/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { cn } from "@/shared/lib/utils"

const TIMEZONE_OPTIONS = ["Asia/Shanghai", "UTC"]

interface TriggerCheckDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitted?: (taskId: string) => void
}

type Phase = "idle" | "loading" | "submitting" | "failed"

export function TriggerCheckDialog({
  open,
  onOpenChange,
  onSubmitted,
}: TriggerCheckDialogProps) {
  const t = useTranslations("pages.attack.dashboard.triggerDialog")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [timezone, setTimezone] = useState("Asia/Shanghai")
  const [phase, setPhase] = useState<Phase>("idle")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false

    setPhase("loading")
    setError(null)
    setStartTime("")
    setEndTime("")

    fetchAttackTriggerDefaultRange(timezone)
      .then((range) => {
        if (cancelled) return
        setStartTime(range.start_time)
        setEndTime(range.end_time)
        setPhase("idle")
      })
      .catch((err) => {
        if (cancelled) return
        setPhase("failed")
        setError(err instanceof Error ? err.message : t("loadDefaultFailed"))
      })

    return () => {
      cancelled = true
    }
  }, [open, timezone, t])

  const loadingDefaults = phase === "loading"
  const submitting = phase === "submitting"
  const busy = loadingDefaults || submitting

  const resetState = () => {
    setPhase("idle")
    setError(null)
  }

  const validate = () => {
    if (!startTime) return t("missingStart")
    if (!endTime) return t("missingEnd")
    if (new Date(startTime).getTime() > new Date(endTime).getTime()) {
      return t("invalidRange")
    }
    return null
  }

  const handleConfirm = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setPhase("submitting")

    const payload: TriggerCheckPayload = {
      start_time: startTime,
      end_time: endTime,
      bucket_type: "fixed",
      timezone,
    }

    try {
      const result = await triggerCheck(payload)
      if (!result.task_id) {
        throw new Error(t("missingTaskId"))
      }
      onOpenChange(false)
      resetState()
      onSubmitted?.(result.task_id)
    } catch (err) {
      setPhase("failed")
      setError(err instanceof Error ? err.message : t("submitFailed"))
    }
  }

  const handleCancel = () => {
    if (submitting) return
    onOpenChange(false)
    resetState()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (submitting) return
        onOpenChange(nextOpen)
        if (!nextOpen) resetState()
      }}
    >
      <DialogContent className="max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl [&>button]:hidden">
        <DialogHeader className="flex flex-row items-start justify-between gap-4 space-y-0 text-left">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-100">
              <Radar className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle className="text-base font-semibold text-foreground">{t("title")}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {t("description")}
              </DialogDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCancel}
            disabled={submitting}
            aria-label={t("close")}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="mt-5 space-y-4">
          <Field
            label={t("startTime")}
            required
            icon={<CalendarClock className="h-3.5 w-3.5" />}
            iconClassName="bg-emerald-50 text-emerald-600 ring-emerald-100"
          >
            <input
              type="datetime-local"
              step={1}
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              disabled={busy}
              className={inputClass}
            />
          </Field>

          <Field
            label={t("endTime")}
            required
            icon={<CalendarCheck2 className="h-3.5 w-3.5" />}
            iconClassName="bg-rose-50 text-rose-600 ring-rose-100"
          >
            <input
              type="datetime-local"
              step={1}
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              disabled={busy}
              className={inputClass}
            />
          </Field>

          <Field
            label={t("timezone")}
            icon={<Globe2 className="h-3.5 w-3.5" />}
            iconClassName="bg-violet-50 text-violet-600 ring-violet-100"
          >
            <select
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              disabled={busy}
              className={inputClass}
            >
              {TIMEZONE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={submitting}>
            {t("cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={busy}>
            {loadingDefaults ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                {t("loadingDefaults")}
              </>
            ) : submitting ? (
              t("submitting")
            ) : (
              t("confirm")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const inputClass = cn(
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
  "disabled:cursor-not-allowed disabled:opacity-50",
)

function Field({
  label,
  required,
  children,
  icon,
  iconClassName,
}: {
  label: string
  required?: boolean
  children: ReactNode
  icon?: ReactNode
  iconClassName?: string
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        {icon ? (
          <span className={cn("flex h-5 w-5 items-center justify-center rounded-md ring-1", iconClassName)}>
            {icon}
          </span>
        ) : null}
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </span>
      {children}
    </label>
  )
}
