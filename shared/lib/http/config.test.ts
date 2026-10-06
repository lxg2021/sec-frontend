import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { beforeEach, describe, expect, it, vi } from "vitest"

import { clearRuntimeConfigCache, resolveApiUrl } from "./config"

describe("network access policy endpoint configuration", () => {
  beforeEach(() => {
    clearRuntimeConfigCache()
    vi.unstubAllGlobals()
  })

  it("uses the networkaccess route in the fallback configuration", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("config unavailable")))

    await expect(resolveApiUrl("createNetworkAccessPolicy")).resolves.toBe(
      "http://127.0.0.1:8090/api/v1/sensor/control/networkaccess/policy",
    )
  })

  it("publishes the same route in the runtime configuration", () => {
    const runtimeConfig = JSON.parse(
      readFileSync(resolve(process.cwd(), "public/config.json"), "utf8"),
    )

    expect(runtimeConfig.api.endpoints.createNetworkAccessPolicy).toBe(
      "/sensor/control/networkaccess/policy",
    )
  })
})
