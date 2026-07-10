"use client";

import {
  FileKey,
  Globe2,
  Loader2,
  Network,
  Play,
  RefreshCw,
  ScanSearch,
  Trash2,
} from "lucide-react";

import type { IocVerificationItem } from "@/features/ioc-analysis/types";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";

export interface AttackGraphIocCandidateGroup {
  key: string;
  type: string;
  value: string;
  candidates: IocVerificationItem[];
  userCandidateIds: string[];
}

export interface AttackGraphIocCandidatesProps {
  candidates: readonly IocVerificationItem[];
  deletingCandidateIds?: ReadonlySet<string>;
  error?: string;
  loading?: boolean;
  onDelete: (candidateIds: string[]) => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
  onSelectedCandidateIdsChange: (candidateIds: Set<string>) => void;
  onStartVerification: (candidateIds: string[]) => void;
  selectedCandidateIds: ReadonlySet<string>;
}

const IOC_TYPE_LABELS: Record<string, string> = {
  domain: "DOMAIN",
  ip: "IP",
  md5: "MD5",
  sha1: "SHA1",
  sha256: "SHA256",
  url: "URL",
};

export function groupAttackGraphIocCandidates(
  candidates: readonly IocVerificationItem[],
) {
  const groups = new Map<string, AttackGraphIocCandidateGroup>();
  for (const candidate of candidates) {
    const value = (candidate.normalized_value || candidate.value).trim();
    const type = candidate.type.trim().toLowerCase();
    const candidateId = (candidate.candidate_id || candidate.id).trim();
    if (!value || !type || !candidateId) continue;

    const key = `${type}\u0000${value.toLowerCase()}`;
    const group = groups.get(key) ?? {
      key,
      type,
      value,
      candidates: [],
      userCandidateIds: [],
    };
    group.candidates.push(candidate);
    if (candidate.source === "case_graph") {
      group.userCandidateIds.push(candidateId);
    }
    groups.set(key, group);
  }

  return Array.from(groups.values()).sort(
    (left, right) =>
      left.type.localeCompare(right.type) || left.value.localeCompare(right.value),
  );
}

