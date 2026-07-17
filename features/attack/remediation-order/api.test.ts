import { beforeEach, describe, expect, it, vi } from "vitest"

const { post } = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock("@/shared/lib/http/client", () => ({
  http: { post },
}))

import {
  deleteRemediationOrder,
  upsertRemediationDraftItems,
  queryRemediationOverviewSummary,
  REMEDIATION_PATHS,
} from "./api"

describe("remediation Order API", () => {
  beforeEach(() => {
    post.mockReset()
  })

  it("queries the tenant remediation overview with a UUID request ID", async () => {
    post.mockResolvedValue({ data: { totals: { order_count: "2" }, trend: [] } })

    const summary = await queryRemediationOverviewSummary()

    expect(REMEDIATION_PATHS.overviewSummaryQuery).toBe("/sensor/remediation/overview/summary/query")
    expect(post).toHaveBeenCalledWith(
      "/sensor/remediation/overview/summary/query",
      expect.objectContaining({ request_id: expect.stringMatching(/^[0-9a-f-]{36}$/i) }),
    )
    expect(summary.totals.order_count).toBe("2")
  })

  it("clears the current Draft through the v1-prefixed remediation endpoint", async () => {
    post.mockResolvedValue({
      data: {
        order_id: "order-1",
        status: "draft",
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
      status: "draft",
      revision: "3",
    })
  })

  it("upserts targets into the source-owned Order instead of creating another Order", async () => {
    post.mockResolvedValue({
      data: {
        order: { order_id: "order-1", revision: "8", current_round: 2, items: [] },
        item_results: [{ input_index: 0, item_id: "item-2", round_no: 2, disposition: "CREATED" }],
      },
    })

    const result = await upsertRemediationDraftItems({
      request_id: "a42d1b4a-4154-4a50-b702-3d5ce69326b0",
      order_id: "order-1",
      expected_revision: "7",
      items: [{ action_code: "process.terminate", graph_target: { node_key: "process:1", agent_id: "agent-1" } }],
    })

    expect(REMEDIATION_PATHS.orderDraftItemsUpsert).toBe("/sensor/remediation/order/draft/items/upsert")
    expect(result).toMatchObject({ order: { order_id: "order-1", current_round: 2 }, item_results: [{ disposition: "created" }] })
  })
})
