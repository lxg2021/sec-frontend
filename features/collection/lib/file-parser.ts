import type { CollectionImportData, OwnerRole, UiAssetData, UserLogicGroup } from "@/features/collection/types"
import { ensureLogicGroupIds } from "@/features/collection/lib/logic-group-utils"

export interface AssetParserMessages {
  invalidShape: string
  emptyAssets: string
  emptyLogicGroups?: string
  tenantRequired: string
  requiredString: (values: { row: number; field: string }) => string
  requiredArray: (values: { row: number; field: string }) => string
  invalidIp: (values: { row: number; index: number; value: string }) => string
  invalidMac: (values: { row: number; index: number; value: string }) => string
  invalidJson: string
}

const defaultMessages: AssetParserMessages = {
  invalidShape: "Invalid file format: expected tenant_id and hosts.",
  emptyAssets: "No host data was found in the file.",
  emptyLogicGroups: "No logic group data was found in the file.",
  tenantRequired: "tenant_id is required.",
  requiredString: ({ row, field }) => `Record ${row}: ${field} is required.`,
  requiredArray: ({ row, field }) => `Record ${row}: ${field} must be a non-empty array.`,
  invalidIp: ({ row, index, value }) => `Record ${row}: IP address #${index} is invalid (${value}).`,
  invalidMac: ({ row, index, value }) => `Record ${row}: MAC address #${index} is invalid (${value}).`,
  invalidJson: "Invalid JSON format. Check that the file contains valid JSON.",
}

function normalizeOwnerRole(role: unknown): OwnerRole {
  const normalized = String(role || "operator").trim()
  if (normalized === "admin" || normalized === "auditor" || normalized === "operator") {
    return normalized
  }
  return "operator"
}

export function parseAssetFile(content: string, messages: AssetParserMessages = defaultMessages): CollectionImportData {
  try {
    const data = JSON.parse(content)

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error(messages.invalidShape)
    }

    const tenantId = String((data as { tenant_id?: unknown }).tenant_id || "").trim()
    const logicGroups = Array.isArray((data as { logic_groups?: unknown }).logic_groups)
      ? ((data as { logic_groups: UserLogicGroup[] }).logic_groups || [])
      : []
    const hosts = Array.isArray((data as { hosts?: unknown }).hosts) ? ((data as { hosts: UiAssetData[] }).hosts || []) : []

    if (!tenantId) {
      throw new Error(messages.tenantRequired)
    }
    if (hosts.length === 0) {
      throw new Error(messages.emptyAssets)
    }

    const validatedHosts = hosts.map((host: any, index: number) => {
      const row = index + 1

      if (!host.agent_id || typeof host.agent_id !== "string" || host.agent_id.trim() === "") {
        throw new Error(messages.requiredString({ row, field: "agent_id" }))
      }
      if (!host.hostname || typeof host.hostname !== "string" || host.hostname.trim() === "") {
        throw new Error(messages.requiredString({ row, field: "hostname" }))
      }
      if (!Array.isArray(host.ip) || host.ip.length === 0) {
        throw new Error(messages.requiredArray({ row, field: "ip" }))
      }
      if (!host.os_name || typeof host.os_name !== "string" || host.os_name.trim() === "") {
        throw new Error(messages.requiredString({ row, field: "os_name" }))
      }
      if (!host.os_version || typeof host.os_version !== "string" || host.os_version.trim() === "") {
        throw new Error(messages.requiredString({ row, field: "os_version" }))
      }
      if (!host.product_id || typeof host.product_id !== "string" || host.product_id.trim() === "") {
        throw new Error(messages.requiredString({ row, field: "product_id" }))
      }
      if (!host.cpu_id || typeof host.cpu_id !== "string" || host.cpu_id.trim() === "") {
        throw new Error(messages.requiredString({ row, field: "cpu_id" }))
      }
      if (!host.board_serial || typeof host.board_serial !== "string" || host.board_serial.trim() === "") {
        throw new Error(messages.requiredString({ row, field: "board_serial" }))
      }
      if (!Array.isArray(host.harddisk_id) || host.harddisk_id.length === 0) {
        throw new Error(messages.requiredArray({ row, field: "harddisk_id" }))
      }
      if (!Array.isArray(host.macs) || host.macs.length === 0) {
        throw new Error(messages.requiredArray({ row, field: "macs" }))
      }

      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
      host.ip.forEach((ip: string, ipIndex: number) => {
        if (!ipPattern.test(String(ip).trim())) {
          throw new Error(messages.invalidIp({ row, index: ipIndex + 1, value: String(ip) }))
        }
      })

      const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
      host.macs.forEach((mac: string, macIndex: number) => {
        if (!macPattern.test(String(mac).trim())) {
          throw new Error(messages.invalidMac({ row, index: macIndex + 1, value: String(mac) }))
        }
      })

      return {
        agent_id: String(host.agent_id).trim(),
        hostname: String(host.hostname).trim(),
        ip: host.ip.map((ip: string) => String(ip).trim()),
        os_type: host.os_type ? String(host.os_type).trim() : "unknown",
        os_name: String(host.os_name).trim(),
        os_version: String(host.os_version).trim(),
        product_id: String(host.product_id).trim(),
        cpu_id: String(host.cpu_id).trim(),
        harddisk_id: host.harddisk_id.map((id: string) => String(id).trim()),
        board_serial: String(host.board_serial).trim(),
        macs: host.macs.map((mac: string) => String(mac).trim().toUpperCase()),
        department_path: host.department_path ? String(host.department_path).trim() : undefined,
        group_id: host.group_id ? String(host.group_id).trim() : undefined,
        owner: host.owner
          ? {
              username: String(host.owner.username || "").trim(),
              role: normalizeOwnerRole(host.owner.role),
              phone: host.owner.phone ? String(host.owner.phone).trim() : undefined,
              email: host.owner.email ? String(host.owner.email).trim() : undefined,
            }
          : undefined,
      }
    })

    return {
      tenant_id: tenantId,
      logic_groups: ensureLogicGroupIds(logicGroups),
      hosts: validatedHosts,
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(messages.invalidJson)
    }
    throw error
  }
}
