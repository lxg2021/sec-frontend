import type { ProcessNode } from "@/features/attack/graph/node/process-node-config";
import type { FileNode } from "@/features/attack/graph/node/file-node-config";
import type { NetNode } from "@/features/attack/graph/node/net-node-config";
import type { DnsNode } from "@/features/attack/graph/node/dns-node-config";
import type { VolumeNode } from "@/features/attack/graph/node/volume-node-config";
import type { FileStreamNode } from "@/features/attack/graph/node/file-stream-node-config";
import type { BitsJobNode, JobFile } from "@/features/attack/graph/node/bits-job-node-config";
import type { TaskNode, TaskImage, TaskTrigger } from "@/features/attack/graph/node/task-node-config";
import type { DllImageNode } from "@/features/attack/graph/node/dll-image-node-config";
import type { DriverImageNode } from "@/features/attack/graph/node/driver-image-node-config";
import type { EnDecryptNode } from "@/features/attack/graph/node/en-decrypt-node-config";
import type { EventNode } from "@/features/attack/graph/node/event-node-config";
import type { FileMappingNode } from "@/features/attack/graph/node/file-mapping-node-config";
import type { MailSlotNode } from "@/features/attack/graph/node/mail-slot-node-config";
import type { MbrNode } from "@/features/attack/graph/node/mbr-node-config";
import type { PipeNode } from "@/features/attack/graph/node/pipe-node-config";
import type { PowershellNode } from "@/features/attack/graph/node/powershell-node-config";
import type { RegKeyNode } from "@/features/attack/graph/node/reg-key-node-config";
import type { RegValueNode } from "@/features/attack/graph/node/reg-value-node-config";
import type { CredentialsNode } from "@/features/attack/graph/node/credentials-node-config";
import type { ImpersonationTokenNode, Token } from "@/features/attack/graph/node/impersonation-token-node-config";
import type { MessageNode } from "@/features/attack/graph/node/message-node-config";
import type { UrlNode } from "@/features/attack/graph/node/url-node-config";
import type { WmiClassNode, ClassAttributeItem } from "@/features/attack/graph/node/wmi-class-node-config";
import type { WmiQueryNode } from "@/features/attack/graph/node/wmi-query-node-config";
import type { WmiExecuteNode, ParameterItem } from "@/features/attack/graph/node/wmi-execute-node-config";
import type { WmiConsumerNode } from "@/features/attack/graph/node/wmi-consumer-node-config";
import type { WmiFilterNode } from "@/features/attack/graph/node/wmi-filter-node-config";
import type { AgentNode } from "@/features/attack/graph/node/agent-node-config";
import type { DeviceChangeNode } from "@/features/attack/graph/node/device-change-node-config";
import type { ServiceNode } from "@/features/attack/graph/node/service-node-config";
import type { AccountGroupNode } from "@/features/attack/graph/node/account-group-node-config";
import type { AccountNode } from "@/features/attack/graph/node/account-node-config";
import type { AttackNode } from "@/features/attack/graph/node/attack-node-config";
import { Badge } from "@/shared/ui/badge";
import { useTranslations } from "next-intl";

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
  labelKey: string;
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
    labelKey: "ProcessNode",
    icon: "/icons/nodes/process-node.svg",
    color: "#4CAF50",
    getDisplayText: (node: ProcessNode) => node.ProcessName || '--'
  },
  FileNode: {
    labelKey: "FileNode",
    icon: "/icons/nodes/file-node.svg",
    color: "#FF9800",
    getDisplayText: (node: FileNode) => getFileName(node.FileName)
  },
  NetNode: {
    labelKey: "NetNode",
    icon: "/icons/nodes/net-node.svg",
    color: "#2196F3",
    getDisplayText: (node: NetNode) => `${node.SourceIP}-${node.DestinationIP}`,
    additionalBadge: {
      text: (node: NetNode) => node.Direction || '--',
      color: "#2196F3"
    }
  },
  DnsNode: {
    labelKey: "DnsNode",
    icon: "/icons/nodes/dns-node.svg",
    color: "#03A9F4",
    getDisplayText: (node: DnsNode) => node.Domain || '--'
  },
  VolumeNode: {
    labelKey: "VolumeNode",
    icon: "/icons/nodes/volume-node.svg",
    color: "#8BC34A",
    getDisplayText: (node: VolumeNode) => node.FileName || '--'
  },
  FileStreamNode: {
    labelKey: "FileStreamNode",
    icon: "/icons/nodes/file-stream-node.svg",
    color: "#FFB74D",
    getDisplayText: (node: FileStreamNode) => getFileName(node.FileName)
  },
  BitsJobNode: {
    labelKey: "BitsJobNode",
    icon: "/icons/nodes/bits-job-node.svg",
    color: "#F57C00",
    getDisplayText: (node: BitsJobNode) => node.JobName || '--'
  },
  TaskNode: {
    labelKey: "TaskNode",
    icon: "/icons/nodes/task-node.svg",
    color: "#9C27B0",
    getDisplayText: (node: TaskNode) => node.TaskName || '--'
  },
  DllImageNode: {
    labelKey: "DllImageNode",
    icon: "/icons/nodes/dll-node.svg",
    color: "#434260",
    getDisplayText: (node: DllImageNode) => node.Image ? getFileName(node.Image) : "Unknown DLL"
  },
  DriverImageNode: {
    labelKey: "DriverImageNode",
    icon: "/icons/nodes/driver-image-node.svg",
    color: "#434260",
    getDisplayText: (node: DriverImageNode) => node.Image ? getFileName(node.Image) : "Unknown Driver"
  },
  EnDecryptNode: {
    labelKey: "EnDecryptNode",
    icon: "/icons/nodes/endecrypt-node.svg",
    color: "#E91E63",
    getDisplayText: (node: EnDecryptNode) => node.CryptFlagDescription || '--'
  },
  EventNode: {
    labelKey: "EventNode",
    icon: "/icons/nodes/event-node.svg",
    color: "#795548",
    getDisplayText: (node: EventNode) => node.EventName || '--'
  },
  FileMappingNode: {
    labelKey: "FileMappingNode",
    icon: "/icons/nodes/file-mapping-node.svg",
    color: "#6D4C41",
    getDisplayText: (node: FileMappingNode) => node.FileMappingName || '--'
  },
  MailSlotNode: {
    labelKey: "MailSlotNode",
    icon: "/icons/nodes/mail-slot-node.svg",
    color: "#FF5722",
    getDisplayText: (node: MailSlotNode) => node.MailSlotName || '--'
  },
  MbrNode: {
    labelKey: "MbrNode",
    icon: "/icons/nodes/mbr-node.svg",
    color: "#B71C1C",
    getDisplayText: (node: MbrNode) => node.PhysicalName || '--'
  },
  PipeNode: {
    labelKey: "PipeNode",
    icon: "/icons/nodes/pipe-node.svg",
    color: "#607D8B",
    getDisplayText: (node: PipeNode) => node.PipeName || '--'
  },
  PowershellNode: {
    labelKey: "PowershellNode",
    icon: "/icons/nodes/powershell-node.svg",
    color: "#5391FE",
    getDisplayText: (node: PowershellNode) => node.FileName ? getFileName(node.FileName) : "Unknown Script"
  },
  RegKeyNode: {
    labelKey: "RegKeyNode",
    icon: "/icons/nodes/reg-key-node.svg",
    color: "#53B7B7",
    getDisplayText: (node: RegKeyNode) => node.ObjectName || '--'
  },
  RegValueNode: {
    labelKey: "RegValueNode",
    icon: "/icons/nodes/reg-value-node.svg",
    color: "#8E24AA",
    getDisplayText: (node: RegValueNode) => node.ObjectName || '--'
  },
  CredentialsNode: {
    labelKey: "CredentialsNode",
    icon: "/icons/nodes/credentials-node.svg",
    color: "#C2185B",
    getDisplayText: (node: CredentialsNode) => node.CredDesc || '--'
  },
  ImpersonationTokenNode: {
    labelKey: "ImpersonationTokenNode",
    icon: "/icons/nodes/impersonation-token-node.svg",
    color: "#AD1457",
    getDisplayText: (node: ImpersonationTokenNode) => node.TokenFlagDescription || '--'
  },
  MessageNode: {
    labelKey: "MessageNode",
    icon: "/icons/nodes/message-node.svg",
    color: "#CDDC39",
    getDisplayText: (node: MessageNode) => node.HookTypeDescription || '--'
  },
  UrlNode: {
    labelKey: "UrlNode",
    icon: "/icons/nodes/url-node.svg",
    color: "#00BCD4",
    getDisplayText: (node: UrlNode) => node.URL || '--'
  },
  WmiClassNode: {
    labelKey: "WmiClassNode",
    icon: "/icons/nodes/wmi-class-node.svg",
    color: "#26A69A",
    getDisplayText: (node: WmiClassNode) => node.ClassName || '--'
  },
  WmiQueryNode: {
    labelKey: "WmiQueryNode",
    icon: "/icons/nodes/wmi-query-node.svg",
    color: "#BA68C8",
    getDisplayText: (node: WmiQueryNode) => node.Query || '--'
  },
  WmiExecuteNode: {
    labelKey: "WmiExecuteNode",
    icon: "/icons/nodes/wmi-execute-node.svg",
    color: "#BA68C8",
    getDisplayText: (node: WmiExecuteNode) => node.ClassName || '--'
  },
  WmiConsumerNode: {
    labelKey: "WmiConsumerNode",
    icon: "/icons/nodes/wmi-consumer-node.svg",
    color: "#4396F0",
    getDisplayText: (node: WmiConsumerNode) => node.EventConsumerName || '--'
  },
  WmiFilterNode: {
    labelKey: "WmiFilterNode",
    icon: "/icons/nodes/wmi-filter-node.svg",
    color: "#6A1B9A",
    getDisplayText: (node: WmiFilterNode) => node.EventFilterName || '--'
  },
  AgentNode: {
    labelKey: "AgentNode",
    icon: "/icons/nodes/agent-node.svg",
    color: "#388E3C",
    getDisplayText: (node: AgentNode) => node.ComputerName || '--'
  },
  DeviceChangeNode: {
    labelKey: "DeviceChangeNode",
    icon: "/icons/nodes/device-change-node.svg",
    color: "#FFA000",
    getDisplayText: (node: DeviceChangeNode) => node.DeviceDescription || '--'
  },
  ServiceNode: {
    labelKey: "ServiceNode",
    icon: "/icons/nodes/service-node.svg",
    color: "#FF7043",
    getDisplayText: (node: ServiceNode) => node.ServiceName || '--'
  },
  AccountGroupNode: {
    labelKey: "AccountGroupNode",
    icon: "/icons/nodes/account-group-node.svg",
    color: "#0288D1",
    getDisplayText: (node: AccountGroupNode) => node.GroupName || '--'
  },
  AccountNode: {
    labelKey: "AccountNode",
    icon: "/icons/nodes/account-node.svg",
    color: "#039BE5",
    getDisplayText: (node: AccountNode) => node.UserName || '--'
  },
  AttackNode: {
    labelKey: "AttackNode",
    icon: "/icons/nodes/attack-node.svg",
    color: "#D32F2F",
    getDisplayText: (node: AttackNode) => node.ID || '--'
  }
};

// 提取文件名工具函数
const getFileName = (fileName: string): string => {
  if (!fileName) return "Unknown File";
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
  const t = useTranslations("pages.attack.graph.nodes");
  const label = t(config.labelKey);
  const displayText = config.getDisplayText(node);
  const lightBgColor = getLightBackgroundColor(config.color);

  return (
    <div className="w-80 flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* 节点图标 */}
      <div
        className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full"
        style={{ backgroundColor: lightBgColor }}
      >
        <img src={config.icon} alt={label} className="w-4 h-4" />
      </div>

      {/* 节点类型徽章 */}
      <Badge
        className="flex-shrink-0 text-white border-0 text-xs font-medium text-center"
        style={{
          backgroundColor: config.color,
          minWidth: `${Math.max(label.length * 12, 48)}px`
        }}
      >
        {label}
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
        <span className="text-sm text-gray-500">Unknown node: {nodeId}</span>
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
    return `Unknown node`;
  }

  return config.getDisplayText(node);
}
