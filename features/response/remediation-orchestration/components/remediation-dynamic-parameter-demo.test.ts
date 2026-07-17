import { describe, expect, it } from "vitest";

import enMessages from "../../../../messages/en.json";
import zhMessages from "../../../../messages/zh-CN.json";
import {
  defaultDemoValues,
  demoActionVariants,
  remediationPreviewDemoTemplates,
} from "../demo-data";
import type { RemediationActionInput } from "@/features/attack/remediation-order";

import { buildDynamicParameterDemoScenario } from "./remediation-dynamic-parameter-demo";
import {
  remediationOrderActionLabel,
  remediationOrderDisplayTemplate,
  targetSnapshotRows,
} from "./remediation-order-parameter-editor";
import {
  shouldShowRemediationRecoveryParameters,
  shouldShowRemediationTargetCandidateSelector,
} from "./remediation-order-authority-reference";

const targetBranchByTemplate: Record<string, string> = {
  process: "process",
  file: "file",
  "scheduled-task": "scheduled_task",
  service: "service",
  account: "account",
  registry: "registry",
  "wmi-class": "wmi_class",
  "wmi-subscription": "wmi_subscription",
  "bits-job": "bits_job",
  "file-ea": "file",
  "ntfs-ads": "file",
  "proc-execute": "process",
  "net-quarantine": "network",
};

function parameterTranslator(messages: typeof enMessages | typeof zhMessages) {
  const root = messages.pages.collection.orchestration
    .parameters as unknown as Record<string, unknown>;
  return (key: string) => {
    const value = key.split(".").reduce<unknown>((current, part) => {
      if (!current || typeof current !== "object") return undefined;
      return (current as Record<string, unknown>)[part];
    }, root);
    if (typeof value !== "string")
      throw new Error(`Missing parameter translation: ${key}`);
    return value;
  };
}

describe("remediation dynamic parameter demo", () => {
  it("covers all 13 parameter types and every configured action scenario", () => {
    expect(remediationPreviewDemoTemplates).toHaveLength(13);

    const scenarios = remediationPreviewDemoTemplates.flatMap((template) =>
      demoActionVariants(template).map((variant) => {
        const values = defaultDemoValues(template, variant.mode);
        const input = (variant.buildInput(values) ??
          {}) as RemediationActionInput;
        return {
          template,
          variant,
          scenario: buildDynamicParameterDemoScenario(
            template,
            variant,
            values,
            input,
          ),
        };
      }),
    );

    expect(scenarios).toHaveLength(33);
    for (const { scenario, template, variant } of scenarios) {
      expect(scenario.item.action_code).toBe(variant.actionCode);
      expect(scenario.item.agent_id).toBeTruthy();
      expect(scenario.item.target_snapshot?.status).toBe("available");
      const branch = targetBranchByTemplate[template.id];
      expect(
        scenario.item.target_snapshot?.[
          branch as keyof NonNullable<typeof scenario.item.target_snapshot>
        ],
      ).not.toBeNull();

      if (variant.requiresHistory) {
        expect(scenario.reverseSourceItemId).toBeTruthy();
        expect(scenario.sourceItems).toHaveLength(1);
        expect(
          scenario.decision.agent_decisions[0].reverse_contexts,
        ).toHaveLength(1);
      } else {
        expect(scenario.reverseSourceItemId).toBe("");
      }
    }
  });

  it("provides one auto-selectable WMI target without requiring a selector", () => {
    const template = remediationPreviewDemoTemplates.find(
      (candidate) => candidate.id === "wmi-subscription",
    )!;
    const variant = demoActionVariants(template)[0];
    const values = defaultDemoValues(template, variant.mode);
    const scenario = buildDynamicParameterDemoScenario(
      template,
      variant,
      values,
      (variant.buildInput(values) ?? {}) as RemediationActionInput,
    );

    expect(scenario.decision.agent_decisions[0].target_candidates).toHaveLength(
      1,
    );
    expect(scenario.decision.agent_decisions[0].required_input_fields).toEqual(
      [],
    );
    expect(shouldShowRemediationTargetCandidateSelector(1)).toBe(false);
    expect(shouldShowRemediationTargetCandidateSelector(2)).toBe(true);
  });

  it("shows recovery parameters only for backup restore actions", () => {
    for (const actionCode of [
      "file.restore",
      "file_ea.restore",
      "ntfs_ads.restore",
      "task.restore",
      "service.restore",
      "registry.restore",
      "wmi_class.restore",
      "wmi_subscription.restore",
      "bits.restore",
    ]) {
      expect(shouldShowRemediationRecoveryParameters(actionCode)).toBe(true);
    }

    for (const actionCode of [
      "task.enable",
      "service.enable",
      "account.enable",
      "process.bypass_execute",
      "net.bypass",
    ]) {
      expect(shouldShowRemediationRecoveryParameters(actionCode)).toBe(false);
    }
  });

  it("uses localized target evidence labels and values", () => {
    const scenarios = remediationPreviewDemoTemplates.flatMap((template) =>
      demoActionVariants(template).map((variant) => {
        const values = defaultDemoValues(template, variant.mode);
        return buildDynamicParameterDemoScenario(
          template,
          variant,
          values,
          (variant.buildInput(values) ?? {}) as RemediationActionInput,
        );
      }),
    );
    const en = parameterTranslator(enMessages);
    const zh = parameterTranslator(zhMessages);
    const processSnapshot = scenarios.find(
      (scenario) => scenario.item.action_code === "process.terminate",
    )!.item.target_snapshot!;
    const fileSnapshot = scenarios.find(
      (scenario) => scenario.item.action_code === "file.quarantine",
    )!.item.target_snapshot!;
    const bitsSnapshot = scenarios.find(
      (scenario) => scenario.item.action_code === "bits.delete",
    )!.item.target_snapshot!;

    expect(
      targetSnapshotRows(processSnapshot, en, "en").map((row) => row.label),
    ).toEqual(
      expect.arrayContaining(["Process Name", "Process Path", "Command Line"]),
    );
    expect(
      targetSnapshotRows(processSnapshot, zh, "zh-CN").map((row) => row.label),
    ).toEqual(expect.arrayContaining(["进程名", "进程路径", "命令行"]));
    expect(
      targetSnapshotRows(fileSnapshot, en, "en").map((row) => row.value),
    ).toContain("Unsigned");
    expect(
      targetSnapshotRows(fileSnapshot, zh, "zh-CN").map((row) => row.value),
    ).toContain("未签名");
    expect(
      targetSnapshotRows(bitsSnapshot, zh, "zh-CN").map((row) => row.value),
    ).toContain("传输中");
  });

  it("uses natural English action labels and hides key-only options for Registry values", () => {
    const registryValue = {
      action_code: "registry.delete_value",
      entity_type: "RegistryValue",
    };
    const registryKey = {
      action_code: "registry.delete_key",
      entity_type: "RegistryKey",
    };

    expect(remediationOrderActionLabel(registryValue, "en")).toBe(
      "Delete Registry Value",
    );
    expect(
      remediationOrderDisplayTemplate(registryValue, "en").parameters.map(
        (field) => field.key,
      ),
    ).toEqual(["stop_on_failure"]);
    expect(
      remediationOrderDisplayTemplate(registryKey, "zh-CN").parameters.map(
        (field) => field.key,
      ),
    ).toEqual(["recursive", "stop_on_failure"]);
  });
});
