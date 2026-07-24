import { beforeEach, describe, expect, it, vi } from "vitest"

const { post } = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock("@/shared/lib/http/client", () => ({
  http: { post },
}))

import { listChangeAuditEvents, listUserActivityAudits } from "./api"

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
      .rejects.toThrow("USER_AUDIT_DATE_RANGE_INVALID")
    expect(post).not.toHaveBeenCalled()
  })
})

describe("change audit API", () => {
  beforeEach(() => {
    post.mockReset()
  })

  it("maps audit events to six business change types and preserves legacy commands", async () => {
    post.mockImplementation((method: string, body: Record<string, unknown>) => {
      if (method === "listPMCObjectDefinitions") {
        return Promise.resolve({ data: { definitions: [], total: 0 } })
      }
      if (method !== "listPMCAuditEvents") throw new Error(`unexpected method ${method}`)

      const eventsByType: Record<string, unknown[]> = {
        "pmc.catalog.command.ensured": [
          {
            event_key: "command-created", event_type: "pmc.catalog.command.ensured",
            object_type: 2, object_id: "command-1", actor_type: "operator", actor_id: "admin-1",
            payload_json: JSON.stringify({ object_name: "Collect command", version: "1.0.0", outcome: "created" }),
            occurred_at_unix_ms: 1000,
          },
          {
            event_key: "command-reused", event_type: "pmc.catalog.command.ensured",
            object_type: 2, object_id: "command-1", actor_type: "operator", actor_id: "admin-1",
            payload_json: JSON.stringify({ object_name: "Collect command", version: "1.0.0", outcome: "reused" }),
            occurred_at_unix_ms: 1500,
          },
          {
            event_key: "command-legacy", event_type: "pmc.catalog.command.ensured",
            object_type: 2, object_id: "legacy-command", actor_type: "operator", actor_id: "admin-1",
            payload_json: JSON.stringify({ object_name: "Legacy command", version: "1.0.0" }),
            occurred_at_unix_ms: 500,
          },
        ],
        "pmc.catalog.object.version_updated": [{
          event_key: "config-updated", event_type: "pmc.catalog.object.version_updated",
          object_type: 3, object_id: "config-1", actor_type: "operator", actor_id: "admin-2",
          payload_json: JSON.stringify({ object_name: "Agent config", previous_version: "1.0.0", new_version: "1.1.0", outcome: "advanced" }),
          occurred_at_unix_ms: 2000,
        }],
        "pmc.catalog.object.deleted": [{
          event_key: "policy-deleted", event_type: "pmc.catalog.object.deleted", operation_id: "delete-operation-1",
          object_type: 1, object_id: "policy-1", actor_type: "system", actor_id: "catalog-delete-coordinator",
          payload_json: JSON.stringify({ object_name: "Retired policy", object_version: "2.0.0", requested_by: "admin-3", outcome: "completed" }),
          occurred_at_unix_ms: 3000,
        }],
        "pmc.catalog.delete.accepted": [{
          event_key: "policy-delete-accepted", event_type: "pmc.catalog.delete.accepted", operation_id: "delete-operation-1",
          object_type: 1, object_id: "policy-1", actor_type: "operator", actor_id: "admin-3",
          payload_json: JSON.stringify({ object_name: "Retired policy", requested_by: "admin-3", outcome: "accepted" }),
          occurred_at_unix_ms: 2500,
        }],
        "pmc.catalog.delete.aborted": [{
          event_key: "policy-delete-aborted", event_type: "pmc.catalog.delete.aborted", operation_id: "delete-operation-2",
          object_type: 1, object_id: "policy-2", actor_type: "operator", actor_id: "admin-4",
          payload_json: JSON.stringify({ object_name: "Active policy", requested_by: "admin-4", outcome: "aborted", reason: "withdrawn" }),
          occurred_at_unix_ms: 3500,
        }],
      }
      const events = eventsByType[String(body.event_type)] ?? []
      return Promise.resolve({ data: { events, total: events.length } })
    })

    const result = await listChangeAuditEvents()

    expect(result.items.map((event) => event.action)).toEqual([
      "deleteAborted",
      "deleteCompleted",
      "deleteAccepted",
      "updated",
      "reused",
      "created",
      "legacyCommand",
    ])
    expect(result.items[1]).toMatchObject({
      eventType: "pmc.catalog.object.deleted",
      action: "deleteCompleted",
      objectName: "Retired policy",
      objectVersion: "2.0.0",
      newVersion: "2.0.0",
      requestedBy: "admin-3",
      outcome: "completed",
      operationId: "delete-operation-1",
    })
    expect(result.items[3]).toMatchObject({
      action: "updated",
      previousVersion: "1.0.0",
      newVersion: "1.1.0",
      outcome: "advanced",
    })
    expect(result.items[5]).toMatchObject({
      action: "created",
      objectName: "Collect command",
      newVersion: "1.0.0",
      outcome: "created",
    })
    expect(result.items[6]).toMatchObject({
      action: "legacyCommand",
      objectName: "Legacy command",
      outcome: undefined,
    })
    expect(post).toHaveBeenCalledWith("listPMCAuditEvents", expect.objectContaining({
      event_type: "pmc.catalog.object.deleted",
    }))
  })
})
