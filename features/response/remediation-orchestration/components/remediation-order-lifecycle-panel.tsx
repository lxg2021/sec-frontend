"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Loader2,
  Play,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Workflow,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type {
  RemediationOrder,
  RemediationOrderItem,
} from "@/features/attack/remediation-order";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { remediationOrderLifecycleActions } from "../remediation-order-model";
import { remediationOrderActionLabel } from "./remediation-order-parameter-editor";
import { remediationReadinessIssuePresentation } from "./remediation-order-readiness";

function targetText(item: RemediationOrderItem) {
  return (
    item.display_name.trim() || item.object_id.trim() || item.node_key.trim()
  );
}

function basename(value: string, fallback: string) {
  const normalized = value.trim().replace(/[\\/]+$/, "");
  return (
    normalized.split(/[\\/]/).filter(Boolean).pop() ||
    normalized ||
    fallback
  );
}

function orderStage(status: string) {
  const normalized = status.trim().toLowerCase();
  if (
    ["running", "success", "failed", "partial", "completed"].includes(
      normalized,
    )
  )
    return 3;
  if (["prepared", "ready", "confirmed"].includes(normalized)) return 2;
  return 1;
}

function stageBadge(status: string, t: (key: string) => string) {
  const normalized = status.trim().toLowerCase();
  const labels: Record<string, string> = {
    draft: t("lifecycle.draft"),
    prepared: t("lifecycle.prepared"),
    ready: t("lifecycle.prepared"),
    confirmed: t("lifecycle.confirmed"),
    running: t("lifecycle.running"),
    success: t("lifecycle.success"),
    failed: t("lifecycle.failed"),
    completed: t("lifecycle.completed"),
    canceled: t("lifecycle.canceled"),
    expired: t("lifecycle.expired"),
  };
  return labels[normalized] || normalized || t("lifecycle.unknown");
}

export interface RemediationOrderLifecyclePanelProps {
  complete: number;
  decisionLoading: boolean;
  dirty: boolean;
  firstIncomplete: RemediationOrderItem | null;
  onCancel: () => void;
  onConfirm: () => void;
  onDelete: () => void;
  onPrepare: () => void;
  onSave: () => void;
  onSelectItem: (itemId: string) => void;
  order: RemediationOrder;
  pollError: string;
  total: number;
  validationErrors: Record<string, string>;
  working: string;
}

