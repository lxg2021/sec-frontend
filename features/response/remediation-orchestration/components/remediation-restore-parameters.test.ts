import { describe, expect, it } from "vitest";

import type { RemediationOrderItem } from "@/features/attack/remediation-order";

import { remediationRestoreSourceDetails } from "./remediation-order-authority-reference";
import { shouldShowRemediationWorkspaceTemplateControls } from "./remediation-order-parameter-editor";

describe("file restore parameter presentation", () => {
  it("uses the successful quarantine Item as the friendly restore source", () => {
    const source = {
      item_id: "quarantine-item-1",
      round_no: 2,
      display_name: "file:public:agent:c:/temp/payload.dll",
      node_key: "file:public:agent:c:/temp/payload.dll",
      backup: {
        backup_id: "backup-file-001",
      },
      target_snapshot: {
        file: { file_path: "c:/temp/payload.dll" },
      },
    } as RemediationOrderItem;

    expect(remediationRestoreSourceDetails(source.item_id, [source])).toEqual({
      backupFileId: "backup-file-001",
      backupFileName: "payload.dll",
      sourceItemId: "quarantine-item-1",
    });
  });

  it("does not render a second no-parameters card for file.restore", () => {
    expect(shouldShowRemediationWorkspaceTemplateControls("file.restore")).toBe(
      false,
    );
    expect(
      shouldShowRemediationWorkspaceTemplateControls("service.restore"),
    ).toBe(true);
    expect(
      shouldShowRemediationWorkspaceTemplateControls("file.quarantine"),
    ).toBe(true);
  });
});
