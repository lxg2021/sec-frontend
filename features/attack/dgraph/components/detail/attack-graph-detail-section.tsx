import { cn } from "@/shared/lib/utils";
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
  onToggleExpanded,
  section,
  sectionIndex,
}: {
  data: AttackGraphDetailData;
  expandedFields: Set<string>;
  onToggleExpanded: (fieldId: string) => void;
  section: AttackGraphDetailSectionConfig;
  sectionIndex: number;
}) {
  const SectionIcon = getAttackGraphDetailIcon(section.icon);
  const tone = section.resolveTone?.(data) ?? section.tone ?? "slate";

  return (
    <div>
      {sectionIndex > 0 ? <Separator className="mb-5" /> : null}
      <section className="space-y-4">
        <h4
          className={cn(
            "flex items-center gap-2 text-lg font-semibold",
            ATTACK_GRAPH_DETAIL_SECTION_TONE_CLASS_NAMES[tone],
          )}
        >
          <SectionIcon className="h-5 w-5" />
          {section.title}
        </h4>
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
      </section>
    </div>
  );
}
