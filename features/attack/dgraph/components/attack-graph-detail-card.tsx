"use client";

import {
  Activity,
  BadgeInfo,
  ChevronDown,
  ChevronUp,
  Clock,
  Code,
  Copy,
  Database,
  Disc,
  Eye,
  EyeOff,
  FileText,
  Fingerprint,
  FolderOpen,
  GitBranch,
  HardDrive,
  Hash,
  Info,
  Key,
  Languages,
  Lock,
  Monitor,
  Network,
  Server,
  Shield,
  Tag,
  Terminal,
  Usb,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

import type {
  AttackGraphEdgeModel,
  AttackGraphNodeModel,
} from "../model/core/attack-graph-data";
import type {
  AttackGraphBadge,
  AttackGraphPresentationTone,
} from "../model/detail/attack-graph-detail-types";
import {
  getAttackGraphSelectedEdgeSummary,
  getAttackGraphSelectedNodeSummary,
} from "../model/detail/attack-graph-detail-resolver";
import type {
  AttackGraphDetailBadgeConfig,
  AttackGraphDetailCardConfig,
  AttackGraphDetailData,
  AttackGraphDetailFieldConfig,
  AttackGraphDetailHeaderFieldConfig,
  AttackGraphDetailIconName,
} from "../model/detail/attack-graph-detail-config-types";
import {
  getAttackGraphNodeDetailConfig,
  toAttackGraphNodeDetailData,
} from "../model/detail/attack-graph-node-detail-config-map";

export type AttackGraphDetailCardItem =
  | { kind: "node"; node: AttackGraphNodeModel }
  | { kind: "edge"; edge: AttackGraphEdgeModel };

export interface AttackGraphDetailCardProps {
  item: AttackGraphDetailCardItem | null;
  className?: string;
  nodesById?: Map<string, AttackGraphNodeModel>;
  onClose?: () => void;
}

const ICONS: Record<AttackGraphDetailIconName, LucideIcon> = {
  Activity,
  BadgeInfo,
  Clock,
  Code,
  Database,
  Disc,
  Eye,
  EyeOff,
  FileText,
  Fingerprint,
  FolderOpen,
  GitBranch,
  HardDrive,
  Hash,
  Info,
  Key,
  Languages,
  Lock,
  Monitor,
  Network,
  Server,
  Shield,
  Tag,
  Terminal,
  Usb,
  User,
};

const TONE_CLASS_NAMES: Record<AttackGraphPresentationTone, string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  orange: "border-orange-200 bg-orange-50 text-orange-700",
  pink: "border-pink-200 bg-pink-50 text-pink-700",
  purple: "border-purple-200 bg-purple-50 text-purple-700",
  red: "border-rose-200 bg-rose-50 text-rose-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
};

const SECTION_TONE_CLASS_NAMES: Record<AttackGraphPresentationTone, string> = {
  amber: "text-amber-700",
  blue: "text-blue-700",
  cyan: "text-cyan-700",
  green: "text-emerald-700",
  orange: "text-orange-700",
  pink: "text-pink-700",
  purple: "text-purple-700",
  red: "text-rose-700",
  slate: "text-slate-700",
};

const FIELD_TONE_CLASS_NAMES: Record<AttackGraphPresentationTone, string> = {
  amber: "text-amber-700",
  blue: "text-blue-700",
  cyan: "text-cyan-700",
  green: "text-emerald-700",
  orange: "text-orange-700",
  pink: "text-pink-700",
  purple: "text-purple-700",
  red: "text-rose-600",
  slate: "text-gray-600",
};