export function RemediationOrderLifecyclePanel({
  complete,
  decisionLoading,
  dirty,
  firstIncomplete,
  onCancel,
  onConfirm,
  onDelete,
  onPrepare,
  onSave,
  onSelectItem,
  order,
  pollError,
  total,
  validationErrors,
  working,
}: RemediationOrderLifecyclePanelProps) {
  const t = useTranslations("pages.collection.orchestration");
  const stage = orderStage(order.status);
  const lifecycle = remediationOrderLifecycleActions(order);
  const busy = Boolean(working);
  const normalizedStatus = order.status.trim().toLowerCase();
  const showPrepared = normalizedStatus === "prepared";
  const showSubmissionReview =
    lifecycle.edit || normalizedStatus === "confirmed" || stage === 3;
  const blocked = Math.max(total - complete, 0);
  const readinessIssue = firstIncomplete
    ? remediationReadinessIssuePresentation(
        validationErrors[firstIncomplete.item_id] ?? "",
      )
    : null;

  return (
    <aside
      id="remediation-order-prepare"
      className="min-w-0 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
          <Workflow className="size-4 text-teal-600" aria-hidden />
          {t("lifecycle.title")}
        </h2>
        <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-bold text-white">
          {stageBadge(order.status, t)}
        </span>
      </div>

      <div
        className="mt-7 flex items-center"
        aria-label={t("lifecycle.stageAria", { stage })}
      >
        {[t("lifecycle.stageConfiguration"), t("lifecycle.stageConfirmation"), t("lifecycle.stageExecution")].map((label, index) => {
          const step = index + 1;
          const active = step <= stage;
          return (
            <div
              key={label}
              className={cn("flex items-center", index < 2 && "flex-1")}
            >
              <span
                className={cn("flex items-center gap-2", index > 0 && "pl-2")}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                    active
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-300 bg-white text-slate-500",
                  )}
                >
                  {step < stage || (step === 1 && active) ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    step
                  )}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    active ? "text-slate-800" : "text-slate-500",
                  )}
                >
                  {label}
                </span>
              </span>
              {index < 2 ? (
                <span
                  className={cn(
                    "mx-3 h-0.5 min-w-6 flex-1",
                    step < stage ? "bg-teal-500" : "bg-slate-300",
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {showSubmissionReview ? (
        <>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  {t("lifecycle.prepare")}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {t("lifecycle.prepareDescription")}
                </div>
              </div>
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white">
                {complete} / {total}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
                <div className="text-[10px] font-medium text-emerald-700">
                  {t("lifecycle.ready")}
                </div>
                <div className="mt-1 text-lg font-bold text-emerald-800">
                  {complete}
                </div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                <div className="text-[10px] font-medium text-amber-700">
                  {t("lifecycle.attention")}
                </div>
                <div className="mt-1 text-lg font-bold text-amber-800">
                  {blocked}
                </div>
              </div>
            </div>
          </div>

          {lifecycle.edit && decisionLoading ? (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              {t("lifecycle.checking")}
            </div>
          ) : lifecycle.edit && firstIncomplete && readinessIssue ? (
            <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="mt-0.5 size-5 shrink-0 text-amber-700"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-amber-900">
                    {t("lifecycle.blockingItems")}
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div
                      className="min-w-0 truncate text-xs font-semibold text-amber-900"
                      title={targetText(firstIncomplete)}
                    >
                      {basename(targetText(firstIncomplete), t("workspace.unnamedTarget"))} ·{" "}
                      {remediationOrderActionLabel(firstIncomplete)}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
                        readinessIssue.badgeClassName,
                      )}
                    >
                      {readinessIssue.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    {readinessIssue.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectItem(firstIncomplete.item_id)}
                    className="mt-3 min-h-9 rounded-full border border-amber-500 bg-white px-4 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                  >
                    {readinessIssue.action}
                  </button>
                </div>
              </div>
            </div>
          ) : total > 0 ? (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
              <div>
                <div className="text-xs font-bold">{t("lifecycle.allReady")}</div>
                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  {t("lifecycle.allReadyDescription")}
                </p>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {showPrepared ? (
        <div
          className={cn(
            "mt-6 rounded-2xl border p-4",
            order.confirmable
              ? "border-teal-200 bg-teal-50"
              : "border-amber-200 bg-amber-50",
          )}
        >
          <div className="flex items-start gap-3">
            <ShieldCheck
              className={cn(
                "mt-0.5 size-5 shrink-0",
                order.confirmable ? "text-teal-700" : "text-amber-700",
              )}
              aria-hidden
            />
            <div className="min-w-0">
              <div
                className={cn(
                  "text-xs font-bold",
                  order.confirmable ? "text-teal-900" : "text-amber-900",
                )}
              >
                {order.confirmable ? t("lifecycle.preparePassed") : t("lifecycle.prepareNotPassed")}
              </div>
              <p
                className={cn(
                  "mt-1 text-xs leading-5",
                  order.confirmable ? "text-teal-700" : "text-amber-700",
                )}
              >
                {t("lifecycle.summary", {
                  ready: order.summary.ready,
                  satisfied: order.summary.satisfied,
                  blocked: order.summary.blocked,
                })}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-2 border-t border-slate-100 pt-5">
        {lifecycle.edit ? (
          <>
            {dirty ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-full border-slate-300"
                disabled={busy}
                onClick={onSave}
              >
                {working === "save" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Save />
                )}
                {t("lifecycle.saveDraft")}
              </Button>
            ) : (
              <div className="flex h-10 items-center justify-center gap-2 text-xs font-medium text-slate-500">
                <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
                {t("lifecycle.saved")}
              </div>
            )}
            <Button
              type="button"
              className="h-11 w-full rounded-full bg-teal-600 text-white hover:bg-teal-700"
              disabled={
                busy || decisionLoading || total === 0 || complete !== total
              }
              onClick={onPrepare}
            >
              {working === "prepare" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ShieldCheck />
              )}
              {working === "prepare"
                ? t("lifecycle.checking")
                : dirty
                  ? t("lifecycle.saveAndSubmit")
                  : t("lifecycle.submit")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={busy}
              onClick={onDelete}
            >
              <Trash2 />
              {t("lifecycle.deleteDraft")}
            </Button>
          </>
        ) : null}

        {order.status.trim().toLowerCase() === "prepared" ? (
          <>
            {order.confirmable ? (
              <Button
                type="button"
                className="h-11 w-full rounded-full bg-teal-600 text-white hover:bg-teal-700"
                disabled={busy || !lifecycle.confirm}
                onClick={onConfirm}
              >
                <Play />
                {t("lifecycle.confirmAndExecute")}
              </Button>
            ) : (
              <Button
                type="button"
                className="h-11 w-full rounded-full bg-teal-600 text-white hover:bg-teal-700"
                disabled={busy}
                onClick={onPrepare}
              >
                {working === "prepare" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <RotateCcw />
                )}
                {working === "prepare" ? t("lifecycle.checking") : t("lifecycle.recheck")}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={busy}
              onClick={onCancel}
            >
              <XCircle />
              {t("lifecycle.abandon")}
            </Button>
            {!order.confirmable ? (
              <p className="text-center text-xs leading-5 text-amber-700">
                {t("lifecycle.recheckHint")}
              </p>
            ) : null}
          </>
        ) : null}

        {!lifecycle.edit && !showPrepared ? (
          <>
            <div className="flex h-10 items-center justify-center gap-2 text-xs font-medium text-slate-500">
              <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
              {t("lifecycle.submitted")}
            </div>
            <Button
              type="button"
              className="h-11 w-full rounded-full bg-teal-600 text-white disabled:pointer-events-none disabled:opacity-100"
              disabled
            >
              <ShieldCheck />
              {t("lifecycle.submittedAction")}
            </Button>
          </>
        ) : null}

        {lifecycle.poll ? (
          <div
            className={cn(
              "flex items-start justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-medium",
              pollError
                ? "bg-amber-50 text-amber-800"
                : "bg-blue-50 text-blue-700",
            )}
            role="status"
          >
            {pollError ? (
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            )}
            <span>{pollError || t("lifecycle.polling")}</span>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
