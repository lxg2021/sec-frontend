import type { CollectionImportData } from "@/features/collection/types"

export const PUBLIC_TENANT_ID = "public"

export const defaultCollectionTemplate: CollectionImportData = {
  tenant_id: PUBLIC_TENANT_ID,
  logic_groups: [],
  hosts: [
    {
      agent_id: "HOST-001",
      hostname: "sec-node-01",
      ip: ["192.168.1.100", "10.0.0.100"],
      os_type: "linux",
      os_name: "Ubuntu",
      os_version: "22.04 LTS",
      product_id: "PROD-2024-001",
      cpu_id: "BFEBFBFF000906E9",
      harddisk_id: ["WD-WCC4E0123456", "ST2000DM001-ABC123"],
      board_serial: "L1HF65J00X9",
      macs: ["00:1B:44:11:3A:B7", "00:1B:44:11:3A:B8"],
      owner: {
        username: "张三",
        role: "admin",
        phone: "13800138000",
        email: "zhangsan@example.com",
      },
    },
    {
      agent_id: "HOST-002",
      hostname: "sec-node-02",
      ip: ["192.168.1.101"],
      os_type: "linux",
      os_name: "CentOS",
      os_version: "7.9",
      product_id: "PROD-2024-002",
      cpu_id: "BFEBFBFF000906EA",
      harddisk_id: ["ST1000DM003-XYZ789"],
      board_serial: "L1HF65J00Y0",
      macs: ["00:1B:44:11:3A:C7"],
      owner: {
        username: "李四",
        role: "operator",
        phone: "13900139000",
        email: "lisi@example.com",
      },
    },
  ],
}

export const platformDownloads = [
  {
    name: "Windows",
    icon: "/icons/system/windows.svg",
    version: "v2.1.0",
    size: "15.2 MB",
    sha256: "a3f5b8c9d2e1f4a7b6c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    downloadUrl: "/downloads/scanner-windows.exe",
  },
  {
    name: "macOS",
    icon: "/icons/system/macos.svg",
    version: "v2.1.0",
    size: "18.5 MB",
    sha256: "b4g6c9d3f2e5a8c7d9e1f2b3c4d5e6f7a8b9c0d1e2f3c4d5e6f7a8b9c0b1c2d3",
    downloadUrl: "/downloads/scanner-macos.dmg",
  },
  {
    name: "Linux",
    icon: "/icons/system/linux.svg",
    version: "v2.1.0",
    size: "12.8 MB",
    sha256: "c5h7d0e4g3f6b9d8e2f3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5",
    downloadUrl: "/downloads/scanner-linux.tar.gz",
  },
]