export function AttackGraphDetailCard({
  item,
  className,
  nodesById,
  onClose,
}: AttackGraphDetailCardProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(
    () => new Set(),
  );

  const content = useMemo(() => {
    if (!item) {
      return null;
    }

    if (item.kind === "node") {
      const config = getAttackGraphNodeDetailConfig(item.node);
      const data = toAttackGraphNodeDetailData(item.node);
      const summary = getAttackGraphSelectedNodeSummary(item.node);
      return {
        config,
        data,
        summaryBadges: summary.badges,
        titleFallback: summary.title,
      };
    }

    const summary = getAttackGraphSelectedEdgeSummary(item.edge, nodesById);
    const sourceNode = nodesById?.get(item.edge.source);
    const targetNode = nodesById?.get(item.edge.target);
    return {
      config: buildEdgeDetailConfig(summary.label),
      data: toEdgeDetailData(
        item.edge,
        sourceNode
          ? getAttackGraphSelectedNodeSummary(sourceNode).title
          : item.edge.source,
        targetNode
          ? getAttackGraphSelectedNodeSummary(targetNode).title
          : item.edge.target,
      ),
      summaryBadges: summary.badges,
      titleFallback: summary.label,
    };
  }, [item, nodesById]);

  if (!item || !content) {
    return null;
  }

  const HeaderIcon = getIcon(content.config.header.icon);
  const headerIconTone = content.config.header.iconTone ?? "slate";
  const title =
    readDetailValue(content.data, content.config.header.title.key) ||
    content.titleFallback ||
    content.config.header.title.fallback ||
    "Details";
  const toggleExpanded = (fieldId: string) => {
    setExpandedFields((current) => {
      const next = new Set(current);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "pointer-events-auto absolute bottom-4 right-4 top-4 z-20 flex w-[720px] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-[0_18px_46px_rgba(15,23,42,0.18)] backdrop-blur",
        className,
      )}
      data-attack-graph-detail-card={item.kind}
    >
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-0 bg-transparent shadow-none">
        <CardHeader className="shrink-0 border-b border-slate-100 p-4 pb-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex min-w-0 items-center gap-2 text-xl font-semibold leading-6 text-slate-950">
              <HeaderIcon
                className={cn(
                  "h-5 w-5 shrink-0",
                  FIELD_TONE_CLASS_NAMES[headerIconTone],
                )}
              />
              <TruncatedText value={title} className="text-slate-950" />
            </CardTitle>

            <div className="flex shrink-0 items-center gap-2">
              <HeaderBadges
                badges={content.config.header.badges ?? []}
                data={content.data}
                fallbackBadges={content.summaryBadges}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                onClick={onClose}
                aria-label="Close detail"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <HeaderFields
              data={content.data}
              fields={content.config.header.fields ?? []}
            />
          </div>
        </CardHeader>

        <ScrollArea className="min-h-0 flex-1">
          <CardContent className="space-y-6 p-4 pt-5">
            {content.config.sections.length > 0 ? (
              content.config.sections.map((section, sectionIndex) => {
                const SectionIcon = getIcon(section.icon);
                const tone = section.tone ?? "slate";
                return (
                  <div key={`${section.title}-${sectionIndex}`}>
                    {sectionIndex > 0 ? <Separator className="mb-5" /> : null}
                    <section className="space-y-4">
                      <h4
                        className={cn(
                          "flex items-center gap-2 text-lg font-semibold",
                          SECTION_TONE_CLASS_NAMES[tone],
                        )}
                      >
                        <SectionIcon className="h-5 w-5" />
                        {section.title}
                      </h4>
                      <div
                        className={cn(
                          "grid grid-cols-1 gap-3",
                          section.columns === 1
                            ? ""
                            : "md:grid-cols-2",
                        )}
                      >
                        {section.fields.map((field, fieldIndex) => {
                          const fieldId = `${sectionIndex}-${fieldIndex}`;
                          return (
                            <DetailField
                              key={`${field.key}-${fieldIndex}`}
                              className={
                                field.display === "block" || field.display === "code"
                                  ? "md:col-span-2"
                                  : undefined
                              }
                              data={content.data}
                              expanded={expandedFields.has(fieldId)}
                              field={field}
                              fieldId={fieldId}
                              onToggleExpanded={toggleExpanded}
                            />
                          );
                        })}
                      </div>
                    </section>
                  </div>
                );
              })
            ) : (
              <div className="rounded-md border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
                暂无详情字段
              </div>
            )}
          </CardContent>
        </ScrollArea>
      </Card>
    </aside>
  );
}

function HeaderBadges({
  badges,
  data,
  fallbackBadges,
}: {
  badges: AttackGraphDetailBadgeConfig[];
  data: AttackGraphDetailData;
  fallbackBadges: AttackGraphBadge[];
}) {
  if (badges.length > 0) {
    return (
      <>
        {badges.map((badge) => {
          const value = readDetailValue(data, badge.key);
          if (badge.customRender) {
            return <div key={badge.key}>{badge.customRender(value, data)}</div>;
          }

          const tone = badge.tone ?? "slate";
          return (
            <Badge
              key={badge.key}
              variant="outline"
              className={cn(
                "max-w-[120px] rounded-md px-2 py-0.5 text-xs font-medium",
                TONE_CLASS_NAMES[tone],
              )}
              title={formatDetailValue(value)}
            >
              <span className="truncate">
                {badge.label ? `${badge.label}: ` : ""}
                {formatDetailValue(value)}
              </span>
            </Badge>
          );
        })}
      </>
    );
  }

  return (
    <>
      {fallbackBadges.map((badge) => {
        const tone = badge.tone ?? "slate";
        return (
          <Badge
            key={badge.key}
            variant="outline"
            className={cn(
              "max-w-[120px] rounded-md px-2 py-0.5 text-xs font-medium",
              TONE_CLASS_NAMES[tone],
            )}
            title={badge.title}
          >
            <span className="truncate">{badge.label}</span>
          </Badge>
        );
      })}
    </>
  );
}

