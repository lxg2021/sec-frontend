import { describe, expect, it } from "vitest";

import {
  REMEDIATION_TYPE_ICONS,
  remediationActionIcon,
  remediationActionIconClassName,
} from "./remediation-action-icons";

const CASES = [
  ["process.terminate", "process"],
  ["file.quarantine", "file"],
  ["scheduled_job.delete", "scheduled-task"],
  ["service.delete", "service"],
  ["account.disable", "account"],
  ["registry.delete_key", "registry"],
  ["wmi_class.delete", "wmi-class"],
  ["wmi_subscription.delete", "wmi-subscription"],
  ["bits.delete", "bits-job"],
  ["file_ea.delete", "file-ea"],
  ["ntfs_ads.delete", "ntfs-ads"],
  ["process.block_execute", "proc-execute"],
  ["net.block", "net-quarantine"],
] as const;

describe("remediation action icons", () => {
  it.each(CASES)("maps %s to the %s demo icon", (actionCode, type) => {
    expect(remediationActionIcon(actionCode)).toBe(REMEDIATION_TYPE_ICONS[type]);
  });

  it.each([
    ["process.terminate", "text-indigo-600"],
    ["process.block_execute", "text-indigo-600"],
    ["file.quarantine", "text-amber-600"],
    ["file_ea.delete", "text-amber-600"],
    ["ntfs_ads.delete", "text-amber-600"],
    ["task.delete", "text-blue-600"],
    ["service.delete", "text-blue-600"],
    ["bits.delete", "text-blue-600"],
    ["account.disable", "text-cyan-600"],
    ["registry.delete_key", "text-emerald-600"],
    ["wmi_class.delete", "text-violet-600"],
    ["wmi_subscription.delete", "text-violet-600"],
    ["net.block", "text-teal-600"],
  ])("maps %s to the grouped icon color", (actionCode, className) => {
    expect(remediationActionIconClassName(actionCode)).toBe(className);
  });
});
