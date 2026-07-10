"use client";

import { FileText, Network, ShieldCheck, Trash2, X } from "lucide-react";

import { Button } from "@/shared/ui/button";

import type { AttackGraphNodeModel } from "../../model/core/attack-graph-data";
import { getAttackGraphRemediationNodeConfig } from "../../model/node/attack-graph-remediation-config";

export interface AttackGraphRemediationTargetsProps {
  targets: readonly AttackGraphNodeModel[];
  onClear: () => void;
  onRemove: (targetKey: string) => void;
}

const REMEDIATION_CAPABILITY_LABELS: Record<string, string> = {
  account: "账户",
  bits: "BITS 任务",
  file: "文件",
  network: "网络",
  process: "进程",
  registry: "注册表",
  service: "服务",
  "scheduled-task": "计划任务",
  wmi: "WMI",
};

export function AttackGraphRemediationTargets({
  targets,
  onClear,
  onRemove,
}: AttackGraphRemediationTargetsProps) {
  return (
    <div className="flex max-h-[300px] w-full min-w-0 flex-col">
      <div className="min-h-0 overflow-auto">
        {targets.length === 0 ? (
          <div className="flex h-[188px] flex-col items-center justify-center text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-600">暂无处置目标</p>
          </div>
        ) : (
          <table className="w-full min-w-[620px] table-fixed border-collapse text-left">
        <caption className="sr-only">已加入处置编排的图谱节点</caption>
        <colgroup>
          <col className="w-[34%]" />
          <col className="w-[18%]" />
          <col />
          <col className="w-24" />
          <col className="w-14" />
        </colgroup>
        <thead className="sticky top-0 z-[1] bg-white">
          <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
            <th className="px-4 py-2.5">处置目标</th>
            <th className="px-3 py-2.5">类型</th>
            <th className="px-3 py-2.5">节点标识</th>
            <th className="px-3 py-2.5">状态</th>
            <th className="px-2 py-2.5">
              <span className="sr-only">操作</span>
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
                  {REMEDIATION_CAPABILITY_LABELS[capability] ?? "通用节点"}
                </td>
                <td className="px-3 py-3">
                  <code className="block truncate text-[11px] text-slate-600" title={targetKey}>
                    {targetKey}
                  </code>
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    已加入
                  </span>
                </td>
                <td className="px-2 py-2 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(targetKey)}
                    className="h-10 w-10 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    aria-label={`移除处置目标 ${target.displayName || targetKey}`}
                    title="移除"
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
        <div className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/70 px-4 py-2">
        <p className="min-w-0 text-xs text-slate-500">
          已选择 {targets.length} 个目标，可继续在图中右键添加其他节点。
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClear}
          className="h-10 shrink-0 bg-white px-3 text-xs text-slate-600 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          清空目标
        </Button>
        </div>
      ) : null}
    </div>
  );
}
