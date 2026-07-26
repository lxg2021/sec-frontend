import { describe, expect, it } from "vitest"

import { validateUserLogicGroups } from "@/features/collection/lib/logic-group-converter"
import type { UserLogicGroup } from "@/features/collection/types"

describe("logic group validation localization", () => {
  it("uses the supplied UI-language messages without changing validation rules", () => {
    const duplicateChild: UserLogicGroup = {
      id: "company-1",
      name: "Headquarters",
      path: "Headquarters",
      type: "company",
      children: [
        { id: "department-1", name: "Security", path: "Headquarters/Security", type: "department" },
        { id: "department-2", name: "Security", path: "Headquarters/Security", type: "department" },
      ],
    }

    const errors = validateUserLogicGroups([duplicateChild, { ...duplicateChild, id: "company-2" }], {
      nodeNameRequired: "节点名称不能为空",
      nodeTypeRequired: "节点类型不能为空",
      duplicateChildName: (name) => `重复子节点：${name}`,
      duplicateRootName: (name) => `重复根节点：${name}`,
      nestedError: (parent, error) => `${parent} > ${error}`,
    })

    expect(errors).toEqual([
      "重复子节点：Security",
      "重复根节点：Headquarters",
      "重复子节点：Security",
    ])
  })
})
