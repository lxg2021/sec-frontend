"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  FileKey,
  Globe2,
  Hash,
  LocateFixed,
  Loader2,
  Network,
  Play,
  RefreshCw,
  ScanSearch,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import type { IocVerificationItem } from "@/features/ioc-analysis/types";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
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

export interface AttackGraphIocNodeAssociation {
  id: string;
  displayName: string;
  entityType: string;
  graphOrigin: "base_graph" | "drill_graph";
}

export interface AttackGraphIocCandidatesProps {
  candidates: readonly IocVerificationItem[];
  deletingCandidateIds?: ReadonlySet<string>;
  error?: string;
  loading?: boolean;
  nodeAssociationsByGroupKey?: ReadonlyMap<
    string,
    readonly AttackGraphIocNodeAssociation[]
  >;
  onDelete: (candidateIds: string[]) => void | Promise<void>;
  onLocateNode?: (nodeId: string) => void;
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

    const key = buildAttackGraphIocGroupKey(type, value);
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

export function buildAttackGraphIocGroupKey(type: string, value: string) {
  return `${type.trim().toLowerCase()}\u0000${value.trim().toLowerCase()}`;
}

export function AttackGraphIocCandidates({
  candidates,
  deletingCandidateIds = new Set(),
  error = "",
  loading = false,
  nodeAssociationsByGroupKey = new Map(),
  onDelete,
  onLocateNode,
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
          <table className="w-full min-w-[900px] table-fixed border-collapse text-left">
            <caption className="sr-only">当前案件预检 IOC 清单</caption>
            <colgroup>
              <col className="w-12" />
              <col className="w-[34%]" />
              <col className="w-[30%]" />
              <col className="w-36" />
              <col className="w-32" />
              <col className="w-14" />
            </colgroup>
            <thead className="sticky top-0 z-[2] bg-slate-50/95 backdrop-blur-sm">
              <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500">
                <th className="px-4 py-2.5">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => toggleAll(checked === true)}
                    aria-label="选择全部预检 IOC"
                  />
                </th>
                <th className="px-2 py-2.5">IOC</th>
                <th className="px-3 py-2.5">关联节点</th>
                <th className="px-3 py-2.5">来源</th>
                <th className="px-3 py-2.5">检测状态</th>
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
                const nodeAssociations =
                  nodeAssociationsByGroupKey.get(group.key) ?? [];

                return (
                  <tr
                    key={group.key}
                    className="group border-b border-slate-100/90 bg-white text-xs text-slate-700 transition-colors duration-150 last:border-b-0 hover:bg-blue-50/50 motion-reduce:transition-none"
                  >
                    <td className="px-4 py-1.5">
                      <Checkbox
                        checked={groupSelected}
                        onCheckedChange={(checked) => toggleGroup(group, checked === true)}
                        aria-label={`选择 ${group.value}`}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="flex min-w-0 items-center gap-2">
                          <code className="block min-w-0 truncate text-xs font-semibold text-slate-950" title={group.value}>
                            {group.value}
                          </code>
                          <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 ring-1 ring-inset ring-slate-200/90">
                            {IOC_TYPE_LABELS[group.type] ?? group.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <IocAssociatedNodes
                        nodes={nodeAssociations}
                        onLocateNode={onLocateNode}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="font-medium text-slate-800">
                        {getIocSourceLabel(group)}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        共 {group.candidates.length} 条证据
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`inline-flex h-7 w-[84px] items-center justify-start gap-1.5 whitespace-nowrap rounded-full px-2 text-[11px] font-semibold ring-1 ring-inset ${status.className}`}>
                        <status.Icon
                          className={`h-3.5 w-3.5 shrink-0 ${status.spinning ? "animate-spin" : ""}`}
                          aria-hidden="true"
                        />
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
                              className="h-10 w-10 rounded-full border border-transparent text-slate-500 hover:border-red-100 hover:bg-red-50 hover:text-red-600"
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

      <div className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-t border-slate-200/80 bg-slate-50/70 px-4 py-2">
        <div className="flex min-w-0 items-center gap-2.5 text-xs text-slate-500">
          <CheckCircle2
            className="h-3.5 w-3.5 shrink-0 text-slate-500"
            aria-hidden="true"
          />
          <span className="font-semibold text-slate-800">已选择 {selectedGroupCount} 个 IOC</span>
          <span className="h-4 w-px bg-slate-300" aria-hidden="true" />
          <span>共 {groups.length} 个</span>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-label="正在刷新" /> : null}
        </div>
        <Button
          type="button"
          size="sm"
          disabled={selectedCandidateIds.size === 0}
          onClick={() => onStartVerification(Array.from(selectedCandidateIds))}
          className="h-10 shrink-0 rounded-xl bg-slate-900 px-3.5 pr-4 text-xs font-semibold text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.75)] hover:bg-slate-800 focus-visible:ring-slate-950 disabled:shadow-none"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
            <Play className="h-3.5 w-3.5 fill-current" />
          </span>
          IOC 检测
        </Button>
      </div>
    </div>
  );
}

