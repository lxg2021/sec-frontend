"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  ChevronDown,
  CircleDot,
  FileKey,
  Globe2,
  Hash,
  LocateFixed,
  Loader2,
  Network,
  Play,
  RefreshCw,
  ScanSearch,
  Trash2,
} from "lucide-react";

import type { IocVerificationItem } from "@/features/ioc-analysis/types";
import { VerdictBadge } from "@/features/ioc-analysis/components/ioc-verification-badges";
import { riskText } from "@/features/ioc-analysis/components/ioc-verification-display-utils";
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
import { buildAttackGraphIocIdentityKey } from "../../model/node/attack-graph-ioc-config";

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
  return buildAttackGraphIocIdentityKey(type, value);
}

export function getAttackGraphIocRepresentativeCandidateId(
  group: AttackGraphIocCandidateGroup,
) {
  const candidate = getAttackGraphIocRepresentativeCandidate(group);
  return candidate ? (candidate.candidate_id || candidate.id).trim() : "";
}

function getAttackGraphIocRepresentativeCandidate(
  group: AttackGraphIocCandidateGroup,
) {
  return (
    group.candidates.find((item) => item.source === "case_evidence") ??
    group.candidates[0]
  );
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
  const t = useTranslations("pages.attack.drill.controlPanel");
  const groups = groupAttackGraphIocCandidates(candidates);
  const representativeCandidateIds = groups
    .map(getAttackGraphIocRepresentativeCandidateId)
    .filter(Boolean);
  const allSelected =
    representativeCandidateIds.length > 0 &&
    representativeCandidateIds.every((candidateId) =>
      selectedCandidateIds.has(candidateId),
    );
  const selectedRepresentativeCandidateIds = representativeCandidateIds.filter(
    (candidateId) => selectedCandidateIds.has(candidateId),
  );
  const selectedGroupCount = selectedRepresentativeCandidateIds.length;

  const toggleAll = (checked: boolean) => {
    onSelectedCandidateIdsChange(
      checked ? new Set(representativeCandidateIds) : new Set(),
    );
  };

  const toggleGroup = (group: AttackGraphIocCandidateGroup, checked: boolean) => {
    const next = new Set(selectedCandidateIds);
    for (const candidate of group.candidates) {
      const candidateId = candidate.candidate_id || candidate.id;
      next.delete(candidateId);
    }
    if (checked) {
      const representativeCandidateId =
        getAttackGraphIocRepresentativeCandidateId(group);
      if (representativeCandidateId) next.add(representativeCandidateId);
    }
    onSelectedCandidateIdsChange(next);
  };

  if (loading && groups.length === 0) {
    return (
      <div className="flex h-[244px] w-full min-w-0 items-center justify-center gap-2 text-sm text-slate-500" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {t("ioc.loading")}
      </div>
    );
  }

  if (error && groups.length === 0) {
    return (
      <div
        className="flex h-[244px] w-full min-w-0 flex-col items-center justify-center px-6 text-center"
        role="alert"
      >
        <p className="text-sm font-semibold text-slate-800">
          {t("ioc.loadFailed")}
        </p>
        <p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">{error}</p>
        <Button type="button" variant="outline" size="sm" className="mt-3 h-10 bg-white" onClick={() => void onRefresh()}>
          <RefreshCw className="h-4 w-4" />
          {t("ioc.reload")}
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
            <p className="mt-3 text-sm font-semibold text-slate-800">
              {t("ioc.empty")}
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[900px] table-fixed border-collapse text-left">
            <caption className="sr-only">{t("ioc.caption")}</caption>
            <colgroup>
              <col className="w-12" />
              <col className="w-[28.571%]" />
              <col className="w-[28.571%]" />
              <col className="w-[14.286%]" />
              <col className="w-[14.286%]" />
              <col className="w-[14.286%]" />
              <col className="w-14" />
            </colgroup>
            <thead className="sticky top-0 z-[2] bg-slate-50/95 backdrop-blur-sm">
              <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500">
                <th className="px-4 py-2.5">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => toggleAll(checked === true)}
                    aria-label={t("ioc.selectAll")}
                  />
                </th>
                <th className="px-2 py-2.5">
                  <span className="flex items-center gap-2.5">
                    <span className="w-8 shrink-0" aria-hidden="true" />
                    <span>IOC</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="flex items-center gap-2.5 px-1">
                    <span className="w-8 shrink-0" aria-hidden="true" />
                    <span>{t("ioc.columns.nodes")}</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">{t("ioc.columns.source")}</th>
                <th className="px-3 py-2.5 text-center">{t("ioc.columns.verdict")}</th>
                <th className="px-3 py-2.5 text-center">{t("ioc.columns.risk")}</th>
                <th className="px-2 py-2.5"><span className="sr-only">{t("ioc.columns.actions")}</span></th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const representativeCandidate =
                  getAttackGraphIocRepresentativeCandidate(group);
                const representativeCandidateId =
                  getAttackGraphIocRepresentativeCandidateId(group);
                const groupSelected = Boolean(
                  representativeCandidateId &&
                    selectedCandidateIds.has(representativeCandidateId),
                );
                const deleting = group.userCandidateIds.some((candidateId) =>
                  deletingCandidateIds.has(candidateId),
                );
                const Icon = getIocTypeIcon(group.type);
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
                        aria-label={t("ioc.selectItem", { value: group.value })}
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
                        {t(`ioc.sources.${getIocSourceKey(group)}`)}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {t("ioc.evidenceCount", {
                          count: group.candidates.length,
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      {representativeCandidate ? (
                        <VerdictBadge item={representativeCandidate} />
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <span className="font-mono text-xs font-medium tabular-nums text-slate-500">
                        {representativeCandidate
                          ? riskText(representativeCandidate).toLocaleLowerCase()
                          : "-"}
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
                              aria-label={t("ioc.deleteAria", {
                                value: group.value,
                              })}
                              title={t("ioc.deleteSource")}
                            >
                              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("ioc.deleteDialogTitle")}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("ioc.deleteDialogDescription", {
                                  count: group.userCandidateIds.length,
                                })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("ioc.cancel")}</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 text-white hover:bg-red-700"
                                onClick={() => void onDelete(group.userCandidateIds)}
                              >
                                {t("ioc.delete")}
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
          <span className="font-semibold text-slate-800">
            {t("ioc.selectedCount", { count: selectedGroupCount })}
          </span>
          <span className="h-4 w-px bg-slate-300" aria-hidden="true" />
          <span>{t("ioc.totalCount", { count: groups.length })}</span>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-label={t("ioc.refreshing")} /> : null}
        </div>
        <Button
          type="button"
          size="sm"
          disabled={selectedRepresentativeCandidateIds.length === 0}
          onClick={() => onStartVerification(selectedRepresentativeCandidateIds)}
          className="h-10 shrink-0 rounded-xl bg-slate-900 px-3.5 pr-4 text-xs font-semibold text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.75)] hover:bg-slate-800 focus-visible:ring-slate-950 disabled:shadow-none"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
            <Play className="h-3.5 w-3.5 fill-current" />
          </span>
          {t("ioc.verify")}
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
  const t = useTranslations("pages.attack.drill.controlPanel");
  const [open, setOpen] = useState(false);

  if (nodes.length === 0) {
    return (
      <div className="flex min-w-0 items-center gap-2.5 text-slate-400">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200">
          <CircleDot className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="truncate font-medium text-slate-500">
            {t("ioc.nodes.unmatched")}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">
            {t("ioc.nodes.noLocatable")}
          </div>
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
        aria-label={t("ioc.nodes.locateAria", { node: node.displayName })}
        title={t("ioc.nodes.locateTitle", { id: node.id })}
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
          aria-label={t("ioc.nodes.selectAria", { count: nodes.length })}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-100">
            <LocateFixed className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900">
              {t("ioc.nodes.associatedCount", { count: nodes.length })}
            </div>
            <div className="mt-0.5 truncate text-[10px] text-slate-500">
              {getNodeDisplayLabel(nodes[0])}
              {nodes.length > 1 ? ` +${nodes.length - 1}` : ""}
            </div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-[320px] max-w-[calc(100vw-32px)] rounded-xl border-slate-200 bg-white p-2 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)]"
      >
        <div className="px-2 pb-2 pt-1 text-xs font-semibold text-slate-700">
          {t("ioc.nodes.selectTitle")}
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
              title={`${node.displayName}\n${node.id}`}
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
  const t = useTranslations("pages.attack.drill.controlPanel");
  return (
    <div className="min-w-0 flex-1">
      <div className="truncate font-semibold text-slate-900" title={node.displayName}>
        {getNodeDisplayLabel(node)}
      </div>
      <div className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
        {node.entityType} · {shortenNodeId(node.id)} ·{" "}
        {node.graphOrigin === "drill_graph"
          ? t("ioc.nodes.drillGraph")
          : t("ioc.nodes.baseGraph")}
      </div>
    </div>
  );
}

function getNodeDisplayLabel(node: AttackGraphIocNodeAssociation) {
  const displayName = node.displayName.trim();
  if (!displayName) return shortenNodeId(node.id);

  const normalizedPath = displayName.replace(/\\/g, "/").replace(/\/+$/, "");
  const looksLikeUrl = /^[a-z][a-z0-9+.-]*:\/\//i.test(normalizedPath);
  const lastSeparatorIndex = normalizedPath.lastIndexOf("/");
  const compactName =
    !looksLikeUrl && lastSeparatorIndex >= 0
      ? normalizedPath.slice(lastSeparatorIndex + 1)
      : displayName;
  return shortenDisplayValue(compactName || displayName);
}

function shortenDisplayValue(value: string) {
  if (value.length <= 32) return value;
  return `${value.slice(0, 21)}...${value.slice(-8)}`;
}

function shortenNodeId(nodeId: string) {
  if (nodeId.length <= 22) return nodeId;
  return `${nodeId.slice(0, 12)}...${nodeId.slice(-6)}`;
}

function getIocSourceKey(group: AttackGraphIocCandidateGroup) {
  const automaticCount = group.candidates.length - group.userCandidateIds.length;
  if (automaticCount > 0 && group.userCandidateIds.length > 0) {
    return "mixed" as const;
  }
  if (group.userCandidateIds.length > 0) return "graph" as const;
  return "automatic" as const;
}

function getIocTypeIcon(type: string) {
  if (type === "ip") return Network;
  if (type === "domain" || type === "url") return Globe2;
  if (type === "md5" || type === "sha1" || type === "sha256") return Hash;
  return FileKey;
}
