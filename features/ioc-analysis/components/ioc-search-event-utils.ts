export type IocLocalEventSource = {
  event_type?: number
  event_name?: string
  content?: string
  source_unique_id?: string
  unique_id?: string
  event_time?: string
  agent_id?: string
}

export function parseLocalEventContent(content?: string): Record<string, unknown> {
  if (!content) return {}
  try {
    const parsed = JSON.parse(content)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

export function localEventStringField(object: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = object[key]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number" && Number.isFinite(value)) return String(value)
  }
  return ""
}

export function localEventUniqueId(event: IocLocalEventSource) {
  const direct = localEventStringField(event as Record<string, unknown>, "source_unique_id", "unique_id")
  if (direct) return direct

  const content = parseLocalEventContent(event.content)
  return localEventStringField(content, "UniqueID", "UniqueId", "unique_id", "source_unique_id")
}

export function localEventTime(event: IocLocalEventSource) {
  const direct = localEventStringField(event as Record<string, unknown>, "event_time")
  if (direct) return direct

  const content = parseLocalEventContent(event.content)
  return localEventStringField(content, "Time", "EventTime", "Timestamp", "UtcTime", "event_time")
}

export function localEventAgent(event: IocLocalEventSource) {
  const direct = localEventStringField(event as Record<string, unknown>, "agent_id")
  if (direct) return direct

  const content = parseLocalEventContent(event.content)
  return localEventStringField(content, "AgentID", "AgentId", "Computer", "Hostname", "HostName", "agent_id")
}

export function localEventSummary(event: IocLocalEventSource) {
  const content = parseLocalEventContent(event.content)
  const process = localEventStringField(content, "ProcessName", "ProcessImage", "Image", "FileName")
  const ip = localEventStringField(content, "DestinationIp", "DestinationIP", "RemoteIP", "Ip", "QueryIP")
  const domain = localEventStringField(content, "Domain", "QueryName", "DnsName", "Host", "Hostname")
  const target = localEventStringField(content, "TargetFilename", "FilePath", "Path", "CommandLine")
  const agent = localEventAgent(event)
  const action = [process, ip || domain || target].filter(Boolean).join(" -> ")
  return action || agent || event.event_name || "local event"
}

export function localEventDescriptionKeyFromValues(eventType: number | string | undefined, eventName: string | undefined, uniqueId: string | undefined) {
  const normalizedEventType = Number(eventType || 0)
  const normalizedEventName = (eventName || "").trim()
  const normalizedUniqueId = (uniqueId || "").trim()
  if (!normalizedEventType || !normalizedUniqueId) return ""
  return [normalizedEventType, normalizedEventName, normalizedUniqueId].join(":")
}

export function localEventDescriptionKey(event: IocLocalEventSource) {
  return localEventDescriptionKeyFromValues(event.event_type, event.event_name, localEventUniqueId(event))
}

export function localEventKey(event: IocLocalEventSource, index = 0) {
  return [
    event.event_type || "unknown-type",
    event.event_name || "unknown-event",
    localEventUniqueId(event) || index,
  ].join(":")
}