function HeaderFields({
  data,
  fields,
}: {
  data: AttackGraphDetailData;
  fields: AttackGraphDetailHeaderFieldConfig[];
}) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-3 text-sm text-gray-600 sm:grid-cols-[minmax(0,1fr)_max-content]">
      {fields.map((field) => {
        const rawValue = readDetailValue(data, field.key);
        const formattedValue = field.formatValue
          ? field.formatValue(rawValue, data)
          : formatDetailValue(rawValue);
        const resolvedIcon = field.resolveIcon?.(rawValue, data);
        const resolvedTone = field.resolveTone?.(rawValue, data);
        const Icon = getIcon(resolvedIcon ?? field.icon);
        const iconTone =
          field.iconTone ?? resolvedTone ?? field.tone ?? "slate";
        const valueTone =
          field.valueTone ?? resolvedTone ?? field.tone ?? "slate";
        return (
          <div key={field.key} className="flex min-w-0 items-center gap-2">
            <Icon
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                FIELD_TONE_CLASS_NAMES[iconTone],
              )}
            />
            <span className="shrink-0 font-medium text-gray-700">
              {field.label}:
            </span>
            <TruncatedText
              value={formattedValue}
              tooltipValue={
                field.formatValue
                  ? `${formattedValue}\nRaw: ${rawValue}`
                  : rawValue
              }
              className={cn(
                FIELD_TONE_CLASS_NAMES[valueTone],
                field.mono ? "font-mono text-xs" : "",
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

function DetailField({
  className,
  data,
  expanded,
  field,
  fieldId,
  onToggleExpanded,
}: {
  className?: string;
  data: AttackGraphDetailData;
  expanded: boolean;
  field: AttackGraphDetailFieldConfig;
  fieldId: string;
  onToggleExpanded: (fieldId: string) => void;
}) {
  const stringValue = readDetailValue(data, field.key);
  const formattedValue = field.formatValue
    ? field.formatValue(stringValue, data)
    : formatDetailValue(stringValue);
  const hasValue = stringValue.length > 0;
  const renderedValue = field.customRender
    ? field.customRender(stringValue, data)
    : null;
  const canExpand = false;
  const canPopover =
    hasValue &&
    field.showInPopover &&
    field.maxLength !== undefined &&
    stringValue.length > field.maxLength;
  const displayValue = formattedValue;
  const resolvedIcon = field.resolveIcon?.(stringValue, data);
  const resolvedTone = field.resolveTone?.(stringValue, data);
  const Icon = getIcon(resolvedIcon ?? field.icon);
  const tone = resolvedTone ?? field.tone ?? "slate";
  const iconTone = field.iconTone ?? tone;
  const valueTone = field.valueTone ?? tone;
  const display = field.display ?? "inline";
  const valueClassName = cn(
    FIELD_TONE_CLASS_NAMES[valueTone],
    field.bold ? "font-semibold" : "",
    field.mono ? "font-mono text-xs" : "",
  );
  const fieldActions = (
    <FieldActions
      canExpand={canExpand}
      canPopover={canPopover}
      expanded={expanded}
      field={field}
      fieldId={fieldId}
      onToggleExpanded={onToggleExpanded}
      showCopy={hasValue && Boolean(field.copyable)}
      stringValue={stringValue}
    />
  );

  if ((display === "block" || display === "code") && hasValue) {
    return (
      <div className={cn("min-w-0 text-sm", className)}>
        <div className="mb-1.5 flex min-w-0 items-center gap-2">
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              FIELD_TONE_CLASS_NAMES[iconTone],
            )}
          />
          <span className="min-w-0 font-medium text-gray-700">
            {field.label}
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {fieldActions}
          </div>
        </div>
        {renderedValue ? (
          <div
            className={cn(
              "min-w-0 overflow-hidden",
              display === "code"
                ? cn(
                    valueClassName,
                    "rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs leading-5",
                  )
                : cn(valueClassName, "pl-6 leading-5"),
            )}
            title={stringValue}
          >
            {renderedValue}
          </div>
        ) : (
          <TruncatedText
            value={displayValue}
            tooltipValue={
              field.formatValue ? `${displayValue}\nRaw: ${stringValue}` : stringValue
            }
            className={cn(
              valueClassName,
              display === "code"
                ? "rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs leading-5"
                : "pl-6 leading-5",
            )}
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-[24px] items-start gap-2 text-sm", className)}>
      <Icon
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            FIELD_TONE_CLASS_NAMES[iconTone],
          )}
        />
      <span className="shrink-0 font-medium text-gray-700">{field.label}:</span>
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {renderedValue ? (
          <span className={cn(valueClassName, "min-w-0 truncate")} title={stringValue}>
            {renderedValue}
          </span>
        ) : (
          <TruncatedText
            value={displayValue}
            tooltipValue={
              field.formatValue ? `${displayValue}\nRaw: ${stringValue}` : stringValue
            }
            className={valueClassName}
          />
        )}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {fieldActions}
      </div>
    </div>
  );
}

function TruncatedText({
  className,
  tooltipValue,
  value,
}: {
  className?: string;
  tooltipValue?: string;
  value: string;
}) {
  const formattedValue = formatDetailValue(value);
  const fullValue = formatDetailValue(tooltipValue ?? value);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn("block min-w-0 max-w-full truncate", className)}
          title={fullValue}
        >
          {formattedValue}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[520px] whitespace-pre-wrap break-all text-xs leading-5">
        {fullValue}
      </TooltipContent>
    </Tooltip>
  );
}

function FieldActions({
  canExpand,
  canPopover,
  expanded,
  field,
  fieldId,
  onToggleExpanded,
  showCopy,
  stringValue,
}: {
  canExpand: boolean | undefined;
  canPopover: boolean | undefined;
  expanded: boolean;
  field: AttackGraphDetailFieldConfig;
  fieldId: string;
  onToggleExpanded: (fieldId: string) => void;
  showCopy: boolean;
  stringValue: string;
}) {
  return (
    <>
      {canExpand ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleExpanded(fieldId)}
          className="h-6 px-2 text-xs"
        >
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          {expanded ? "收起" : "展开"}
        </Button>
      ) : null}

      {showCopy ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            void navigator.clipboard?.writeText(stringValue);
          }}
          className="h-6 px-2 text-xs"
        >
          <Copy className="h-3 w-3" />
        </Button>
      ) : null}

      {canPopover ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              <ChevronDown className="h-3 w-3" />
              查看
            </Button>
          </PopoverTrigger>
          <PopoverContent className="max-h-80 w-96 overflow-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-medium">{field.label}</h5>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard?.writeText(stringValue);
                  }}
                  className="h-6 px-2 text-xs"
                >
                  <Copy className="h-3 w-3" />
                  复制
                </Button>
              </div>
              <div
                className={cn(
                  "break-all whitespace-pre-wrap text-xs",
                  field.mono ? "font-mono" : "",
                )}
              >
                {stringValue}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
    </>
  );
}

