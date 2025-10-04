import type { ProcessNode } from "@/components/graph/node/ProcessNodeConfig";
import type { FileNode } from "@/components/graph//node/FileNodeConfig";
import type { NetNode } from "@/components/graph/node/NetNodeConfig";
import type { DnsNode } from "@/components/graph/node/DnsNodeConfig";
import type { VolumeNode } from "@/components/graph/node/VolumeNodeConfig";
import type { FileStreamNode } from "@/components/graph/node/FileStreamNodeConfig";
import type { BitsJobNode, JobFile } from "@/components/graph/node/BitsJobNodeConfig";
import type { TaskNode, TaskImage, TaskTrigger } from "@/components/graph/node/TaskNodeConfig";
import type { DllImageNode } from "@/components/graph/node/DllImageNodeConfig";
import type { DriverImageNode } from "@/components/graph/node/DriverImageNodeConfig";
import type { EnDecryptNode } from "@/components/graph/node/EnDecryptNodeConfig";
import type { EventNode } from "@/components/graph/node/EventNodeConfig";
import type { FileMappingNode } from "@/components/graph/node/FileMappingNodeConfig";
import type { MailSlotNode } from "@/components/graph/node/MailSlotNodeConfig";
import type { MbrNode } from "@/components/graph/node/MbrNodeConfig";
import type { PipeNode } from "@/components/graph/node/PipeNodeConfig";
import type { PowershellNode } from "@/components/graph/node/PowershellNodeConfig";
import type { RegKeyNode } from "@/components/graph/node/RegKeyNodeConfig";
import type { RegValueNode } from "@/components/graph/node/RegValueNodeConfig";
import type { CredentialsNode } from "@/components/graph/node/CredentialsNodeConfig";
import type { ImpersonationTokenNode, Token } from "@/components/graph/node/ImpersonationTokenNodeConfig";
import type { MessageNode } from "@/components/graph/node/MessageNodeConfig";
import type { UrlNode } from "@/components/graph/node/UrlNodeConfig";
import type { WmiClassNode, ClassAttributeItem } from "@/components/graph/node/WmiClassNodeConfig";
import type { WmiQueryNode } from "@/components/graph/node/WmiQueryNodeConfig";
import type { WmiExecuteNode, ParameterItem } from "@/components/graph/node/WmiExecuteNodeConfig";
import type { WmiConsumerNode } from "@/components/graph/node/WmiConsumerNodeConfig";
import type { WmiFilterNode } from "@/components/graph/node/WmiFilterNodeConfig";
import type { AgentNode } from "@/components/graph/node/AgentNodeConfig";
import type { DeviceChangeNode } from "@/components/graph/node/DeviceChangeNodeConfig";
import type { ServiceNode } from "@/components/graph/node/ServiceNodeConfig";
import type { AccountGroupNode } from "@/components/graph/node/AccountGroupNodeConfig";
import type { AccountNode } from "@/components/graph/node/AccountNodeConfig";
import type { AttackNode } from "@/components/graph/node/AttackNodeConfig";
import { Badge } from "@/components/ui/badge";

// 所有 Node 类型联合
export type AnyNode =
  | ProcessNode
  | FileNode
  | NetNode
  | DnsNode
  | VolumeNode
  | FileStreamNode
  | BitsJobNode
  | TaskNode
  | DllImageNode
  | DriverImageNode
  | EnDecryptNode
  | EventNode
  | FileMappingNode
  | MailSlotNode
  | MbrNode
  | PipeNode
  | PowershellNode
  | RegKeyNode
  | RegValueNode
  | CredentialsNode
  | ImpersonationTokenNode
  | MessageNode
  | UrlNode
  | WmiClassNode
  | WmiQueryNode
  | WmiExecuteNode
  | WmiConsumerNode
  | WmiFilterNode
  | AgentNode
  | DeviceChangeNode
  | ServiceNode
  | AccountGroupNode
  | AccountNode
  | AttackNode

