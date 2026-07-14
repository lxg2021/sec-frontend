import { beforeEach, describe, expect, it, vi } from "vitest"

const { post } = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock("@/shared/lib/http/client", () => ({
  http: { post },
}))

import {
  deleteRemediationOrder,
  REMEDIATION_PATHS,
} from "./api"

describe("remediation Order API", () => {
  beforeEach(() => {
    post.mockReset()
  })

  it("deletes a Draft through the v1-prefixed remediation endpoint", async () => {
    post.mockResolvedValue({
      data: {
        order_id: "order-1",
        status: "deleted",
        revision: "3",
        items: [],
      },
    })

    const order = await deleteRemediationOrder({
      request_id: "6a94c4be-40ab-4e8a-9563-a175ef0d6578",
      order_id: "order-1",
      expected_revision: "2",
    })

    expect(REMEDIATION_PATHS.orderDelete).toBe(
      "/sensor/remediation/order/delete",
    )
    expect(post).toHaveBeenCalledWith("/sensor/remediation/order/delete", {
      request_id: "6a94c4be-40ab-4e8a-9563-a175ef0d6578",
      order_id: "order-1",
      expected_revision: "2",
    })
    expect(order).toMatchObject({
      order_id: "order-1",
      status: "deleted",
      revision: "3",
    })
  })
})
