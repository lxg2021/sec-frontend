"use client";

import {
  CheckCircle2,
  FileText,
  Network,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";

import type { AttackGraphNodeModel } from "../../model/core/attack-graph-data";
import { getAttackGraphRemediationNodeConfig } from "../../model/node/attack-graph-remediation-config";

export interface AttackGraphRemediationTargetsProps {
  targets: readonly AttackGraphNodeModel[];
  onClear: () => void;
  onRemove: (targetKey: string) => void;
}

export function AttackGraphRemediationTargets({
  targets,
  onClear,
  onRemove,
}: AttackGraphRemediationTargetsProps) {
  const t = useTranslations("pages.attack.drill.controlPanel");
  return (
    <div className="flex max-h-[300px] w-full min-w-0 flex-col">
      <div className="min-h-0 overflow-auto">
        {targets.length === 0 ? (
          <div className="flex h-[188px] flex-col items-center justify-center text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              {t("remediation.empty")}
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[620px] table-fixed border-collapse text-left">
        <caption className="sr-only">{t("remediation.caption")}</caption>
        <colgroup>
          <col className="w-[34%]" />
          <col className="w-[18%]" />
          <col />
          <col className="w-24" />
          <col className="w-14" />
        </colgroup>
        <thead className="sticky top-0 z-[1] bg-white">
          <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
            <th className="px-4 py-2.5">{t("remediation.columns.target")}</th>
            <th className="px-3 py-2.5">{t("remediation.columns.type")}</th>
            <th className="px-3 py-2.5">{t("remediation.columns.nodeId")}</th>
            <th className="px-3 py-2.5">{t("remediation.columns.status")}</th>
            <th className="px-2 py-2.5">
              <span className="sr-only">{t("remediation.columns.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {targets.map((target) => {
            const config = getAttackGraphRemediationNodeConfig(
              target.entityType,
            );
            const capability = config?.capability ?? "unknown";
            const isNetwork = capability === "network";
            const Icon = isNetwork
              ? Network
              : capability === "file"
                ? FileText
                : ShieldCheck;
            const targetKey = target.key || target.id;

            return (
              <tr
                key={targetKey}
                className="border-b border-slate-100 text-xs text-slate-700 last:border-b-0 hover:bg-slate-50/80"
              >
                <td className="px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-slate-900" title={target.displayName}>
                        {target.displayName || targetKey}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-slate-500" title={target.entityType}>
                        {target.entityType}
                      </span>
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 font-medium text-slate-700">
                  {getRemediationCapabilityLabel(capability, t)}
                </td>
                <td className="px-3 py-3">
                  <code className="block truncate text-[11px] text-slate-600" title={targetKey}>
                    {targetKey}
                  </code>
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    {t("remediation.added")}
                  </span>
                </td>
                <td className="px-2 py-2 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(targetKey)}
                    className="h-10 w-10 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    aria-label={t("remediation.removeAria", {
                      target: target.displayName || targetKey,
                    })}
                    title={t("remediation.remove")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
          </table>
        )}
      </div>

      {targets.length > 0 ? (
        <div className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/80 px-4 py-2">
          <div className="flex min-w-0 items-center gap-2.5 text-xs">
            <CheckCircle2
              className="h-3.5 w-3.5 shrink-0 text-slate-500"
              aria-hidden="true"
            />
            <span className="shrink-0 font-semibold text-slate-900">
              {t("remediation.selectedCount", { count: targets.length })}
            </span>
            <span className="h-4 w-px shrink-0 bg-slate-300" aria-hidden="true" />
            <span className="truncate text-slate-500">
              {t("remediation.addMoreHint")}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClear}
            className="h-9 shrink-0 rounded-lg border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-none hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:ring-slate-950"
          >
            <Trash2 className="h-4 w-4" />
            {t("remediation.clear")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function getRemediationCapabilityLabel(
  capability: string,
  t: ReturnType<typeof useTranslations<"pages.attack.drill.controlPanel">>,
) {
  if (capability === "account") return t("remediation.capabilities.account");
  if (capability === "bits") return t("remediation.capabilities.bits");
  if (capability === "file") return t("remediation.capabilities.file");
  if (capability === "network") return t("remediation.capabilities.network");
  if (capability === "process") return t("remediation.capabilities.process");
  if (capability === "registry") return t("remediation.capabilities.registry");
  if (capability === "service") return t("remediation.capabilities.service");
  if (capability === "scheduled-task") {
    return t("remediation.capabilities.scheduledTask");
  }
  if (capability === "wmi") return t("remediation.capabilities.wmi");
  return t("remediation.capabilities.common");
}