// 节点配置类型
interface NodeConfig {
  label: string;
  icon: string;
  color: string;
  getDisplayText: (node: any) => string;
  additionalBadge?: {
    text: string;
    color: string;
  };
}

// 节点配置映射
const NODE_CONFIGS: Record<string, NodeConfig> = {
  ProcessNode: {
    label: "进程节点",
    icon: "/icons/nodes/process-node.svg",
    color: "#4CAF50",
    getDisplayText: (node: ProcessNode) => node.ProcessName || '--'
  },
  FileNode: {
    label: "文件节点",
    icon: "/icons/nodes/file-node.svg",
    color: "#FF9800",
    getDisplayText: (node: FileNode) => getFileName(node.FileName)
  },
  NetNode: {
    label: "网络节点",
    icon: "/icons/nodes/net-node.svg",
    color: "#2196F3",
    getDisplayText: (node: NetNode) => `${node.SourceIP}-${node.DestinationIP}`,
    additionalBadge: {
      text: (node: NetNode) => node.Direction || '--',
      color: "#2196F3"
    }
  },
  DnsNode: {
    label: "DNS节点",
    icon: "/icons/nodes/dns-node.svg",
    color: "#03A9F4",
    getDisplayText: (node: DnsNode) => node.Domain || '--'
  },
  VolumeNode: {
    label: "卷节点",
    icon: "/icons/nodes/volume-node.svg",
    color: "#8BC34A",
    getDisplayText: (node: VolumeNode) => node.FileName || '--'
  },
  FileStreamNode: {
    label: "文件流节点",
    icon: "/icons/nodes/file-stream-node.svg",
    color: "#FFB74D",
    getDisplayText: (node: FileStreamNode) => getFileName(node.FileName)
  },
  BitsJobNode: {
    label: "BitsJob节点",
    icon: "/icons/nodes/bits-job-node.svg",
    color: "#F57C00",
    getDisplayText: (node: BitsJobNode) => node.JobName || '--'
  },
  TaskNode: {
    label: "计划任务节点",
    icon: "/icons/nodes/task-node.svg",
    color: "#9C27B0",
    getDisplayText: (node: TaskNode) => node.TaskName || '--'
  },
  DllImageNode: {
    label: "DLL节点",
    icon: "/icons/nodes/dll-node.svg",
    color: "#434260",
    getDisplayText: (node: DllImageNode) => node.Image ? getFileName(node.Image) : "未知DLL"
  },
  DriverImageNode: {
    label: "驱动节点",
    icon: "/icons/nodes/driver-image-node.svg",
    color: "#434260",
    getDisplayText: (node: DriverImageNode) => node.Image ? getFileName(node.Image) : "未知驱动"
  },
  EnDecryptNode: {
    label: "加解密节点",
    icon: "/icons/nodes/endecrypt-node.svg",
    color: "#E91E63",
    getDisplayText: (node: EnDecryptNode) => node.CryptFlagDescription || '--'
  },
  EventNode: {
    label: "事件节点",
    icon: "/icons/nodes/event-node.svg",
    color: "#795548",
    getDisplayText: (node: EventNode) => node.EventName || '--'
  },
  FileMappingNode: {
    label: "FileMapping",
    icon: "/icons/nodes/file-mapping-node.svg",
    color: "#6D4C41",
    getDisplayText: (node: FileMappingNode) => node.FileMappingName || '--'
  },
  MailSlotNode: {
    label: "油槽节点",
    icon: "/icons/nodes/mail-slot-node.svg",
    color: "#FF5722",
    getDisplayText: (node: MailSlotNode) => node.MailSlotName || '--'
  },
  MbrNode: {
    label: "引导节点",
    icon: "/icons/nodes/mbr-node.svg",
    color: "#B71C1C",
    getDisplayText: (node: MbrNode) => node.PhysicalName || '--'
  },
  PipeNode: {
    label: "PIPE节点",
    icon: "/icons/nodes/pipe-node.svg",
    color: "#607D8B",
    getDisplayText: (node: PipeNode) => node.PipeName || '--'
  },
  PowershellNode: {
    label: "PowerShell节点",
    icon: "/icons/nodes/powershell-node.svg",
    color: "#5391FE",
    getDisplayText: (node: PowershellNode) => node.FileName ? getFileName(node.FileName) : "未知脚本"
  },
  RegKeyNode: {
    label: "注册表键节点",
    icon: "/icons/nodes/reg-key-node.svg",
    color: "#53B7B7",
    getDisplayText: (node: RegKeyNode) => node.ObjectName || '--'
  },
  RegValueNode: {
    label: "注册表值节点",
    icon: "/icons/nodes/reg-value-node.svg",
    color: "#8E24AA",
    getDisplayText: (node: RegValueNode) => node.ObjectName || '--'
  },
  CredentialsNode: {
    label: "凭据节点",
    icon: "/icons/nodes/credentials-node.svg",
    color: "#C2185B",
    getDisplayText: (node: CredentialsNode) => node.CredDesc || '--'
  },
  ImpersonationTokenNode: {
    label: "令牌节点",
    icon: "/icons/nodes/impersonation-token-node.svg",
    color: "#AD1457",
    getDisplayText: (node: ImpersonationTokenNode) => node.TokenFlagDescription || '--'
  },
  MessageNode: {
    label: "MessageHook节点",
    icon: "/icons/nodes/message-node.svg",
    color: "#CDDC39",
    getDisplayText: (node: MessageNode) => node.HookTypeDescription || '--'
  },
  UrlNode: {
    label: "URL节点",
    icon: "/icons/nodes/url-node.svg",
    color: "#00BCD4",
    getDisplayText: (node: UrlNode) => node.URL || '--'
  },
  WmiClassNode: {
    label: "WMI类节点",
    icon: "/icons/nodes/wmi-class-node.svg",
    color: "#26A69A",
    getDisplayText: (node: WmiClassNode) => node.ClassName || '--'
  },
  WmiQueryNode: {
    label: "WMI查询节点",
    icon: "/icons/nodes/wmi-query-node.svg",
    color: "#BA68C8",
    getDisplayText: (node: WmiQueryNode) => node.Query || '--'
  },
  WmiExecuteNode: {
    label: "WMI执行节点",
    icon: "/icons/nodes/wmi-execute-node.svg",
    color: "#BA68C8",
    getDisplayText: (node: WmiExecuteNode) => node.ClassName || '--'
  },
  WmiConsumerNode: {
    label: "WmiConsumer节点",
    icon: "/icons/nodes/wmi-consumer-node.svg",
    color: "#4396F0",
    getDisplayText: (node: WmiConsumerNode) => node.EventConsumerName || '--'
  },
  WmiFilterNode: {
    label: "WmiFilter节点",
    icon: "/icons/nodes/wmi-filter-node.svg",
    color: "#6A1B9A",
    getDisplayText: (node: WmiFilterNode) => node.EventFilterName || '--'
  },
  AgentNode: {
    label: "主机节点",
    icon: "/icons/nodes/agent-node.svg",
    color: "#388E3C",
    getDisplayText: (node: AgentNode) => node.ComputerName || '--'
  },
  DeviceChangeNode: {
    label: "设备节点",
    icon: "/icons/nodes/device-change-node.svg",
    color: "#FFA000",
    getDisplayText: (node: DeviceChangeNode) => node.DeviceDescription || '--'
  },
  ServiceNode: {
    label: "服务节点",
    icon: "/icons/nodes/service-node.svg",
    color: "#FF7043",
    getDisplayText: (node: ServiceNode) => node.ServiceName || '--'
  },
  AccountGroupNode: {
    label: "账户组节点",
    icon: "/icons/nodes/account-group-node.svg",
    color: "#0288D1",
    getDisplayText: (node: AccountGroupNode) => node.GroupName || '--'
  },
  AccountNode: {
    label: "账户节点",
    icon: "/icons/nodes/account-node.svg",
    color: "#039BE5",
    getDisplayText: (node: AccountNode) => node.UserName || '--'
  },
  AttackNode: {
    label: "ATTACK节点",
    icon: "/icons/nodes/attack-node.svg",
    color: "#D32F2F",
    getDisplayText: (node: AttackNode) => node.ID || '--'
  }
};