function buildEdgeDetailConfig(label: string): AttackGraphDetailCardConfig {
  return {
    header: {
      icon: "GitBranch",
      title: {
        key: "relation_type",
        fallback: label,
      },
      fields: [
        { key: "source_label", label: "Source", icon: "Server" },
        { key: "target_label", label: "Target", icon: "Server" },
      ],
    },
    sections: [
      {
        title: "Edge Information",
        icon: "GitBranch",
        tone: "slate",
        fields: [
          {
            key: "relation_type",
            label: "Relation Type",
            icon: "Network",
            mono: true,
            copyable: true,
          },
          {
            key: "source",
            label: "Source Key",
            icon: "Key",
            mono: true,
            copyable: true,
          },
          {
            key: "target",
            label: "Target Key",
            icon: "Key",
            mono: true,
            copyable: true,
          },
          { key: "scope_type", label: "Scope Type", icon: "BadgeInfo", mono: true },
          {
            key: "scope_id",
            label: "Scope ID",
            icon: "Hash",
            mono: true,
            copyable: true,
          },
          {
            key: "edge_key",
            label: "Edge Key",
            icon: "Key",
            mono: true,
            copyable: true,
          },
          { key: "graph_origin", label: "Graph Origin", icon: "Info", mono: true },
        ],
      },
    ],
  };
}

function toEdgeDetailData(
  edge: AttackGraphEdgeModel,
  sourceLabel: string,
  targetLabel: string,
) {
  return {
    ...edge.properties,
    edge_key: edge.edgeKey,
    graph_origin: edge.graphOrigin,
    id: edge.id,
    relation_type: edge.relationType,
    scope_id: edge.scopeId,
    scope_type: edge.scopeType,
    source: edge.source,
    source_label: sourceLabel,
    target: edge.target,
    target_label: targetLabel,
  };
}

function getIcon(iconName: AttackGraphDetailIconName | undefined) {
  return iconName ? ICONS[iconName] ?? Info : Info;
}

function readDetailValue(data: AttackGraphDetailData, key: string) {
  return String(data[key] ?? "").trim();
}

function formatDetailValue(value: string) {
  return value.length > 0 ? value : "-";
}

export default AttackGraphDetailCard;
