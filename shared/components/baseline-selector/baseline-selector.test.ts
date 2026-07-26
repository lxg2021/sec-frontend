import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("baseline selector density", () => {
  it("keeps the compact dashboard header contract", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "shared/components/baseline-selector/index.tsx"),
      "utf8",
    )

    expect(source).toContain("px-4 py-3")
    expect(source).toContain("h-11 w-11")
    expect(source).toContain("px-2 py-1.5")
    expect(source).toContain("truncate text-base font-semibold")
    expect(source).toContain("h-6 rounded-full")
    expect(source).toContain("h-8 w-8")
  })
})
