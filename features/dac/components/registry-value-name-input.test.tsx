import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { getAccessControlCopy } from "../access-control-copy"
import { RegistryValueNameInput } from "./registry-value-name-input"

describe("RegistryValueNameInput", () => {
  const copy = getAccessControlCopy("en")

  it("renders an empty list as the all-values contract", () => {
    const html = renderToStaticMarkup(
      <RegistryValueNameInput copy={copy} value={[]} onChange={vi.fn()} />,
    )

    expect(html).toContain(copy.registry.allValues)
    expect(html).toContain(copy.registry.valueNameHint)
    expect(html).toContain(`maxlength="16383"`)
    expect(html).not.toContain(`${copy.remove} ${copy.registry.defaultValue}`)
  })

  it("keeps the empty string visible as the exact default Value", () => {
    const html = renderToStaticMarkup(
      <RegistryValueNameInput
        copy={copy}
        value={["", "Secret*", "literal\\*"]}
        onChange={vi.fn()}
      />,
    )

    expect(html).toContain(copy.registry.defaultValue)
    expect(html).toContain("Secret*")
    expect(html).toContain("literal\\*")
    expect(html).toContain(`${copy.remove} ${copy.registry.defaultValue}`)
  })

  it("disables editing for ENUM VALUE while preserving the current summary", () => {
    const html = renderToStaticMarkup(
      <RegistryValueNameInput
        copy={copy}
        value={[]}
        disabled
        onChange={vi.fn()}
      />,
    )

    expect(html).toContain(copy.registry.enumValueHint)
    expect(html).toContain(copy.registry.allValues)
    expect((html.match(/disabled=""/g) ?? []).length).toBeGreaterThanOrEqual(2)
  })
})