export function AttackGraphIocCandidates({
  candidates,
  deletingCandidateIds = new Set(),
  error = "",
  loading = false,
  onDelete,
  onRefresh,
  onSelectedCandidateIdsChange,
  onStartVerification,
  selectedCandidateIds,
}: AttackGraphIocCandidatesProps) {
  const groups = groupAttackGraphIocCandidates(candidates);
  const allCandidateIds = candidates
    .map((candidate) => (candidate.candidate_id || candidate.id).trim())
    .filter(Boolean);
  const allSelected =
    allCandidateIds.length > 0 &&
    allCandidateIds.every((candidateId) => selectedCandidateIds.has(candidateId));
  const selectedGroupCount = groups.filter((group) =>
    group.candidates.some((candidate) =>
      selectedCandidateIds.has(candidate.candidate_id || candidate.id),
    ),
  ).length;

  const toggleAll = (checked: boolean) => {
    onSelectedCandidateIdsChange(checked ? new Set(allCandidateIds) : new Set());
  };

  const toggleGroup = (group: AttackGraphIocCandidateGroup, checked: boolean) => {
    const next = new Set(selectedCandidateIds);
    for (const candidate of group.candidates) {
      const candidateId = candidate.candidate_id || candidate.id;
      if (checked) next.add(candidateId);
      else next.delete(candidateId);
    }
    onSelectedCandidateIdsChange(next);
  };

  if (loading && groups.length === 0) {
    return (
      <div className="flex h-[244px] w-full min-w-0 items-center justify-center gap-2 text-sm text-slate-500" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        正在加载预检 IOC
      </div>
    );
  }

  if (error && groups.length === 0) {
    return (
      <div className="flex h-[244px] w-full min-w-0 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-semibold text-slate-800">预检 IOC 加载失败</p>
        <p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">{error}</p>
        <Button type="button" variant="outline" size="sm" className="mt-3 h-10 bg-white" onClick={() => void onRefresh()}>
          <RefreshCw className="h-4 w-4" />
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div className="flex max-h-[300px] w-full min-w-0 flex-col">
      <div className="min-h-0 overflow-auto">
        {groups.length === 0 ? (
          <div className="flex h-[188px] flex-col items-center justify-center text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <ScanSearch className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-800">暂无预检 IOC</p>
          </div>
        ) : (
          <table className="w-full min-w-[720px] table-fixed border-collapse text-left">
            <caption className="sr-only">当前案件预检 IOC 清单</caption>
            <colgroup>
              <col className="w-12" />
              <col className="w-[42%]" />
              <col className="w-24" />
              <col />
              <col className="w-20" />
              <col className="w-14" />
            </colgroup>
            <thead className="sticky top-0 z-[1] bg-white">
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                <th className="px-4 py-2.5">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => toggleAll(checked === true)}
                    aria-label="选择全部预检 IOC"
                  />
                </th>
                <th className="px-2 py-2.5">IOC</th>
                <th className="px-3 py-2.5">类型</th>
                <th className="px-3 py-2.5">来源</th>
                <th className="px-3 py-2.5">状态</th>
                <th className="px-2 py-2.5"><span className="sr-only">操作</span></th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const groupCandidateIds = group.candidates.map(
                  (candidate) => candidate.candidate_id || candidate.id,
                );
                const groupSelected = groupCandidateIds.every((candidateId) =>
                  selectedCandidateIds.has(candidateId),
                );
                const deleting = group.userCandidateIds.some((candidateId) =>
                  deletingCandidateIds.has(candidateId),
                );
                const Icon = getIocTypeIcon(group.type);
                const status = getIocGroupStatus(group);

                return (
                  <tr key={group.key} className="border-b border-slate-100 text-xs text-slate-700 last:border-b-0 hover:bg-slate-50/80">
                    <td className="px-4 py-2">
                      <Checkbox
                        checked={groupSelected}
                        onCheckedChange={(checked) => toggleGroup(group, checked === true)}
                        aria-label={`选择 ${group.value}`}
                      />
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <code className="block min-w-0 truncate text-[11px] font-semibold text-slate-900" title={group.value}>
                          {group.value}
                        </code>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">
                        {IOC_TYPE_LABELS[group.type] ?? group.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-slate-700">{group.candidates.length} 个来源</div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {group.userCandidateIds.length > 0
                          ? `${group.userCandidateIds.length} 个图谱添加`
                          : "自动分析"}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold ${status.textClass}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} aria-hidden="true" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      {group.userCandidateIds.length > 0 ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={deleting}
                              className="h-10 w-10 text-slate-500 hover:bg-red-50 hover:text-red-600"
                              aria-label={`删除自添加 IOC ${group.value}`}
                              title="删除自添加来源"
                            >
                              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>删除自添加 IOC？</AlertDialogTitle>
                              <AlertDialogDescription>
                                将删除该 IOC 的 {group.userCandidateIds.length} 个图谱添加来源，自动分析来源不会受到影响。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 text-white hover:bg-red-700"
                                onClick={() => void onDelete(group.userCandidateIds)}
                              >
                                删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/70 px-4 py-2">
        <div className="flex min-w-0 items-center gap-3 text-xs text-slate-500">
          <span>共 {groups.length} 个 IOC</span>
          <span className="h-3 w-px bg-slate-300" aria-hidden="true" />
          <span>已选择 {selectedGroupCount} 个</span>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-label="正在刷新" /> : null}
        </div>
        <Button
          type="button"
          size="sm"
          disabled={selectedCandidateIds.size === 0}
          onClick={() => onStartVerification(Array.from(selectedCandidateIds))}
          className="h-10 shrink-0 bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
        >
          <Play className="h-4 w-4" />
          开始 IOC 检测
        </Button>
      </div>
    </div>
  );
}

function getIocTypeIcon(type: string) {
  if (type === "ip") return Network;
  if (type === "domain" || type === "url") return Globe2;
  return FileKey;
}

function getIocGroupStatus(group: AttackGraphIocCandidateGroup) {
  const statuses = new Set(group.candidates.map((candidate) => candidate.status));
  if (statuses.has("hit")) {
    return { label: "命中", textClass: "text-red-700", dotClass: "bg-red-500" };
  }
  if (statuses.has("error")) {
    return { label: "检测失败", textClass: "text-amber-700", dotClass: "bg-amber-500" };
  }
  if (statuses.has("checking")) {
    return { label: "检测中", textClass: "text-blue-700", dotClass: "bg-blue-500" };
  }
  if (statuses.has("miss") || statuses.has("allowlisted") || statuses.has("suppressed")) {
    return { label: "已检测", textClass: "text-emerald-700", dotClass: "bg-emerald-500" };
  }
  return { label: "待检测", textClass: "text-slate-600", dotClass: "bg-slate-400" };
}
