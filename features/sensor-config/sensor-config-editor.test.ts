import { describe, expect, it } from "vitest"

import {
  buildEnabledConfigCategories,
  cloneConfigCategories,
  countConfigItems,
  countEnabledConfigItems,
  createSensorConfigEditorSignature,
  getSensorConfigChanges,
  isSemanticConfigVersion,
} from "./sensor-config-editor"
import type { ConfigCategory } from "./types/config-item"

const categories: ConfigCategory[] = [
  {
    label: "文件组",
    items: [
      { key: "FileCreate", label: "文件创建", enabled: true },
      { key: "FileDelete", label: "文件删除", enabled: false },
    ],
  },
  {
    label: "进程组",
    items: [{ key: "ProcessCreate", label: "进程创建", enabled: true }],
  },
]

describe("sensor config editor model", () => {
  it("clones nested categories without mutating the source", () => {
    const clone = cloneConfigCategories(categories)
    clone[0].items[0].enabled = false

    expect(categories[0].items[0].enabled).toBe(true)
  })

  it("counts all and enabled configuration items", () => {
    expect(countConfigItems(categories)).toBe(3)
    expect(countEnabledConfigItems(categories)).toBe(2)
  })

  it("returns only changed switches with their previous state", () => {
    const current = cloneConfigCategories(categories)
    current[0].items[0].enabled = false
    current[0].items[1].enabled = true

    expect(getSensorConfigChanges(categories, current)).toEqual([
      {
        categoryLabel: "文件组",
        itemKey: "FileCreate",
        itemLabel: "文件创建",
        previousEnabled: true,
        enabled: false,
      },
      {
        categoryLabel: "文件组",
        itemKey: "FileDelete",
        itemLabel: "文件删除",
        previousEnabled: false,
        enabled: true,
      },
    ])
  })

  it("builds the persisted content from enabled items only", () => {
    expect(buildEnabledConfigCategories(categories)).toEqual([
      {
        label: "文件组",
        items: [{ key: "FileCreate", label: "文件创建", enabled: true }],
      },
      {
        label: "进程组",
        items: [{ key: "ProcessCreate", label: "进程创建", enabled: true }],
      },
    ])
  })

  it("validates semantic versions and creates stable editor signatures", () => {
    expect(isSemanticConfigVersion("1.2.0")).toBe(true)
    expect(isSemanticConfigVersion("v1.2")).toBe(false)
    expect(createSensorConfigEditorSignature(" Sensor ", " 1.0.0 ", categories)).toBe(
      createSensorConfigEditorSignature("Sensor", "1.0.0", cloneConfigCategories(categories)),
    )
  })
})
