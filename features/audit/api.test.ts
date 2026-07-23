import { beforeEach, describe, expect, it, vi } from "vitest"

const { post } = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock("@/shared/lib/http/client", () => ({
  http: { post },
}))

import { listUserActivityAudits } from "./api"

describe("user activity audit API", () => {
  beforeEach(() => {
    post.mockReset()
  })

  it("maps user permission audit events to the user activity model", async () => {
    post.mockResolvedValue({
      data: {
        total: 7,
        events: [
          { id: 1, event_type: "user.created", actor_type: "user", actor_id: "admin-1", actor_username: "administrator", source_ip: "192.0.2.10", target_user_id: "user-1", target_username: "alice", occurred_at_unix_ms: 7000 },
          { id: 2, event_type: "user.profile.updated", actor_type: "user", actor_id: "admin-1", target_user_id: "user-1", occurred_at_unix_ms: 6000 },
          { id: 3, event_type: "user.password.updated", actor_type: "user", actor_id: "admin-1", target_user_id: "user-1", occurred_at_unix_ms: 5000 },
          { id: 4, event_type: "user.status.updated", actor_type: "user", actor_id: "admin-1", target_user_id: "user-1", occurred_at_unix_ms: 4000 },
          { id: 5, event_type: "user.role.updated", actor_type: "user", actor_id: "admin-1", target_user_id: "user-1", old_role: "operator", new_role: "auditor", payload_json: "{\"changed_fields\":[\"role\"]}", occurred_at_unix_ms: 3000 },
          { id: 6, event_type: "user.soft_deleted", actor_type: "user", actor_id: "admin-1", target_user_id: "user-1", occurred_at_unix_ms: 2000 },
          { id: 7, event_type: "future.event", actor_type: "system", target_user_id: "user-1", payload_json: "not-json", occurred_at_unix_ms: 1000 },
        ],
      },
    })

    const result = await listUserActivityAudits({
      occurredAfterUnixMs: 100,
      occurredBeforeUnixMs: 8000,
    })

    expect(post).toHaveBeenCalledWith("listUserPermissionAuditEvents", {
      request_id: expect.stringMatching(/^\d+$/),
      occurred_after_unix_ms: 100,
      occurred_before_unix_ms: 8000,
      page: 1,
      page_size: 200,
    })
    expect(result.items.map((event) => event.actionType)).toEqual([
      "ADD_USER",
      "UPDATE_USER",
      "PASSWORD_CHANGE",
      "STATUS_CHANGE",
      "ROLE_CHANGE",
      "DELETE_USER",
      "OTHER",
    ])
    expect(result.items[0]).toMatchObject({
      eventId: "user-audit-1",
      userId: "admin-1",
      username: "administrator",
      sourceIp: "192.0.2.10",
      result: "SUCCESS",
      targetId: "user-1",
      targetName: "alice",
      targetType: "USER",
      details: { targetUsername: "alice" },
    })
    expect(result.items[4].details).toMatchObject({
      oldRole: "operator",
      newRole: "auditor",
      changed_fields: ["role"],
    })
    expect(result.items[6].details).toMatchObject({ payload: "not-json" })
    expect(result).toMatchObject({ total: 7, truncated: false })
  })

  it("continues requesting pages until the backend total is reached", async () => {
    post
      .mockResolvedValueOnce({
        data: {
          total: 2,
          events: [{ id: 1, event_type: "user.created", occurred_at_unix_ms: 1000 }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          total: 2,
          events: [{ id: 2, event_type: "user.role.updated", occurred_at_unix_ms: 2000 }],
        },
      })

    const result = await listUserActivityAudits()

    expect(post).toHaveBeenCalledTimes(2)
    expect(post.mock.calls.map((call) => call[1].page)).toEqual([1, 2])
    expect(result.items.map((event) => event.eventId)).toEqual(["user-audit-2", "user-audit-1"])
    expect(result.truncated).toBe(false)
  })

  it("rejects an inverted time range before sending a request", async () => {
    await expect(listUserActivityAudits({ occurredAfterUnixMs: 200, occurredBeforeUnixMs: 100 }))
      .rejects.toThrow("结束时间不能早于开始时间")
    expect(post).not.toHaveBeenCalled()
  })
})