function IocAssociatedNodes({
  nodes,
  onLocateNode,
}: {
  nodes: readonly AttackGraphIocNodeAssociation[];
  onLocateNode?: (nodeId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  if (nodes.length === 0) {
    return (
      <div className="flex min-w-0 items-center gap-2.5 text-slate-400">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200">
          <CircleDot className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="truncate font-medium text-slate-500">当前图中未匹配</div>
          <div className="mt-0.5 text-[10px] text-slate-400">暂无可定位节点</div>
        </div>
      </div>
    );
  }

  if (nodes.length === 1) {
    const node = nodes[0];
    return (
      <button
        type="button"
        onClick={() => onLocateNode?.(node.id)}
        disabled={!onLocateNode}
        className="flex h-10 w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-lg px-1 text-left outline-none transition-colors duration-150 hover:bg-cyan-50/80 focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-default disabled:hover:bg-transparent motion-reduce:transition-none"
        aria-label={`定位图节点 ${node.displayName}`}
        title={`定位节点\n${node.id}`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-100">
          <LocateFixed className="h-4 w-4" aria-hidden="true" />
        </span>
        <NodeAssociationLabel node={node} />
      </button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-lg px-1 text-left outline-none transition-colors duration-150 hover:bg-cyan-50/80 focus-visible:ring-2 focus-visible:ring-cyan-500 motion-reduce:transition-none"
          aria-label={`选择要定位的节点，共 ${nodes.length} 个`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-100">
            <LocateFixed className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900">{nodes.length} 个关联节点</div>
            <div className="mt-0.5 truncate text-[10px] text-slate-500">
              {nodes.slice(0, 2).map((node) => node.displayName).join("、")}
            </div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-[360px] max-w-[calc(100vw-32px)] rounded-xl border-slate-200 bg-white p-2 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)]"
      >
        <div className="px-2 pb-2 pt-1 text-xs font-semibold text-slate-700">
          选择关联节点
        </div>
        <div className="max-h-56 space-y-1 overflow-y-auto">
          {nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => {
                setOpen(false);
                onLocateNode?.(node.id);
              }}
              className="flex min-h-12 w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left outline-none transition-colors duration-150 hover:bg-cyan-50/80 focus-visible:ring-2 focus-visible:ring-cyan-500 motion-reduce:transition-none"
              title={node.id}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                <LocateFixed className="h-4 w-4" aria-hidden="true" />
              </span>
              <NodeAssociationLabel node={node} />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NodeAssociationLabel({
  node,
}: {
  node: AttackGraphIocNodeAssociation;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="truncate font-semibold text-slate-900" title={node.displayName}>
        {node.displayName}
      </div>
      <div className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
        {node.entityType} · {shortenNodeId(node.id)} · {node.graphOrigin === "drill_graph" ? "钻探" : "基础图谱"}
      </div>
    </div>
  );
}

function shortenNodeId(nodeId: string) {
  if (nodeId.length <= 30) return nodeId;
  return `${nodeId.slice(0, 16)}...${nodeId.slice(-8)}`;
}

function getIocSourceLabel(group: AttackGraphIocCandidateGroup) {
  const automaticCount = group.candidates.length - group.userCandidateIds.length;
  if (automaticCount > 0 && group.userCandidateIds.length > 0) {
    return "自动分析 + 图谱添加";
  }
  if (group.userCandidateIds.length > 0) return "图谱添加";
  return "自动分析";
}

function getIocTypeIcon(type: string) {
  if (type === "ip") return Network;
  if (type === "domain" || type === "url") return Globe2;
  if (type === "md5" || type === "sha1" || type === "sha256") return Hash;
  return FileKey;
}

function getIocGroupStatus(group: AttackGraphIocCandidateGroup) {
  const statuses = new Set(group.candidates.map((candidate) => candidate.status));
  if (statuses.has("hit")) {
    return {
      label: "命中",
      Icon: ShieldAlert,
      className: "bg-red-50 text-red-700 ring-red-200",
      spinning: false,
    };
  }
  if (statuses.has("error")) {
    return {
      label: "检测失败",
      Icon: AlertCircle,
      className: "bg-amber-50 text-amber-800 ring-amber-200",
      spinning: false,
    };
  }
  if (statuses.has("checking")) {
    return {
      label: "检测中",
      Icon: Loader2,
      className: "bg-blue-50 text-blue-700 ring-blue-200",
      spinning: true,
    };
  }
  if (statuses.has("miss") || statuses.has("allowlisted") || statuses.has("suppressed")) {
    return {
      label: "未命中",
      Icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      spinning: false,
    };
  }
  return {
    label: "待检测",
    Icon: Clock3,
    className: "bg-slate-100 text-slate-600 ring-slate-200",
    spinning: false,
  };
}
