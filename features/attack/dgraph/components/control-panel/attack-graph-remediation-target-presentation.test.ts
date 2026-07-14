import { describe, expect, it } from "vitest"

import { getRemediationTargetPresentation } from "./attack-graph-remediation-target-presentation"

describe("getRemediationTargetPresentation", () => {
  it("shows only the file name for Windows and Unix paths", () => {
    expect(
      getRemediationTargetPresentation(
        "file",
        "c:\\users\\public\\payload.exe",
        {},
      ),
    ).toEqual({
      label: "payload.exe",
      fullValue: "c:\\users\\public\\payload.exe",
      showFullValue: true,
    })
    expect(
      getRemediationTargetPresentation("file", "/tmp/payload.so", {}),
    ).toMatchObject({ label: "payload.so", fullValue: "/tmp/payload.so" })
  })

  it("uses a file path property for the tooltip when displayName is already short", () => {
    expect(
      getRemediationTargetPresentation("file", "payload.exe", {
        path: "c:\\users\\public\\payload.exe",
      }),
    ).toEqual({
      label: "payload.exe",
      fullValue: "c:\\users\\public\\payload.exe",
      showFullValue: true,
    })
  })

  it("does not shorten non-file targets", () => {
    expect(
      getRemediationTargetPresentation("process", "c:\\tools\\calc.exe", {}),
    ).toEqual({
      label: "c:\\tools\\calc.exe",
      fullValue: "c:\\tools\\calc.exe",
      showFullValue: false,
    })
  })
})
