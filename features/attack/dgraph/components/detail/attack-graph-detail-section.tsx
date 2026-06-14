import { ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";

import type {
  AttackGraphDetailData,
  AttackGraphDetailSectionConfig,
} from "../../model/detail/attack-graph-detail-config-types";
import { AttackGraphDetailField } from "./attack-graph-detail-field";
import {
  ATTACK_GRAPH_DETAIL_SECTION_TONE_CLASS_NAMES,
  getAttackGraphDetailIcon,
} from "./attack-graph-detail-presentation";

export function AttackGraphDetailSection({
  data,
  expandedFields,
  expandedSections,
  onToggleExpanded,
  onToggleSectionExpanded,
  section,
  sectionIndex,
}: {
  data: AttackGraphDetailData;
  expandedFields: Set<string>;
  expandedSections: Set<string>;
  onToggleExpanded: (fieldId: string) => void;
  onToggleSectionExpanded: (sectionId: string) => void;
  section: AttackGraphDetailSectionConfig;
  sectionIndex: number;
}) {
  const SectionIcon = getAttackGraphDetailIcon(section.icon);
  const tone = section.resolveTone?.(data) ?? section.tone ?? "slate";
  const sectionId = `${section.title}-${sectionIndex}`;
  const isCollapsed =
    section.defaultCollapsed && !expandedSections.has(sectionId);
  const ToggleIcon = isCollapsed ? ChevronRight : ChevronDown;

  return (
    <div>
      {sectionIndex > 0 ? <Separator className="mb-5" /> : null}
      <section className="space-y-4">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <h4
            className={cn(
              "flex min-w-0 items-center gap-2 text-lg font-semibold",
              ATTACK_GRAPH_DETAIL_SECTION_TONE_CLASS_NAMES[tone],
            )}
          >
            <SectionIcon className="h-5 w-5 shrink-0" />
            <span className="truncate">{section.title}</span>
          </h4>
          {section.defaultCollapsed ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 shrink-0 gap-1 px-2 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              onClick={() => onToggleSectionExpanded(sectionId)}
              aria-expanded={!isCollapsed}
            >
              <ToggleIcon className="h-3.5 w-3.5" />
              {isCollapsed ? "Expand" : "Collapse"}
            </Button>
          ) : null}
        </div>
        {isCollapsed ? null : (
          <div
            className={cn(
              "grid grid-cols-1 gap-3",
              section.columns === 1 ? "" : "md:grid-cols-2",
            )}
          >
            {section.fields.map((field, fieldIndex) => {
              const fieldId = `${sectionIndex}-${fieldIndex}`;
              return (
                <AttackGraphDetailField
                  key={`${field.key}-${fieldIndex}`}
                  className={
                    field.display === "block" || field.display === "code"
                      ? "md:col-span-2"
                      : undefined
                  }
                  data={data}
                  expanded={expandedFields.has(fieldId)}
                  field={field}
                  fieldId={fieldId}
                  onToggleExpanded={onToggleExpanded}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
