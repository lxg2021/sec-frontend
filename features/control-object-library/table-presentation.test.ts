import { describe, expect, it } from "vitest"

import {
  CONTROL_OBJECT_TABLE_COLUMNS,
  controlObjectDeleteModeLabel,
} from "./table-presentation"

describe("control object table presentation", () => {
  it("keeps identity fields in columns and reserves one action-menu column", () => {
    expect(CONTROL_OBJECT_TABLE_COLUMNS.map(({ key, label }) => [key, label])).toEqual([
      ["type", "类型"],
      ["displayName", "显示名称"],
      ["internalName", "内部名称"],
      ["objectId", "ID"],
      ["subType", "类型"],
      ["version", "当前版本"],
      ["source", "来源"],
      ["state", "状态"],
      ["delivery", "下发情况"],
      ["actions", "操作"],
    ])
  })

  it("uses a complete percentage width grid so wide screens do not over-expand the ID column", () => {
    expect(CONTROL_OBJECT_TABLE_COLUMNS.map(({ key, widthClassName }) => [key, widthClassName]))
      .toEqual([
        ["type", "w-[7%]"],
        ["displayName", "w-[16%]"],
        ["internalName", "w-[16%]"],
        ["objectId", "w-[17%]"],
        ["subType", "w-[6%]"],
        ["version", "w-[8%]"],
        ["source", "w-[8%]"],
        ["state", "w-[7%]"],
        ["delivery", "w-[9%]"],
        ["actions", "w-[6%]"],
      ])
  })

  it("uses stable business labels for every catalog delete mode", () => {
    expect(controlObjectDeleteModeLabel("forbidden")).toBe("禁止删除")
    expect(controlObjectDeleteModeLabel("metadata_only")).toBe("仅删元数据")
    expect(controlObjectDeleteModeLabel("remove_effects")).toBe("移除效果后删除")
    expect(controlObjectDeleteModeLabel("unknown")).toBe("未声明")
  })
})
