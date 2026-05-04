import type { UiAssetData } from "@/features/collection/types"

export interface AssetParserMessages {
  invalidShape: string
  emptyAssets: string
  requiredString: (values: { row: number; field: string }) => string
  requiredArray: (values: { row: number; field: string }) => string
  invalidIp: (values: { row: number; index: number; value: string }) => string
  invalidMac: (values: { row: number; index: number; value: string }) => string
  invalidJson: string
}

const defaultMessages: AssetParserMessages = {
  invalidShape: "Invalid file format: expected source_data, assets, or a top-level array.",
  emptyAssets: "No asset data was found in the file.",
  requiredString: ({ row, field }) => `Record ${row}: ${field} is required.`,
  requiredArray: ({ row, field }) => `Record ${row}: ${field} must be a non-empty array.`,
  invalidIp: ({ row, index, value }) => `Record ${row}: IP address #${index} is invalid (${value}).`,
  invalidMac: ({ row, index, value }) => `Record ${row}: MAC address #${index} is invalid (${value}).`,
  invalidJson: "Invalid JSON format. Check that the file contains valid JSON.",
}

export function parseAssetFile(content: string, messages: AssetParserMessages = defaultMessages): UiAssetData[] {
  try {
    const data = JSON.parse(content)

    let assetsArray: unknown[]

    if (Array.isArray(data)) {
      assetsArray = data
    } else if (data.source_data && Array.isArray(data.source_data)) {
      assetsArray = data.source_data
    } else if (data.assets && Array.isArray(data.assets)) {
      assetsArray = data.assets
    } else {
      throw new Error(messages.invalidShape)
    }

    if (assetsArray.length === 0) {
      throw new Error(messages.emptyAssets)
    }

    return assetsArray.map((asset: any, index: number) => {
      const row = index + 1

      if (!asset.host_id || typeof asset.host_id !== "string" || asset.host_id.trim() === "") {
        throw new Error(messages.requiredString({ row, field: "host_id" }))
      }

      if (!asset.host_name || typeof asset.host_name !== "string" || asset.host_name.trim() === "") {
        throw new Error(messages.requiredString({ row, field: "host_name" }))
      }

      if (!Array.isArray(asset.ip) || asset.ip.length === 0) {
        throw new Error(messages.requiredArray({ row, field: "ip" }))
      }

      if (!asset.os_name || typeof asset.os_name !== "string" || asset.os_name.trim() === "") {
        throw new Error(messages.requiredString({ row, field: "os_name" }))
      }

      if (!asset.os_version || typeof asset.os_version !== "string" || asset.os_version.trim() === "") {
        throw new Error(messages.requiredString({ row, field: "os_version" }))
      }

      if (!asset.cpu_id || typeof asset.cpu_id !== "string" || asset.cpu_id.trim() === "") {
        throw new Error(messages.requiredString({ row, field: "cpu_id" }))
      }

      if (!Array.isArray(asset.harddisk_id) || asset.harddisk_id.length === 0) {
        throw new Error(messages.requiredArray({ row, field: "harddisk_id" }))
      }

      if (!asset.board_serial || typeof asset.board_serial !== "string" || asset.board_serial.trim() === "") {
        throw new Error(messages.requiredString({ row, field: "board_serial" }))
      }

      if (!Array.isArray(asset.macs) || asset.macs.length === 0) {
        throw new Error(messages.requiredArray({ row, field: "macs" }))
      }

      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
      asset.ip.forEach((ip: string, ipIndex: number) => {
        if (!ipPattern.test(ip.trim())) {
          throw new Error(messages.invalidIp({ row, index: ipIndex + 1, value: ip }))
        }
      })

      const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
      asset.macs.forEach((mac: string, macIndex: number) => {
        if (!macPattern.test(mac.trim())) {
          throw new Error(messages.invalidMac({ row, index: macIndex + 1, value: mac }))
        }
      })

      return {
        host_id: asset.host_id.trim(),
        host_name: asset.host_name.trim(),
        ip: asset.ip.map((ip: string) => ip.trim()),
        os_name: asset.os_name.trim(),
        os_version: asset.os_version.trim(),
        product_id: asset.product_id ? String(asset.product_id).trim() : undefined,
        cpu_id: asset.cpu_id.trim(),
        harddisk_id: asset.harddisk_id.map((id: string) => String(id).trim()),
        board_serial: asset.board_serial.trim(),
        macs: asset.macs.map((mac: string) => mac.trim().toUpperCase()),
        department_path: asset.department_path ? String(asset.department_path).trim() : undefined,
        owner_name: asset.owner_name ? String(asset.owner_name).trim() : undefined,
        owner_role: asset.owner_role ? String(asset.owner_role).trim() : undefined,
        phone: asset.phone ? String(asset.phone).trim() : undefined,
        email: asset.email ? String(asset.email).trim() : undefined,
      }
    })
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(messages.invalidJson)
    }
    throw error
  }
}
