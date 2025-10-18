import type { UiAssetData } from "@/lib/computer/ui-asset-data"

/**
 * 解析资产文件内容
 * @param content - JSON格式的文件内容
 * @returns 解析后的资产数据数组
 * @throws 如果文件格式不正确或数据验证失败
 */
export function parseAssetFile(content: string): UiAssetData[] {
  try {
    const data = JSON.parse(content)

    let assetsArray: any[]

    if (Array.isArray(data)) {
      assetsArray = data
    } else if (data.source_data && Array.isArray(data.source_data)) {
      assetsArray = data.source_data
    } else if (data.assets && Array.isArray(data.assets)) {
      assetsArray = data.assets
    } else {
      throw new Error("文件格式不正确：需要包含 source_data 数组、assets 数组或直接为数组格式")
    }

    if (assetsArray.length === 0) {
      throw new Error("文件中没有资产数据")
    }

    const assets: UiAssetData[] = assetsArray.map((asset: any, index: number) => {
      const rowNumber = index + 1

      // 验证必填字段
      if (!asset.host_id || typeof asset.host_id !== "string" || asset.host_id.trim() === "") {
        throw new Error(`第 ${rowNumber} 条记录：host_id（主机唯一标识）为必填项`)
      }

      if (!asset.host_name || typeof asset.host_name !== "string" || asset.host_name.trim() === "") {
        throw new Error(`第 ${rowNumber} 条记录：host_name（主机名）为必填项`)
      }

      if (!Array.isArray(asset.ip) || asset.ip.length === 0) {
        throw new Error(`第 ${rowNumber} 条记录：ip（IP地址列表）必须是非空数组`)
      }

      if (!asset.os_name || typeof asset.os_name !== "string" || asset.os_name.trim() === "") {
        throw new Error(`第 ${rowNumber} 条记录：os_name（操作系统名称）为必填项`)
      }

      if (!asset.os_version || typeof asset.os_version !== "string" || asset.os_version.trim() === "") {
        throw new Error(`第 ${rowNumber} 条记录：os_version（操作系统版本）为必填项`)
      }

      if (!asset.cpu_id || typeof asset.cpu_id !== "string" || asset.cpu_id.trim() === "") {
        throw new Error(`第 ${rowNumber} 条记录：cpu_id（CPU序列号）为必填项`)
      }

      if (!Array.isArray(asset.harddisk_id) || asset.harddisk_id.length === 0) {
        throw new Error(`第 ${rowNumber} 条记录：harddisk_id（硬盘ID列表）必须是非空数组`)
      }

      if (!asset.board_serial || typeof asset.board_serial !== "string" || asset.board_serial.trim() === "") {
        throw new Error(`第 ${rowNumber} 条记录：board_serial（主板序列号）为必填项`)
      }

      if (!Array.isArray(asset.macs) || asset.macs.length === 0) {
        throw new Error(`第 ${rowNumber} 条记录：macs（MAC地址列表）必须是非空数组`)
      }

      // 验证IP地址格式
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
      asset.ip.forEach((ip: string, ipIndex: number) => {
        if (!ipPattern.test(ip.trim())) {
          throw new Error(`第 ${rowNumber} 条记录：第 ${ipIndex + 1} 个IP地址格式不正确 (${ip})`)
        }
      })

      // 验证MAC地址格式
      const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
      asset.macs.forEach((mac: string, macIndex: number) => {
        if (!macPattern.test(mac.trim())) {
          throw new Error(`第 ${rowNumber} 条记录：第 ${macIndex + 1} 个MAC地址格式不正确 (${mac})`)
        }
      })

      // 构建符合AssetData接口的对象
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

    return assets
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("JSON 格式错误：请检查文件内容是否为有效的 JSON 格式")
    }
    throw error
  }
}
