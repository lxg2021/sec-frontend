import { describe, expect, it } from "vitest";

import {
  REMEDIATION_ACTION_TYPE_CATALOG,
  REMEDIATION_TYPE_ICONS,
  remediationActionIcon,
  remediationActionIconClassName,
  remediationActionType,
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
  it("keeps the complete 13-type remediation catalog", () => {
    expect(REMEDIATION_ACTION_TYPE_CATALOG).toHaveLength(13);
    expect(
      REMEDIATION_ACTION_TYPE_CATALOG.map(({ representativeActionCode }) => representativeActionCode),
    ).toEqual(CASES.map(([actionCode]) => actionCode));
  });

  it.each(CASES)("maps %s to the %s demo icon", (actionCode, type) => {
    expect(remediationActionIcon(actionCode)).toBe(REMEDIATION_TYPE_ICONS[type]);
  });

  it.each(CASES)("maps %s to the %s remediation type", (actionCode, type) => {
    expect(remediationActionType(actionCode)).toBe(type);
  });

  it.each([
    ["file.restore", "file"],
    ["task.restore", "scheduled-task"],
    ["service.restore", "service"],
    ["account.enable", "account"],
    ["registry.restore", "registry"],
    ["wmi_class.restore", "wmi-class"],
    ["wmi_subscription.restore", "wmi-subscription"],
    ["bits.restore", "bits-job"],
    ["file_ea.restore", "file-ea"],
    ["ntfs_ads.restore", "ntfs-ads"],
    ["process.bypass_execute", "proc-execute"],
    ["network.bypass", "net-quarantine"],
  ])("keeps reverse action %s in the %s remediation type", (actionCode, type) => {
    expect(remediationActionType(actionCode)).toBe(type);
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
