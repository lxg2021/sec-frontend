"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { useLocale } from "next-intl";
import {
  CalendarCheck,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Clock3,
  Copy,
  FileText,
  Hash,
  Link2,
  Play,
  RefreshCcw,
  RotateCcw,
  Shuffle,
  SlidersHorizontal,
  Tag,
} from "lucide-react";

import type {
  BaselineScanPolicyListResult,
  ReusableBaselineScanPolicy,
} from "@/features/baseline/dispatch/api";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

interface BaselineTableListProps {
  data?: BaselineScanPolicyListResult | null;
  error?: string;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  onRefresh?: () => void;
  onRowClick?: (item: ReusableBaselineScanPolicy) => void;
  onSelectionChange?: (selectedKey: string | null) => void;
  selectedKey?: string | null;
}

interface CopyableOverflowTextProps {
  value?: string;
  copyLabel: string;
  copiedLabel: string;
  textClassName?: string;
}

const COLUMN_WIDTHS = [
  "4%",
  "12%",
  "11%",
  "6%",
  "12%",
  "6%",
  "5%",
  "6%",
  "6%",
  "5.5%",
  "6%",
  "5.5%",
  "7%",
  "7%",
];

const HEADER_CELL_CLASS_NAME =
  "h-11 px-2.5 text-[11px] font-semibold text-slate-500 [&:has([role=checkbox])]:pr-0";

const BODY_CELL_CLASS_NAME =
  "px-2.5 py-3 text-[12px] [&:has([role=checkbox])]:pr-0";

const MAX_VISIBLE_ROWS = 5;
const SCROLLABLE_TABLE_MAX_HEIGHT_CLASS = "max-h-[300px]";

function getPolicyRowKey(
  item: Pick<ReusableBaselineScanPolicy, "id" | "version">,
) {
  return `${item.id}::${item.version}`;
}