// 提取文件名工具函数
const getFileName = (fileName: string): string => {
  if (!fileName) return "未知文件";
  const lastSlashIndex = Math.max(fileName.lastIndexOf("\\"), fileName.lastIndexOf("/"));
  return lastSlashIndex >= 0 ? fileName.slice(lastSlashIndex + 1) : fileName;
};

// 获取背景颜色对应的浅色背景
const getLightBackgroundColor = (color: string): string => {
  // 这里可以根据需要实现颜色转换逻辑
  // 暂时返回固定的浅色背景
  return `${color}20`; // 添加透明度
};

// 公共节点布局组件
interface NodeLabelLayoutProps {
  config: NodeConfig;
  nodeId: string;
  node: AnyNode;
}

const NodeLabelLayout: React.FC<NodeLabelLayoutProps> = ({ config, nodeId, node }) => {
  const displayText = config.getDisplayText(node);
  const lightBgColor = getLightBackgroundColor(config.color);

  return (
    <div className="w-80 flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* 节点图标 */}
      <div
        className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full"
        style={{ backgroundColor: lightBgColor }}
      >
        <img src={config.icon} alt={config.label} className="w-4 h-4" />
      </div>

      {/* 节点类型徽章 */}
      <Badge
        className="flex-shrink-0 text-white border-0 text-xs font-medium text-center"
        style={{
          backgroundColor: config.color,
          minWidth: `${Math.max(config.label.length * 12, 48)}px`
        }}
      >
        {config.label}
      </Badge>

      {/* 节点ID 
      <span className="flex-shrink-0 text-xs font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded min-w-[60px] text-center">
        #{nodeId.slice(0, 8)}
      </span>
      */}

      {/* 分隔符 */}
      <div className="flex-shrink-0 w-px h-4 bg-gray-300"></div>

      {/* 主要显示文本 */}
      <div className="flex-1 min-w-0">
        <span
          className="text-sm font-medium truncate block"
          style={{ color: config.color }}
          title={displayText}
        >
          {displayText}
        </span>
      </div>

      {/* 额外徽章（如果有） */}
      {config.additionalBadge && (
        <Badge
          variant="outline"
          className="flex-shrink-0 font-mono text-xs text-center"
          style={{
            borderColor: config.additionalBadge.color,
            color: config.additionalBadge.color,
            minWidth: '32px'
          }}
        >
          {typeof config.additionalBadge.text === 'function'
            ? config.additionalBadge.text(node)
            : config.additionalBadge.text
          }
        </Badge>
      )}
    </div>
  );
};

export function GetNodeLabel(nodeId: string, nodeKind: string, node: AnyNode): JSX.Element {
  const config = NODE_CONFIGS[nodeKind];

  if (!config) {
    console.warn(`Unknown node kind: ${nodeKind}`);
    return (
      <div className="w-80 flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
        <span className="text-sm text-gray-500">未知节点：{nodeId}</span>
      </div>
    );
  }

  return <NodeLabelLayout config={config} nodeId={nodeId} node={node} />;
}

// 获取节点显示字符串
export function GetNodeDisplayString(nodeKind: string, node: AnyNode): string {
  const config = NODE_CONFIGS[nodeKind];

  if (!config) {
    console.warn(`Unknown node kind: ${nodeKind}`);
    return `未知节点`;
  }

  return config.getDisplayText(node);
}