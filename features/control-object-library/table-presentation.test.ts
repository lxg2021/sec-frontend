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
      ["actions", "操作"],
    ])
  })

  it("uses stable business labels for every catalog delete mode", () => {
    expect(controlObjectDeleteModeLabel("forbidden")).toBe("禁止删除")
    expect(controlObjectDeleteModeLabel("metadata_only")).toBe("仅删元数据")
    expect(controlObjectDeleteModeLabel("remove_effects")).toBe("移除效果后删除")
    expect(controlObjectDeleteModeLabel("unknown")).toBe("未声明")
  })
})
