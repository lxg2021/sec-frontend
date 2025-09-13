

/**
 * 表示单个 CPU 插槽信息
 */
export interface CpuSocketInfo {
  /** CPU 插槽编号，例如 "Socket 0" */
  socketId: string
  /** CPU 厂商，例如 "GenuineIntel" */
  vendor: string
  /** CPU 型号，例如 "Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz" */
  model: string
  /** 物理核心数量 */
  physicalCores: number
  /** 逻辑核心数量 */
  logicalCores: number
  /** 最大频率，单位 MHz */
  maxFrequencyMHz: number
  /** 标称/正常频率，单位 MHz */
  regularFrequencyMHz: number
  /** 最小频率，单位 MHz（可能为 -1 表示未知） */
  minFrequencyMHz: number
  /** 当前频率，单位 MHz */
  currentFrequencyMHz: number
  /** CPU 缓存大小，单位字节 */
  cacheSizeBytes: number
}

/**
 * 表示整个系统的 CPU 信息
 */
export interface CpuInfos {
  /** 系统中所有 CPU 插槽信息 */
  sockets: CpuSocketInfo[]
}


/**
 * 单个硬盘信息
 */
export interface Disk {
  /** 硬盘厂商 */
  vendor: string
  /** 硬盘型号 */
  model: string
  /** 硬盘序列号 */
  serialNumber: string
  /** 硬盘大小，单位字节 */
  size: number
}

/**
 * 系统中所有硬盘信息
 */
export interface DiskInfos {
  /** 系统中所有硬盘 */
  disks: Disk[]
}


/**
 * 表示单个 GPU 信息
 */
export interface GpuInfo {
  /** GPU 编号，例如 "GPU 0" */
  id: string
  /** GPU 厂商，例如 "NVIDIA" */
  vendor: string
  /** GPU 型号，例如 "NVIDIA GeForce RTX 3070 Ti" */
  model: string
  /** GPU 驱动版本，例如 "31.0.15.2698" */
  driverVersion: string
  /** 显存大小，单位 MiB */
  memoryMiB: number
  /** GPU 最小频率，单位 MHz（可能为 0 表示未知或未读取到） */
  minFrequencyMHz: number
  /** GPU 当前频率，单位 MHz */
  currentFrequencyMHz: number
  /** GPU 最大频率，单位 MHz */
  maxFrequencyMHz: number
}

/**
 * 表示系统中所有 GPU 信息
 */
export interface GpuInfos {
  /** 系统中所有 GPU 列表 */
  gpus: GpuInfo[]
}


/**
 * 主板信息
 */
export interface MainBoard {
  /** 主板厂商 */
  vendor: string
  /** 主板型号 */
  name: string
  /** 主板版本 */
  version: string
  /** 主板序列号 */
  serialNumber: string
}

/**
 * RAM 模块信息
 */
export interface RAM {
  /** 内存厂商 */
  vendor: string
  /** 内存型号 */
  model: string
  /** 内存名称 */
  name: string
  /** 内存序列号 */
  serialNumber: string
  /** 内存总容量（MiB） */
  sizeMiB: number
  /** 已用容量（MiB） */
  usedMiB: number
  /** 可用容量（MiB） */
  availableMiB: number
}


/**
 * 表示单个网卡信息
 */
export interface NetworkInterface {
  /** 网卡编号，例如 "Ethernet 0" 或 "Wi-Fi 1" */
  id: string
  /** 网卡名称，例如 "Intel(R) Ethernet Connection" */
  name: string
  /** 网卡厂商 */
  vendor: string
  /** MAC 地址，例如 "00:1A:2B:3C:4D:5E" */
  macAddress: string
  /** IPv4 地址列表 */
  ipv4Addresses: string[]
  /** IPv6 地址列表 */
  ipv6Addresses: string[]
  /** 是否启用 */
  enabled: boolean
  /** 网卡速度，单位 Mbps，可能为 0 表示未知 */
  speedMbps: number
}

/**
 * 系统中所有网卡信息
 */
export interface NetworkInterfaces {
  /** 系统中的所有网卡列表 */
  interfaces: NetworkInterface[]
}


/**
 * 主机硬件信息
 */
export interface AgentHardwareInfo {
  /** 主机 ID */
  hostId: string

  /** 主机名，例如 "MY-PC" */
  hostname: string

  /** CPU 信息 */
  cpu: CpuInfos

  /** 硬盘信息 */
  disks: DiskInfos

  /** GPU 信息 */
  gpus: GpuInfos

  /** 主板信息 */
  mainBoard: MainBoard

  /** 内存信息（多个 RAM 模块） */
  rams: RAM[]

  /** 网卡信息 */
  networkInterfaces: NetworkInterfaces
}
