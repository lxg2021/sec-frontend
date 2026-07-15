import { describe, expect, it } from "vitest";

import type { RemediationOrderItem } from "@/features/attack/remediation-order";

import { remediationTargetPresentation } from "./remediation-target-presentation";

function item(overrides: Partial<RemediationOrderItem> = {}) {
  return {
    node_key: "process:public:technical-node-key",
    display_name: "",
    object_id: "",
    target_snapshot: null,
    ...overrides,
  } as RemediationOrderItem;
}

describe("remediationTargetPresentation", () => {
  it("uses the frozen process snapshot instead of the graph node key", () => {
    const presentation = remediationTargetPresentation(
      item({
        target_snapshot: {
          process: {
            process_guid: "process-guid",
            pid: 4812,
            process_name: "winword.exe",
            process_path: "C:\\Program Files\\Microsoft Office\\winword.exe",
            process_hash: "aabbcc",
            command_line: "winword.exe /n",
          },
        } as RemediationOrderItem["target_snapshot"],
      }),
    );

    expect(presentation.displayName).toBe("winword.exe");
    expect(presentation.detail).toContain("PID: 4812");
    expect(presentation.detail).toContain("winword.exe");
    expect(presentation.unavailable).toBe(false);
  });

  it("does not render an artificial :0 network port", () => {
    const presentation = remediationTargetPresentation(
      item({
        node_key: "net_address:public:20.0.40.208:0",
        target_snapshot: {
          network: {
            kind: "ip_address",
            ip: "20.0.40.208",
            port: 0,
            protocol: "tcp",
            is_ipv6: false,
            domain: "",
            url: "",
          },
        } as RemediationOrderItem["target_snapshot"],
      }),
    );

    expect(presentation.displayName).toBe("20.0.40.208");
    expect(presentation.displayName).not.toContain(":0");
  });

  it("does not expose a raw node key as the visible fallback", () => {
    const presentation = remediationTargetPresentation(item());

    expect(presentation.displayName).toBe("目标信息不可用");
    expect(presentation.detail).toContain("process:public:technical-node-key");
    expect(presentation.unavailable).toBe(true);
  });
});