function formatDateTime(value: string, locale: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(locale.startsWith("zh") ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CopyableOverflowText({
  value,
  copyLabel,
  copiedLabel,
  textClassName,
}: CopyableOverflowTextProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  if (!value) {
    return (
      <span className={cn("block truncate text-slate-400", textClassName)}>
        -
      </span>
    );
  }

  return (
    <div className="group flex min-w-0 items-center gap-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("block min-w-0 flex-1 truncate", textClassName)}>
            {value}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-[520px] break-all"
        >
          <span className={cn("block", textClassName)}>{value}</span>
        </TooltipContent>
      </Tooltip>
      <button
        type="button"
        aria-label={copied ? copiedLabel : copyLabel}
        className="shrink-0 rounded p-0.5 text-slate-400 opacity-0 transition hover:text-slate-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30 group-hover:opacity-100"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-600" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </div>
  );
}

export function BaselineTableList({
  data,
  error,
  loading = false,
  onPageChange,
  onRefresh,
  onRowClick,
  onSelectionChange,
  selectedKey,
}: BaselineTableListProps) {
  const locale = useLocale();
  const isZh = locale.toLowerCase().startsWith("zh");
  const [internalSelectedKey, setInternalSelectedKey] = useState<string | null>(
    null,
  );
  const activeSelectedKey = selectedKey ?? internalSelectedKey;
  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const shouldScroll = !loading && items.length > MAX_VISIBLE_ROWS;

  const text = useMemo(
    () =>
      isZh
        ? {
            refresh: "刷新",
            emptyTitle: "暂无基线扫描策略",
            emptyDescription: "当前基线下还没有可展示的扫描策略。",
            copy: "复制",
            copied: "已复制",
            columns: {
              policyId: "策略 ID",
              name: "策略名称",
              version: "版本",
              baselineUuid: "基线 UUID",
              mode: "调度模式",
              intervalHours: "间隔",
              specificTime: "固定时间",
              randomDelayMinutes: "随机延迟",
              retryLimit: "重试次数",
              retryIntervalMinutes: "重试间隔",
              scanOnStartup: "启动扫描",
              createdAt: "创建时间",
              updatedAt: "更新时间",
            },
            modeInterval: "固定间隔",
            retryNone: "不重试",
            startupEnabled: "开启",
            startupDisabled: "关闭",
            hoursUnit: "小时",
            minutesUnit: "分钟",
            retryTimes: (count: number) => `${count} 次`,
            pageInfo: (page: number, totalPages: number) =>
              `第 ${page} / ${totalPages} 页`,
            selectRow: (name: string) => `选择 ${name}`,
          }
        : {
            refresh: "Refresh",
            emptyTitle: "No baseline scan policies",
            emptyDescription:
              "There are no scan policies available for this baseline yet.",
            copy: "Copy",
            copied: "Copied",
            columns: {
              policyId: "Policy ID",
              name: "Name",
              version: "Ver.",
              baselineUuid: "Baseline",
              mode: "Mode",
              intervalHours: "Interval",
              specificTime: "Time",
              randomDelayMinutes: "Delay",
              retryLimit: "Retry",
              retryIntervalMinutes: "Retry Gap",
              scanOnStartup: "Startup",
              createdAt: "Created",
              updatedAt: "Updated",
            },
            modeInterval: "Interval",
            retryNone: "None",
            startupEnabled: "On",
            startupDisabled: "Off",
            hoursUnit: "h",
            minutesUnit: "min",
            retryTimes: (count: number) => `${count}x`,
            pageInfo: (page: number, totalPages: number) =>
              `Page ${page} / ${totalPages}`,
            selectRow: (name: string) => `Select ${name}`,
          },
    [isZh],
  );

  function formatScheduleMode(item: ReusableBaselineScanPolicy) {
    return item.scanSchedule.mode === "interval"
      ? text.modeInterval
      : item.scanSchedule.mode;
  }

  function formatIntervalHours(value?: number) {
    if (!Number.isFinite(value) || !value || value <= 0) {
      return "-";
    }
    return `${value} ${text.hoursUnit}`;
  }

  function formatSpecificTime(value?: string) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : "-";
  }

  function formatMinutes(value?: number) {
    if (!Number.isFinite(value)) {
      return "-";
    }
    return `${value} ${text.minutesUnit}`;
  }

  function formatRetryLimit(value?: number) {
    if (!Number.isFinite(value) || value === 0) {
      return text.retryNone;
    }
    return text.retryTimes(value ?? 0);
  }

  function handleSelectItem(policyKey: string) {
    const nextKey = activeSelectedKey === policyKey ? null : policyKey;
    setInternalSelectedKey(nextKey);
    onSelectionChange?.(nextKey);
  }

  if (!loading && error) {
    return (
      <div className="rounded-[24px] bg-rose-50 px-5 py-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-rose-900">{error}</p>
          {onRefresh ? (
            <Button
              type="button"
              variant="outline"
              onClick={onRefresh}
              className="h-10 rounded-2xl border-rose-200 bg-white text-rose-900 hover:bg-rose-50"
            >
              {text.refresh}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[24px] bg-slate-50/80 py-12 text-center text-slate-500">
        <Clock className="mb-4 size-12 opacity-50" />
        <p className="text-lg font-medium text-slate-900">{text.emptyTitle}</p>
        <p className="mt-2 text-sm">{text.emptyDescription}</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={180}>
      <div className="space-y-4">
        <div
          className={cn(
            "rounded-2xl overflow-x-hidden",
            shouldScroll
              ? `${SCROLLABLE_TABLE_MAX_HEIGHT_CLASS} overflow-y-auto`
              : "overflow-y-hidden",
          )}
        >
          <table className="w-full table-fixed text-[12px] leading-5">
            <colgroup>
              {COLUMN_WIDTHS.map((width, index) => (
                <col key={`${index}-${width}`} style={{ width }} />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow className="bg-slate-50/90">
                <TableHead
                  className={cn(
                    HEADER_CELL_CLASS_NAME,
                    shouldScroll && "sticky top-0 z-10 bg-slate-50/95",
                  )}
                />
                <TableHead
                  className={cn(
                    HEADER_CELL_CLASS_NAME,
                    "whitespace-nowrap",
                    shouldScroll && "sticky top-0 z-10 bg-slate-50/95",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Hash className="size-3.5 shrink-0 text-blue-500" />
                    <span className="truncate">{text.columns.policyId}</span>
                  </div>
                </TableHead>
                <TableHead
                  className={cn(
                    HEADER_CELL_CLASS_NAME,
                    "whitespace-nowrap",
                    shouldScroll && "sticky top-0 z-10 bg-slate-50/95",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <FileText className="size-3.5 shrink-0 text-emerald-500" />
                    <span className="truncate">{text.columns.name}</span>
                  </div>
                </TableHead>
                <TableHead
                  className={cn(
                    HEADER_CELL_CLASS_NAME,
                    "whitespace-nowrap",
                    shouldScroll && "sticky top-0 z-10 bg-slate-50/95",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Tag className="size-3.5 shrink-0 text-amber-500" />
                    <span className="truncate">{text.columns.version}</span>
                  </div>
                </TableHead>
                <TableHead
                  className={cn(
                    HEADER_CELL_CLASS_NAME,
                    "whitespace-nowrap",
                    shouldScroll && "sticky top-0 z-10 bg-slate-50/95",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Link2 className="size-3.5 shrink-0 text-violet-500" />
                    <span className="truncate">
                      {text.columns.baselineUuid}
                    </span>
                  </div>
                </TableHead>
                <TableHead
                  className={cn(
                    HEADER_CELL_CLASS_NAME,
                    "whitespace-nowrap",
                    shouldScroll && "sticky top-0 z-10 bg-slate-50/95",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <SlidersHorizontal className="size-3.5 shrink-0 text-cyan-500" />
                    <span className="truncate">{text.columns.mode}</span>
                  </div>
                </TableHead>
                <TableHead
                  className={cn(
                    HEADER_CELL_CLASS_NAME,
                    "whitespace-nowrap",
                    shouldScroll && "sticky top-0 z-10 bg-slate-50/95",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Clock3 className="size-3.5 shrink-0 text-blue-500" />
                    <span className="truncate">
                      {text.columns.intervalHours}
                    </span>
                  </div>
                </TableHead>
                <TableHead
                  className={cn(
                    HEADER_CELL_CLASS_NAME,
                    "whitespace-nowrap",
                    shouldScroll && "sticky top-0 z-10 bg-slate-50/95",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Clock className="size-3.5 shrink-0 text-emerald-500" />
                    <span className="truncate">
                      {text.columns.specificTime}
                    </span>
                  </div>
                </TableHead>
                <TableHead
                  className={cn(
                    HEADER_CELL_CLASS_NAME,
                    "whitespace-nowrap",
                    shouldScroll && "sticky top-0 z-10 bg-slate-50/95",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Shuffle className="size-3.5 shrink-0 text-amber-500" />
                    <span className="truncate">
                      {text.columns.randomDelayMinutes}
                    </span>
                  </div>
                </TableHead>
                <TableHead
                  className={cn(
                    HEADER_CELL_CLASS_NAME,
                    "whitespace-nowrap",
                    shouldScroll && "sticky top-0 z-10 bg-slate-50/95",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <RotateCcw className="size-3.5 shrink-0 text-rose-500" />
                    <span className="truncate">{text.columns.retryLimit}</span>
                  </div>
                </TableHead>
                <TableHead
                  className={cn(
                    HEADER_CELL_CLASS_NAME,
                    "whitespace-nowrap",
                    shouldScroll && "sticky top-0 z-10 bg-slate-50/95",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <RefreshCcw className="size-3.5 shrink-0 text-orange-500" />
                    <span className="truncate">
                      {text.columns.retryIntervalMinutes}
                    </span>
                  </div>
                </TableHead>
                <TableHead
                  className={cn(
                    HEADER_CELL_CLASS_NAME,
                    "whitespace-nowrap",
                    shouldScroll && "sticky top-0 z-10 bg-slate-50/95",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Play className="size-3.5 shrink-0 text-violet-500" />
                    <span className="truncate">
                      {text.columns.scanOnStartup}
                    </span>
                  </div>
                </TableHead>
                <TableHead
                  className={cn(
                    HEADER_CELL_CLASS_NAME,
                    "whitespace-nowrap",
                    shouldScroll && "sticky top-0 z-10 bg-slate-50/95",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <CalendarPlus className="size-3.5 shrink-0 text-cyan-500" />
                    <span className="truncate">{text.columns.createdAt}</span>
                  </div>
                </TableHead>
                <TableHead
                  className={cn(
                    HEADER_CELL_CLASS_NAME,
                    "whitespace-nowrap",
                    shouldScroll && "sticky top-0 z-10 bg-slate-50/95",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <CalendarCheck className="size-3.5 shrink-0 text-rose-500" />
                    <span className="truncate">{text.columns.updatedAt}</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell className={BODY_CELL_CLASS_NAME}>
                        <div className="size-4 animate-pulse rounded-full bg-slate-200" />
                      </TableCell>
                      <TableCell className={BODY_CELL_CLASS_NAME}>
                        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                      </TableCell>
                      <TableCell className={BODY_CELL_CLASS_NAME}>
                        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                      </TableCell>
                      <TableCell className={BODY_CELL_CLASS_NAME}>
                        <div className="h-6 w-12 animate-pulse rounded-full bg-slate-200" />
                      </TableCell>
                      <TableCell className={BODY_CELL_CLASS_NAME}>
                        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                      </TableCell>
                      <TableCell className={BODY_CELL_CLASS_NAME}>
                        <div className="h-6 w-full animate-pulse rounded-full bg-slate-200" />
                      </TableCell>
                      <TableCell className={BODY_CELL_CLASS_NAME}>
                        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                      </TableCell>
                      <TableCell className={BODY_CELL_CLASS_NAME}>
                        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                      </TableCell>
                      <TableCell className={BODY_CELL_CLASS_NAME}>
                        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                      </TableCell>
                      <TableCell className={BODY_CELL_CLASS_NAME}>
                        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                      </TableCell>
                      <TableCell className={BODY_CELL_CLASS_NAME}>
                        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                      </TableCell>
                      <TableCell className={BODY_CELL_CLASS_NAME}>
                        <div className="h-6 w-full animate-pulse rounded-full bg-slate-200" />
                      </TableCell>
                      <TableCell className={BODY_CELL_CLASS_NAME}>
                        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                      </TableCell>
                      <TableCell className={BODY_CELL_CLASS_NAME}>
                        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                      </TableCell>
                    </TableRow>
                  ))
                : items.map((item) => {
                    const rowKey = getPolicyRowKey(item);
                    const createdAtText = formatDateTime(
                      item.createdAt,
                      locale,
                    );
                    const updatedAtText = formatDateTime(
                      item.updatedAt,
                      locale,
                    );

                    return (
                      <TableRow
                        key={rowKey}
                        className={cn(
                          "cursor-pointer",
                          activeSelectedKey === rowKey && "bg-slate-50",
                        )}
                        onClick={() => {
                          handleSelectItem(rowKey);
                          onRowClick?.(item);
                        }}
                      >
                        <TableCell
                          className={BODY_CELL_CLASS_NAME}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div
                            role="radio"
                            aria-checked={activeSelectedKey === rowKey}
                            aria-label={text.selectRow(item.name || item.id)}
                            tabIndex={0}
                            className={cn(
                              "flex size-4 cursor-pointer items-center justify-center rounded-full border-2 transition-colors",
                              activeSelectedKey === rowKey
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/40 hover:border-primary",
                            )}
                            onClick={() => handleSelectItem(rowKey)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleSelectItem(rowKey);
                              }
                            }}
                          >
                            {activeSelectedKey === rowKey ? (
                              <div className="size-2 rounded-full bg-primary-foreground" />
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className={BODY_CELL_CLASS_NAME}>
                          <CopyableOverflowText
                            value={item.id}
                            copyLabel={text.copy}
                            copiedLabel={text.copied}
                            textClassName="font-mono text-[12px] text-slate-700"
                          />
                        </TableCell>
                        <TableCell className={BODY_CELL_CLASS_NAME}>
                          <CopyableOverflowText
                            value={item.name}
                            copyLabel={text.copy}
                            copiedLabel={text.copied}
                            textClassName="font-medium text-[12px] text-slate-950"
                          />
                        </TableCell>
                        <TableCell className={BODY_CELL_CLASS_NAME}>
                          <Badge
                            variant="secondary"
                            className="flex w-full items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap px-2 py-0.5 text-[11px]"
                            title={item.version}
                          >
                            {item.version}
                          </Badge>
                        </TableCell>
                        <TableCell className={BODY_CELL_CLASS_NAME}>
                          <CopyableOverflowText
                            value={item.baselineUuid}
                            copyLabel={text.copy}
                            copiedLabel={text.copied}
                            textClassName="font-mono text-[12px] text-slate-500"
                          />
                        </TableCell>
                        <TableCell className={BODY_CELL_CLASS_NAME}>
                          <Badge
                            variant="outline"
                            className="max-w-full truncate px-2 py-0.5 text-[11px]"
                          >
                            {formatScheduleMode(item)}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={cn(
                            BODY_CELL_CLASS_NAME,
                            "whitespace-nowrap text-slate-500",
                          )}
                        >
                          {formatIntervalHours(
                            item.scanSchedule.interval_hours,
                          )}
                        </TableCell>
                        <TableCell
                          className={cn(
                            BODY_CELL_CLASS_NAME,
                            "whitespace-nowrap text-slate-500",
                          )}
                        >
                          {formatSpecificTime(item.scanSchedule.specific_time)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            BODY_CELL_CLASS_NAME,
                            "whitespace-nowrap text-slate-500",
                          )}
                        >
                          {formatMinutes(
                            item.scanSchedule.random_delay_minutes,
                          )}
                        </TableCell>
                        <TableCell
                          className={cn(
                            BODY_CELL_CLASS_NAME,
                            "whitespace-nowrap text-slate-500",
                          )}
                        >
                          {formatRetryLimit(item.scanSchedule.retry_limit)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            BODY_CELL_CLASS_NAME,
                            "whitespace-nowrap text-slate-500",
                          )}
                        >
                          {item.scanSchedule.retry_limit === 0
                            ? "-"
                            : formatMinutes(
                                item.scanSchedule.retry_interval_minutes,
                              )}
                        </TableCell>
                        <TableCell className={BODY_CELL_CLASS_NAME}>
                          <Badge
                            variant="outline"
                            className={cn(
                              "max-w-full truncate px-2 py-0.5 text-[11px]",
                              item.scanSchedule.scan_on_startup
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-600",
                            )}
                          >
                            {item.scanSchedule.scan_on_startup
                              ? text.startupEnabled
                              : text.startupDisabled}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={cn(
                            BODY_CELL_CLASS_NAME,
                            "whitespace-nowrap text-slate-500",
                          )}
                        >
                          <span
                            className="block truncate"
                            title={createdAtText}
                          >
                            {createdAtText}
                          </span>
                        </TableCell>
                        <TableCell
                          className={cn(
                            BODY_CELL_CLASS_NAME,
                            "whitespace-nowrap text-slate-500",
                          )}
                        >
                          <span
                            className="block truncate"
                            title={updatedAtText}
                          >
                            {updatedAtText}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {text.pageInfo(pagination.currentPage, pagination.totalPages)}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(1)}
                disabled={!pagination.hasPrevious || loading}
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevious || loading}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.currentPage + 1)}
                disabled={!pagination.hasNext || loading}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.totalPages)}
                disabled={!pagination.hasNext || loading}
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
