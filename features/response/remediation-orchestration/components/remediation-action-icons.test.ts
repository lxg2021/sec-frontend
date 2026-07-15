import { describe, expect, it } from "vitest";

import {
  REMEDIATION_TYPE_ICONS,
  remediationActionIcon,
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
});
