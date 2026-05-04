import type { ConfigCategory } from "@/features/sensor-config/types/config-item"

export const defaultConfigCategory: ConfigCategory[] = [
  {
    label: "进程组",
    items: [
      {
        key: "ProcessAccess",
        label: "跨进程操作",
        enabled: true,
        description: "针对系统关键或关注进程的跨进程操作，例如针对 lsass 进程操作，记录操作者进程",
      },
      {
        key: "RemoteThread",
        label: "远程线程",
        enabled: true,
        description: "监视远程线程注入行为，跨进程创建远程线程事件",
      },
      {
        key: "ProcessCreate",
        label: "进程创建",
        enabled: true,
        description: "监控系统中进程创建行为，记录新进程信息及其父子关系",
      },
      {
        key: "ProcessExit",
        label: "进程退出",
        enabled: true,
        description: "用于构建完整进程生命周期，支持进程后台分析，跟踪进程自我退出或被其他进程强制结束",
      },
      {
        key: "CrossMemoryExecute",
        label: "跨进程可执行内存",
        enabled: true,
        description: "监测跨进程写入可执行内存，用于检测 shellcode 注入等行为",
      },
    ],
  },
  {
    label: "网络组",
    items: [
      {
        key: "DNS",
        label: "DNS网络请求",
        enabled: true,
        description: "监测系统的 DNS 网络请求，用于分析域名解析行为和潜在可疑通信",
      },
      {
        key: "NetComunicate",
        label: "网络连接请求",
        enabled: true,
        description: "监测系统的网络连接行为，用于分析进程与远程主机的通信",
      },
      {
        key: "Url",
        label: "URL访问",
        enabled: true,
        description: "监测系统发起的 URL 访问行为，用于分析网络请求及潜在可疑访问",
      },
    ],
  },
  {
    label: "服务组",
    items: [
      {
        key: "ServiceCreate",
        label: "创建系统服务",
        enabled: true,
        description: "创建系统服务事件",
      },
      {
        key: "ServiceStart",
        label: "启动系统服务",
        enabled: true,
        description: "启动系统服务事件",
      },
      {
        key: "ServiceDelete",
        label: "删除系统服务",
        enabled: true,
        description: "删除系统服务事件",
      },
      {
        key: "ServiceStop",
        label: "停止系统服务",
        enabled: true,
        description: "停止系统服务事件",
      },
      {
        key: "ServiceConfig",
        label: "修改系统服务配置",
        enabled: true,
        description: "修改系统服务配置事件，用于检测服务劫持",
      },
      {
        key: "ServicePause",
        label: "暂停或恢复系统服务",
        enabled: true,
        description: "暂停或恢复系统服务事件",
      },
    ],
  },
  {
    label: "设备变更组",
    items: [
      {
        key: "DeviceChange",
        label: "设备变更",
        enabled: true,
        description: "针对可插拔设备（如 U 盘、光驱）的插入、弹出及操作事件",
      },
    ],
  },
  {
    label: "镜像组",
    items: [
      {
        key: "DriverImageLoad",
        label: "驱动镜像加载",
        enabled: true,
        description: "监测驱动镜像加载事件",
      },
      {
        key: "DllImageLoad",
        label: "DLL镜像加载",
        enabled: true,
        description: "监测 DLL 镜像加载事件",
      },
    ],
  },
  {
    label: "Task计划任务组",
    items: [
      {
        key: "TaskCreate",
        label: "创建计划任务",
        enabled: true,
        description: "创建计划任务事件，通常用于程序在系统中注册定时执行任务，可能被恶意软件利用来实现持久化",
      },
      {
        key: "TaskDelete",
        label: "删除计划任务",
        enabled: true,
        description: "删除计划任务事件，用于监控是否有程序在移除任务，可能是清理自身痕迹或破坏系统任务",
      },
    ],
  },
  {
    label: "WMI组",
    items: [
      {
        key: "WmiQuery",
        label: "WMI查询",
        enabled: true,
        description: "WMI 查询信息事件，可用于远程嗅探和窃取信息",
      },
      {
        key: "WmiCreateClass",
        label: "创建WMI类",
        enabled: true,
        description: "用于监测无文件攻击，支持 Base64 隐藏混淆代码",
      },
      {
        key: "WmiFilter",
        label: "WMI过滤器",
        enabled: true,
        description: "监测 WMI 持久化操作，触发执行事件",
      },
      {
        key: "WmiConsumer",
        label: "WMI消费者",
        enabled: true,
        description:
          "监测WMI持久化脚本执行，支持所有微软Consumer类型",
      },
      {
        key: "WmiBinding",
        label: "WMI绑定",
        enabled: true,
        description: "WMI Filter 与 Consumer 的绑定事件",
      },
      {
        key: "WmiExecute",
        label: "WMI执行",
        enabled: true,
        description: "监测委托执行或远程执行事件，记录执行程序及命令行，用于躲避监测行为",
      },
    ],
  },
  {
    label: "Bits组",
    items: [
      {
        key: "BitsCreateJob",
        label: "创建BITS任务",
        enabled: true,
        description: "创建BITS任务，用于后台文件传输。攻击者可能通过创建恶意任务来下载或上传数据",
      },
      {
        key: "BitsJobAddFile",
        label: "添加文件到BITS任务",
        enabled: true,
        description: "向BITS任务中添加文件，指定需要下载或上传的文件路径，可能被利用来获取远程恶意文件",
      },
      {
        key: "BitsJobChangeState",
        label: "BITS任务状态变更",
        enabled: true,
        description: "BITS任务状态变更通知，例如任务完成、暂停、失败等，用于跟踪任务的执行情况",
      },
    ],
  },
  {
    label: "WindowsMessage组",
    items: [
      {
        key: "WindowsMessageHook",
        label: "Windows Hook消息",
        enabled: true,
        description:
          "用于捕获和监控 Windows 窗口消息，检测进程之间的消息钩挂行为，常用于发现键盘、鼠标等输入监控以及进程注入手段",
      },
    ],
  },
  {
    label: "EncryptDecrypt组",
    items: [
      {
        key: "EncryptDecrypt",
        label: "凭据加解密",
        enabled: true,
        description: "常用于监测凭据盗取及勒索行为的加解密操作事件",
      },
    ],
  },
  {
    label: "TokenPrivilege组",
    items: [
      {
        key: "AdjustPrivilege",
        label: "权限调整",
        enabled: true,
        description: "自身或跨进程特权调整，用于记录敏感权限变更，例如增加 SE_BACKUP_PRIVILEGE",
      },
      {
        key: "TokenImpersonation",
        label: "模拟令牌",
        enabled: true,
        description: "与令牌相关的操作监测，记录发起者和目标进程信息",
      },
      {
        key: "CreateProcessSetToken",
        label: "创建进程设置令牌",
        enabled: true,
        description: "创建进程时设置新令牌事件，记录目标进程及设置信息",
      },
    ],
  },
  {
    label: "凭据组",
    items: [
      {
        key: "StealingCredentials",
        label: "盗取凭据",
        enabled: true,
        description: "监测系统及应用凭据盗取行为，记录 CredType 类型，支持十多种系统及应用凭据监测",
      },
    ],
  },
  {
    label: "文件组",
    items: [
      {
        key: "FileCreate",
        label: "文件创建",
        enabled: true,
        description:
          "文件创建事件，支持格式识别（如 PE/EXE）、壳识别（如 VMProtect 2.x）、SDB 垫片攻击监测及 OLE 攻击监测",
      },
      {
        key: "FileDelete",
        label: "文件删除",
        enabled: true,
        description: "文件删除事件",
      },
      {
        key: "FileChangeAttributes",
        label: "文件属性修改",
        enabled: true,
        description: "文件属性修改事件，主要针对隐藏、去除只读、修改创建时间等行为",
      },
      {
        key: "FileRename",
        label: "文件重命名",
        enabled: true,
        description: "文件重命名事件",
      },
      {
        key: "FileMove",
        label: "文件移动",
        enabled: true,
        description: "文件移动事件",
      },
      {
        key: "FileRead",
        label: "文件读取",
        enabled: true,
        description: "监测读取关键文件事件，例如凭据文件、私密文件、重要业务配置文件等",
      },
      {
        key: "FileWrite",
        label: "文件写入",
        enabled: true,
        description: "监测写入关键文件事件，例如凭据文件、私密文件、登录脚本、重要业务配置文件等",
      },
      {
        key: "FileSetEa",
        label: "文件 EA 写入",
        enabled: true,
        description: "隐藏攻击监测，攻击者将脚本、混淆代码或二进制写入 EA 扩展属性",
      },
      {
        key: "FileStreamCreate",
        label: "文件流创建",
        enabled: true,
        description: "隐藏攻击监测，攻击者将脚本、混淆代码或二进制写入文件流，或通过浏览器下载文件写入流",
      },
      {
        key: "FileStreamDelete",
        label: "文件流删除",
        enabled: true,
        description: "删除文件流事件",
      },
      {
        key: "AccessVolume",
        label: "访问卷",
        enabled: true,
        description: "直接访问卷事件",
      },
    ],
  },
  {
    label: "Powershell组",
    items: [
      {
        key: "Powershell",
        label: "Powershell执行信息",
        enabled: true,
        description: "监测系统中 PowerShell 执行行为，记录执行命令、脚本内容及发起进程信息，用于分析潜在异常操作",
      },
    ],
  },
  {
    label: "注册表组",
    items: [
      {
        key: "RegKeyCreate",
        label: "创建注册表键",
        enabled: true,
        description: "注册表键创建事件",
      },
      {
        key: "RegKeyRename",
        label: "重命名注册表键",
        enabled: true,
        description: "注册表键重命名事件",
      },
      {
        key: "RegKeyDelete",
        label: "删除注册表键",
        enabled: true,
        description: "注册表键删除事件",
      },
      {
        key: "RegValueSet",
        label: "设置注册表值",
        enabled: true,
        description: "注册表键值设置事件",
      },
      {
        key: "RegValueDelete",
        label: "删除注册表值",
        enabled: true,
        description: "注册表键值删除事件",
      },
      {
        key: "RegValueQuery",
        label: "查询关键注册表值",
        enabled: true,
        description: "关键注册表值查询事件，例如密钥查询",
      },
    ],
  },
  {
    label: "命名对象组",
    items: [
      {
        key: "PipeCreate",
        label: "Pipe 创建",
        enabled: false,
        description: "创建或打开命名的 Pipe",
      },
      {
        key: "PipeConnect",
        label: "Pipe 连接",
        enabled: false,
        description: "连接命名的 Pipe",
      },
      {
        key: "FileMappingCreate",
        label: "FileMapping 创建",
        enabled: false,
        description: "创建或打开命名的 FileMapping",
      },
      {
        key: "FileMappingConnect",
        label: "FileMapping 连接",
        enabled: false,
        description: "连接命名的 FileMapping",
      },
      {
        key: "MailSlotCreate",
        label: "MailSlot 创建",
        enabled: false,
        description: "创建或打开命名的 MailSlot",
      },
      {
        key: "MailSlotConnect",
        label: "MailSlot 连接",
        enabled: false,
        description: "连接命名的 MailSlot",
      },
      {
        key: "EventCreate",
        label: "Event 创建",
        enabled: false,
        description: "创建命名的 Event",
      },
      {
        key: "EventOpen",
        label: "Event 打开",
        enabled: false,
        description: "打开命名的 Event",
      },
    ],
  },
  {
    label: "引导组",
    items: [
      {
        key: "MBR",
        label: "主引导记录",
        enabled: true,
        description: "监测主引导记录（MBR）操作行为，记录读写及修改行为，监控潜在引导区攻击",
      },
      {
        key: "CBR",
        label: "卷引导记录",
        enabled: true,
        description: "监测卷引导记录（CBR）操作行为，记录读写及修改行为，监控潜在卷引导攻击",
      },
    ],
  },
  {
    label: "性能监视组",
    items: [
      {
        key: "PerfMonitor",
        label: "系统性能监控",
        enabled: true,
        description: "监控系统性能，记录 CPU、内存、磁盘等资源运行情况",
      },
    ],
  },
  {
    label: "账户组",
    items: [
      {
        key: "CreateAccount",
        label: "创建账户",
        enabled: false,
        description: "创建账户事件",
      },
      {
        key: "EnableAccount",
        label: "启用账户",
        enabled: false,
        description: "启用账户事件",
      },
      {
        key: "ResetAccountPassword",
        label: "重置账户密码",
        enabled: false,
        description: "重置账户密码事件",
      },
      {
        key: "DisableAccount",
        label: "禁用账户",
        enabled: false,
        description: "禁用账户事件",
      },
      {
        key: "DeleteAccount",
        label: "删除账户",
        enabled: false,
        description: "删除账户事件",
      },
      {
        key: "ModifyAccount",
        label: "修改账户",
        enabled: false,
        description: "更改账户信息事件",
      },
      {
        key: "AddAccountToGroup",
        label: "账户添加到组",
        enabled: false,
        description: "将账户添加到本地组事件",
      },
      {
        key: "DeleteAccountFromGroup",
        label: "账户从组删除",
        enabled: false,
        description: "从本地组删除账户事件",
      },
      {
        key: "CreateGroup",
        label: "创建本地组",
        enabled: false,
        description: "创建或启用本地组事件",
      },
      {
        key: "DeleteGroup",
        label: "删除本地组",
        enabled: false,
        description: "删除本地组事件",
      },
    ],
  },
]
