import { describe, expect, it } from "vitest"

import type { ControlObjectAgentState } from "./api"
import {
  eligibleControlObjectAgentIds,
  filterHostTreeByAgentIds,
} from "./operation-targets"
import type { HostSelectorTreeNode } from "@/shared/components/host-selector/types"

function agent(
  agentId: string,
  currentState: string | null,
  hasActiveChange = false,
  applyState = "success",
): ControlObjectAgentState {
  return {
    agentId,
    objectVersion: "2.0.0",
    currentEffect: currentState
      ? { objectVersion: "1.0.0", currentState, applyState }
      : null,
    hasActiveChange,
  }
}

describe("control object operation targets", () => {
  it("only allows a proven started Current Effect for STOP", () => {
    const result = eligibleControlObjectAgentIds([
      agent("started", "started"),
      agent("stopped", "stopped"),
      agent("removed", "removed"),
      agent("changing", "started", true),
      agent("untrusted", "started", false, "failed"),
      agent("missing", null),
    ], "stop")

    expect([...result]).toEqual(["started"])
  })

  it("allows started or stopped Current Effects for REMOVE and excludes active changes", () => {
    const result = eligibleControlObjectAgentIds([
      agent("started", "started"),
      agent("stopped", "stopped"),
      agent("removed", "removed"),
      agent("changing", "stopped", true),
    ], "remove")

    expect([...result]).toEqual(["started", "stopped"])
  })

  it("preserves the organization hierarchy and recalculates filtered host counts", () => {
    const tree: HostSelectorTreeNode[] = [{
      id: "company",
      name: "Company",
      type: "company",
      hostCount: 3,
      directHostCount: 1,
      descendantHostCount: 3,
      children: [
        {
          id: "host:direct",
          name: "Direct",
          type: "host",
          hostname: "Direct",
          hostId: "direct",
          ip: "-",
          os: "Linux",
          mac: "-",
          status: "online",
          cpu: "-",
          memory: "-",
          disk: "-",
        },
        {
          id: "empty-department",
          name: "Empty",
          type: "department",
          hostCount: 1,
          children: [{
            id: "host:excluded",
            name: "Excluded",
            type: "host",
            hostname: "Excluded",
            hostId: "excluded",
            ip: "-",
            os: "Linux",
            mac: "-",
            status: "online",
            cpu: "-",
            memory: "-",
            disk: "-",
          }],
        },
        {
          id: "kept-department",
          name: "Kept",
          type: "department",
          hostCount: 1,
          children: [{
            id: "host:nested",
            name: "Nested",
            type: "host",
            hostname: "Nested",
            hostId: "nested",
            ip: "-",
            os: "Windows",
            mac: "-",
            status: "online",
            cpu: "-",
            memory: "-",
            disk: "-",
          }],
        },
      ],
    }]

    const result = filterHostTreeByAgentIds(tree, new Set(["direct", "nested"]))
    const company = result[0]

    expect(company).toMatchObject({
      id: "company",
      hostCount: 2,
      directHostCount: 1,
      descendantHostCount: 2,
    })
    expect(company.type === "host" ? [] : company.children.map((child) => child.id))
      .toEqual(["host:direct", "kept-department"])
    expect(tree[0]).toMatchObject({ hostCount: 3 })
  })
})
