import { describe, expect, it } from "vitest";

import type { RemediationActionInput, RemediationActionOption } from "../types";
import {
  buildRemediationTemplateInput,
  getRemediationPreviewTemplate,
  initialRemediationTemplateValues,
} from "./remediation-preview-templates";

function action(actionCode: string): RemediationActionOption {
  return {
    action_code: actionCode,
    action_type: actionCode,
    contexts: [],
    display_name: actionCode,
    required_snapshot_kind: "",
    requires_agent: true,
    requires_history: false,
  };
}

const PARAMETER_FAMILIES = [
  {
    name: "file quarantine",
    actionCode: "file.quarantine",
    branch: "file_quarantine",
    defaults: {
      delete_original: true,
      encrypt: true,
      storage: "local",
      suffix: "qtn",
    },
    overrides: {
      delete_original: false,
      encrypt: false,
      storage: "central",
      suffix: "vault",
    },
  },
  {
    name: "scheduled task",
    actionCode: "task.delete",
    branch: "scheduled_task",
    defaults: { force: false },
    overrides: { force: true },
  },
  {
    name: "service",
    actionCode: "service.delete",
    branch: "service",
    defaults: { stop_before_delete: true },
    overrides: { stop_before_delete: false },
  },
  {
    name: "account",
    actionCode: "account.disable",
    branch: "account",
    defaults: { force_logoff: false },
    overrides: { force_logoff: true },
  },
  {
    name: "registry",
    actionCode: "registry.delete_key",
    branch: "registry",
    defaults: { recursive: true, stop_on_failure: true },
    overrides: { recursive: false, stop_on_failure: false },
  },
  {
    name: "WMI class",
    actionCode: "wmi_class.delete",
    branch: "wmi_class",
    defaults: { delete_instances: false, recursive_delete: false },
    overrides: { delete_instances: true, recursive_delete: true },
  },
  {
    name: "WMI subscription",
    actionCode: "wmi_subscription.delete",
    branch: "wmi_subscription",
    defaults: { remove_binding_only: false },
    overrides: { remove_binding_only: true },
    baseBranch: { target_candidate_id: "candidate-1" },
  },
  {
    name: "BITS job",
    actionCode: "bits.delete",
    branch: "bits_job",
    defaults: { force: false },
    overrides: { force: true },
  },
  {
    name: "file EA",
    actionCode: "file_ea.delete",
    branch: "file_ea",
    defaults: { force: false },
    overrides: { force: true },
  },
  {
    name: "NTFS ADS",
    actionCode: "ntfs_ads.delete",
    branch: "ntfs_ads",
    defaults: { force: false },
    overrides: { force: true },
  },
  {
    name: "process block",
    actionCode: "process.block_execute",
    branch: "process_block",
    defaults: { audit: true },
    overrides: {
      subject_path: "c:/windows/system32/cmd.exe",
      subject_hash: "subject-hash",
      except_path: "c:/trusted.exe",
      except_hash: "except-hash",
      audit: false,
    },
  },
  {
    name: "network block",
    actionCode: "net.block",
    branch: "net_block",
    defaults: { direction: "out" },
    overrides: { direction: "both" },
  },
] as const;

describe("remediation parameter family contract", () => {
  for (const testCase of PARAMETER_FAMILIES) {
    it(`builds backend-aligned defaults for ${testCase.name}`, () => {
      const selectedAction = action(testCase.actionCode);
      const template = getRemediationPreviewTemplate(selectedAction);
      const baseInput = testCase.baseBranch
        ? ({ [testCase.branch]: testCase.baseBranch } as RemediationActionInput)
        : undefined;
      const values = initialRemediationTemplateValues(baseInput, template);

      expect(
        buildRemediationTemplateInput({
          baseInput,
          selectedAction,
          template,
          values,
        }),
      ).toEqual({
        ...(baseInput ?? {}),
        [testCase.branch]: {
          ...testCase.defaults,
          ...(testCase.baseBranch ?? {}),
        },
      });
    });

    it(`preserves explicit parameter values for ${testCase.name}`, () => {
      const selectedAction = action(testCase.actionCode);
      const template = getRemediationPreviewTemplate(selectedAction);
      const baseInput = testCase.baseBranch
        ? ({ [testCase.branch]: testCase.baseBranch } as RemediationActionInput)
        : undefined;

      expect(
        buildRemediationTemplateInput({
          baseInput,
          selectedAction,
          template,
          values: {
            includeChildProcesses: true,
            parameterOverrides: testCase.overrides,
          },
        }),
      ).toEqual({
        ...(baseInput ?? {}),
        [testCase.branch]: {
          ...testCase.defaults,
          ...(testCase.baseBranch ?? {}),
          ...testCase.overrides,
        },
      });
    });
  }

  it("uses explicit templates for disable actions", () => {
    expect(getRemediationPreviewTemplate(action("task.disable")).title).toBe(
      "禁用计划任务",
    );
    expect(getRemediationPreviewTemplate(action("service.disable")).title).toBe(
      "禁用服务",
    );
  });
});
