import { describe, expect, it } from "vitest"

import {
  CONTROL_OBJECT_TABLE_COLUMNS,
  controlObjectDeleteModeLabelKey,
  controlObjectDisplayNameKey,
} from "./table-presentation"

describe("control object table presentation", () => {
  it("keeps identity fields in columns and reserves one action-menu column", () => {
    expect(CONTROL_OBJECT_TABLE_COLUMNS.map(({ key, labelKey }) => [key, labelKey])).toEqual([
      ["type", "table.type"],
      ["displayName", "table.displayName"],
      ["internalName", "table.internalName"],
      ["objectId", "table.id"],
      ["subType", "table.subType"],
      ["version", "table.version"],
      ["source", "table.source"],
      ["state", "table.state"],
      ["delivery", "table.delivery"],
      ["actions", "table.actions"],
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

  it("aligns the action heading with the row action-menu button", () => {
    expect(CONTROL_OBJECT_TABLE_COLUMNS.find(({ key }) => key === "actions")?.align).toBe("left")
  })

  it("uses stable business labels for every catalog delete mode", () => {
    expect(controlObjectDeleteModeLabelKey("forbidden")).toBe("deleteModes.forbidden")
    expect(controlObjectDeleteModeLabelKey("metadata_only")).toBe("deleteModes.metadataOnly")
    expect(controlObjectDeleteModeLabelKey("remove_effects")).toBe("deleteModes.removeEffects")
    expect(controlObjectDeleteModeLabelKey("unknown")).toBe("deleteModes.unknown")
  })

  it("returns a translation key only for known built-in object IDs", () => {
    expect(controlObjectDisplayNameKey({
      objectId: "9A182447-B61D-48F6-B99C-264C128AEEBB",
    })).toBe("builtinObjects.generalConfig")
    expect(controlObjectDisplayNameKey({ objectId: "manual-object" })).toBeNull()
  })
})
