/**
 * 软件安装状态枚举
 */
export enum InstallState {
  /** 已发布，但尚未安装（Advertised） */
  Advertised = 1,

  /** 未安装（Absent） */
  Absent = 2,

  /** 已安装到本地（Local） */
  Local = 3,

  /** 从源位置运行（Source） */
  Source = 4,

  /** 默认安装状态（Default） */
  Default = 5,
}

/**
 * 软件信息接口
 */
export interface Software {
  /** 软件显示名称（一般是控制面板/应用管理器里显示的名字） */
  displayName: string

  /** 软件描述信息 */
  description: string

  /** 唯一标识某个软件/补丁/安装包的编号（如产品代码、GUID） */
  identifyingNumber: string

  /** 安装日期（格式通常为 YYYYMMDD 或 ISO 格式） */
  installDate: string

  /** 软件安装路径（例如 "C:\\Program Files\\AppName"） */
  installLocation: string

  /** 安装状态 */
  installState: InstallState

  /** 软件内部名称（可能比 displayName 更简短或更技术化） */
  name: string

  /** 软件安装包缓存路径（MSI 缓存或临时存储位置） */
  packageCache: string

  /** SKU 编号，用于区分不同版本/渠道的产品 */
  skuNumber: string

  /** 发布商 / 软件厂商 */
  vendor: string

  /** 软件版本号（例如 "1.0.0" 或 "16.0.12345.20002"） */
  version: string

  /** 卸载命令（通常是 MSIExec 或 EXE 路径，可供程序卸载用） */
  uninstallString: string

  /** 静默卸载命令（无需用户交互，常用于自动化卸载） */
  quietUninstallString: string

  /** 软件信息网址（厂商提供的官网或介绍页面链接） */
  urlInfoAbout: string
}


/**
 * 主机软件信息
 */
export interface AgentSoftInfo {
  /** 主机 ID */
  hostId: string

  /** 主机名，例如 "MY-PC" */
  hostname: string

  /** 主机上安装的软件列表 */
  softwareList: Software[]
}