import { describe, expect, it } from "vitest"

import {
  generateLogicGroupTemplate,
  LOGIC_GROUP_PARSE_ERRORS,
  parseLogicGroupFile,
} from "@/features/collection/lib/logic-group-parser"

describe("logic group parser localization", () => {
  it("keeps the parsed hierarchy and paths unchanged", () => {
    const groups = parseLogicGroupFile(`
- name: Headquarters
  type: company
  children:
    - name: Security
      type: department
      children:
        - name: Analysis
          type: group
`)

    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({
      id: "company-1",
      name: "Headquarters",
      path: "Headquarters",
      type: "company",
    })
    expect(groups[0].children?.[0]).toMatchObject({
      id: "department-2",
      name: "Security",
      path: "Headquarters/Security",
      type: "department",
      parentId: "company-1",
    })
    expect(groups[0].children?.[0].children?.[0]).toMatchObject({
      id: "group-3",
      name: "Analysis",
      path: "Headquarters/Security/Analysis",
      type: "group",
      parentId: "department-2",
    })
  })

  it("returns stable error codes instead of language-specific parser text", () => {
    expect(() => parseLogicGroupFile("- type: company")).toThrow(LOGIC_GROUP_PARSE_ERRORS.nameRequired)
    expect(() => parseLogicGroupFile("- name: Headquarters\n  type: invalid")).toThrow(
      LOGIC_GROUP_PARSE_ERRORS.typeInvalid,
    )
  })

  it("generates templates in the requested UI language", () => {
    const chineseTemplate = generateLogicGroupTemplate("zh-CN")
    const englishTemplate = generateLogicGroupTemplate("en")

    expect(chineseTemplate).toContain("逻辑组织结构模板")
    expect(chineseTemplate).toContain("name: 总部")
    expect(englishTemplate).toContain("Logical organization structure template")
    expect(englishTemplate).toContain("name: Headquarters")
    expect(englishTemplate).not.toMatch(/[\u4e00-\u9fff]/)
    expect(parseLogicGroupFile(chineseTemplate)).toHaveLength(2)
    expect(parseLogicGroupFile(englishTemplate)).toHaveLength(2)
  })
})
