import { describe, expect, it } from "vitest"

import type { ControlObjectDefinition } from "./api"
import {
  CONTROL_OBJECT_CAPABILITY_COLUMNS,
  CONTROL_OBJECT_TABLE_COLUMNS,
  controlObjectDeleteModeLabel,
  controlObjectHasCapability,
} from "./table-presentation"

function definition(): ControlObjectDefinition {
  return {
    objectId: "policy-1",
    objectType: "policy",
    objectTypeValue: 1,
    internalName: "policy.internal",
    displayName: "策略一",
    subType: 210,
    version: "1.2.0",
    source: "manual",
    state: "active",
    capabilities: {
      profile: "policy_managed_v1",
      contractVersion: 1,
      allowedOperations: ["apply", "stop", "remove"],
      canUpdate: true,
      deleteMode: "remove_effects",
    },
  }
}

describe("control object table presentation", () => {
  it("keeps every primary management attribute in its own column", () => {
    expect(CONTROL_OBJECT_TABLE_COLUMNS.map(({ key, label }) => [key, label])).toEqual([
      ["type", "类型"],
      ["displayName", "显示名称"],
      ["internalName", "内部名称"],
      ["objectId", "Object ID"],
      ["subType", "子类型"],
      ["version", "当前版本"],
      ["source", "来源"],
      ["canUpdate", "可更新"],
      ["apply", "可应用"],
      ["execute", "可执行"],
      ["stop", "可停止"],
      ["remove", "可移除"],
      ["deleteMode", "删除方式"],
      ["state", "状态"],
      ["actions", "操作"],
    ])
  })

  it("projects each capability into an independent boolean value", () => {
    const item = definition()
    expect(Object.fromEntries(CONTROL_OBJECT_CAPABILITY_COLUMNS.map(({ key }) => [
      key,
      controlObjectHasCapability(item, key),
    ]))).toEqual({
      canUpdate: true,
      apply: true,
      execute: false,
      stop: true,
      remove: true,
    })
  })

  it("uses stable business labels for every catalog delete mode", () => {
    expect(controlObjectDeleteModeLabel("forbidden")).toBe("禁止删除")
    expect(controlObjectDeleteModeLabel("metadata_only")).toBe("仅删元数据")
    expect(controlObjectDeleteModeLabel("remove_effects")).toBe("移除效果后删除")
    expect(controlObjectDeleteModeLabel("unknown")).toBe("未声明")
  })
})
