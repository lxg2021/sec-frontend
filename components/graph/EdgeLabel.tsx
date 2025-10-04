// EdgeLabel.tsx
"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Minus, ArrowLeftRight } from "lucide-react";
import { GetNodeDisplayString } from "@/components/graph/NodeLable";

interface GraphNode<T> {
  id: string;
  type: string;
  data: T;
}

interface GraphLink<T> {
  id: string;
  source: string;
  target: string;
  type: string;
  data: T;
}

interface EdgeLabelProps {
  link: GraphLink<any>;
  direction: "forward" | "backward" | "bidirectional";
  sourcenode: GraphNode<any>;
  targetnode: GraphLink<{}>;
  className?: string;
  lineHeight?: number;
  lineWidth?: number;
  width?: number;
}

// 边类型配置
interface EdgeConfig {
  label: string;
  color: string;
  description?: string;
}

// 边类型配置映射
const EDGE_CONFIGS: Record<string, EdgeConfig> = {
  "CREATE_PROCESS": { label: "创建进程", color: "#4CAF50", description: "创建进程" },
  "CREATE_FILE": { label: "创建文件", color: "#FF9800", description: "创建文件" },
  "PROCESS_NET": { label: "网络连接", color: "#2196F3", description: "网络连接" },
  "PROCESS_DNS": { label: "域名解析", color: "#03A9F4", description: "域名解析" },
  "TERMINATE_PROCESS": { label: "结束进程", color: "#4CAF50", description: "结束进程" },
  "ACCESS_PROCESS": { label: "跨进程访问", color: "#4CAF50", description: "跨进程访问" },
  "NET_DNS": { label: "对等网络", color: "#2196F3", description: "对等网络" },
  "NET_LATERAL_MOVEMENT": { label: "横向移动", color: "#388E3C", description: "横向移动" },
  "ACCESS_VOLUME": { label: "访问卷", color: "#8BC34A", description: "卷访问" },
  "DELETE_FILE": { label: "删除文件", color: "#FF9800", description: "删除文件" },
  "READ_FILE": { label: "读取文件", color: "#FF9800", description: "读取文件" },
  "WRITE_FILE": { label: "写入文件", color: "#FF9800", description: "写入操作" },
  "SET_FILE_EA": { label: "文件扩展", color: "#FF9800", description: "写入文件扩展" },
  "RENAME_FILE": { label: "重命名文件", color: "#FF9800", description: "重命名操作" },
  "RENAME_PEER_FILE": { label: "重命名对等文件", color: "#FF9800", description: "重命名对等文件" },
  "MOVE_FILE": { label: "移动文件", color: "#FF9800", description: "移动文件" },
  "MOVE_PEER_FILE": { label: "移动对等文件", color: "#FF9800", description: "移动对等文件" },
  "CHANGE_FILE_ATTRIBUTES": { label: "修改文件属性", color: "#FF9800", description: "修改文件属性" },
  "CREATE_FILE_STREAM": { label: "创建文件流", color: "#FFB74D", description: "创建文件流" },
  "DELETE_FILE_STREAM": { label: "删除文件流", color: "#FFB74D", description: "删除文件流" },
  "STREAM_PEER_FILE": { label: "对等文件流", color: "#FFB74D", description: "对等文件流" },
  "NEW_FILE_PEER_STREAM": { label: "对等文件流", color: "#FFB74D", description: "对等文件流" },
  "CREATE_BITS": { label: "创建BITS任务", color: "#F57C00", description: "创建BITS任务" },
  "BITS_ADD_FILE": { label: "BITS添加文件", color: "#F57C00", description: "BITS添加文件" },
  "BITS_STATUS_CHANGE": { label: "BITS状态变更", color: "#F57C00", description: "BITS状态变更" },
  "CREATE_TASK": { label: "创建计划任务", color: "#9C27B0", description: "创建计划任务" },
  "FILE_MD5_PEER_SHIP": { label: "文件HASH对等", color: "#9C27B0", description: "文件HASH对等" },
  "TASK_LATERAL_MOVEMENT": { label: "任务横向移动", color: "#388E3C", description: "任务横向移动" },
  "DELETE_TASK": { label: "删除计划任务", color: "#9C27B0", description: "删除计划任务" },
  "CROSS_MEMORY_EXECUTE": { label: "跨进程内存", color: "#4CAF50", description: "跨进程内存" },
  "LOAD_DLL": { label: "加载DLL", color: "#434260", description: "加载DLL" },
  "DLL_MD5_PEER_SHIP": { label: "文件HASH对等", color: "#434260", description: "文件HASH对等" },
  "LOAD_DRIVER": { label: "加载驱动", color: "#434260", description: "加载驱动" },
  "DRIVER_MD5_PEER_SHIP": { label: "文件HASH对等", color: "#434260", description: "文件HASH对等" },
  "ENCRYPT_DECRYPT": { label: "加解密", color: "#E91E63", description: "加解密" },
  "CREATE_EVENT": { label: "创建事件", color: "#795548", description: "创建事件" },
  "OPEN_EVENT": { label: "打开事件", color: "#795548", description: "打开事件" },
  "CREATE_FILE_MAPPING": { label: "创建文件映射", color: "#6D4C41", description: "创建文件映射" },
  "CONNECT_FILE_MAPPING": { label: "连接文件映射", color: "#6D4C41", description: "连接文件映射" },
  "CREATE_MAILSLOT": { label: "创建MailSlot", color: "#FF5722", description: "MailSlot创建" },
  "CONNECT_MAILSLOT": { label: "连接MailSlot", color: "#FF5722", description: "MailSlot连接" },
  "MODIFY_MBR": { label: "修改MBR", color: "#B71C1C", description: "修改MBR" },
  "CREATE_PIPE": { label: "创建管道", color: "#607D8B", description: "创建管道" },
  "CONNECT_PIPE": { label: "连接管道", color: "#607D8B", description: "连接管道" },
  "POWERSHELL": { label: "PowerShell", color: "#3F51B5", description: "PowerShell执行" },
  "CREATE_REGKEY": { label: "创建注册表键", color: "#009688", description: "注册表创建" },
  "DELETE_REGKEY": { label: "删除注册表键", color: "#009688", description: "注册表删除" },
  "RENAME_REGKEY": { label: "重命名注册表键", color: "#009688", description: "重命名注册表键" },
  "RENAME_REGKEY_PEER": { label: "注册表键对等", color: "#009688", description: "注册表键对等" },
  "SET_REGVALUE": { label: "设置注册表值", color: "#8E24AA", description: "设置注册表值" },
  "DELETE_REGVALUE": { label: "删除注册表值", color: "#8E24AA", description: "删除注册表值" },
  "QUERY_REGVALUE": { label: "查询注册表值", color: "#8E24AA", description: "查询注册表值" },
  "STEALING_CREDENTIALS": { label: "窃取凭据", color: "#C2185B", description: "凭据窃取" },
  "ADJUST_PRIVILEGE": { label: "调整权限", color: "#4CAF50", description: "调整权限" },
  "IMPERSONATION_TOKEN": { label: "模拟令牌", color: "#AD1457", description: "模拟令牌" },
  "SET_TOKEN": { label: "设置令牌", color: "#AD1457", description: "设置令牌" },
  "HOOK_MESSAGE": { label: "Message钩子", color: "#CDDC39", description: "Message钩子" },
  "ACCESS_URL": { label: "访问URL", color: "#00BCD4", description: "访问URL" },
  "CREATE_WMI_CLASS": { label: "创建WMI类", color: "#26A69A", description: "创建WMI类" },
  "WMI_QUERY": { label: "WMI查询", color: "#BA68C8", description: "WMI查询" },
  "WMI_EXECUTE": { label: "WMI执行", color: "#CE93D8", description: "WMI执行" },
  "WMI_CONSUMER": { label: "WmiConsumer", color: "#4396F0", description: "WmiConsumer" },
  "WMI_FILTER": { label: "WmiFilter", color: "#6A1B9A", description: "WmiFilter" },
  "CONSUMER_FILTER_BINDING": { label: "WmiBinding", color: "#6A1B9A", description: "WmiBinding" },
  "WMI_LATERAL_MOVEMENT": { label: "横向移动", color: "#388E3C", description: "WMI横向移动" },
  "DEVICE_CHANGE": { label: "设备变更", color: "#388E3C", description: "设备变更" },
  "CREATE_SERVICE": { label: "创建服务", color: "#FF7043", description: "创建服务" },
  "START_SERVICE": { label: "启动服务", color: "#FF7043", description: "启动服务" },
  "DELETE_SERVICE": { label: "删除服务", color: "#FF7043", description: "删除服务" },
  "STOP_SERVICE": { label: "停止服务", color: "#FF7043", description: "停止服务" },
  "PAUSE_RESTORE_SERVICE": { label: "暂停/恢复服务", color: "#FF7043", description: "暂停/恢复服务" },
  "CHANGE_SERVICE": { label: "修改服务", color: "#FF7043", description: "修改服务" },
  "SERVICE_MD5_PEER_SHIP": { label: "文件HASH对等", color: "#434260", description: "文件HASH对等" },
  "CREATE_ACCOUNT": { label: "创建账户", color: "#039BE5", description: "账户创建" },
  "ENABLE_ACCOUNT": { label: "启用账户", color: "#039BE5", description: "启用账户" },
  "RESET_ACCOUNT_PASSWORD": { label: "重置密码", color: "#039BE5", description: "重置密码" },
  "DISABLE_ACCOUNT": { label: "禁用账户", color: "#039BE5", description: "账户禁用" },
  "DELETE_ACCOUNT": { label: "删除账户", color: "#039BE5", description: "删除账户" },
  "MODIFY_ACCOUNT": { label: "修改账户", color: "#039BE5", description: "修改账户" },
  "ADD_ACCOUNT_GROUP": { label: "向组内添加账户", color: "#0288D1", description: "向组内添加账户" },
  "DELETE_ACCOUNT_GROUP": { label: "从组内移除账户", color: "#0288D1", description: "从组内移除账户" },
  "CREATE_GROUP": { label: "创建账户组", color: "#0288D1", description: "创建账户组" },
  "DELETE_GROUP": { label: "删除账户组", color: "#0288D1", description: "删除账户组" },

  // 默认边
  "default": { label: "关联", color: "#6B7280", description: "关联关系" }
};

// 获取边配置
const getEdgeConfig = (edgeType: string): EdgeConfig => {
  return EDGE_CONFIGS[edgeType] || EDGE_CONFIGS.default;
};

// 文本截断工具函数
const truncateText = (text: string, maxLength: number = 24): string => {
  if (!text) return "--";
  if (text.length <= maxLength) return text;

  const ellipsis = '...';
  const charsToShow = maxLength - ellipsis.length; // 24 - 3 = 21
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);

  return `${text.slice(0, frontChars)}${ellipsis}${text.slice(-backChars)}`;
};

const EdgeLabel: React.FC<EdgeLabelProps> = ({
  link,
  direction,
  sourcenode,
  targetnode,
  className = "",
  lineHeight = 3.5,
  lineWidth = 20,
  width = 720,
}) => {

  const sourceLabel = GetNodeDisplayString(sourcenode.type, sourcenode.data);
  const targetLabel = GetNodeDisplayString(targetnode.type, targetnode.data);
  const config = getEdgeConfig(link.type);

  const renderArrow = () => {
    const arrowProps = { size: 16, strokeWidth: 4, color: config.color };
    switch (direction) {
      case "forward":
        return <ArrowRight {...arrowProps} />;
      case "backward":
        return <ArrowLeft {...arrowProps} />;
      case "bidirectional":
        return <ArrowLeftRight {...arrowProps} />;
      default:
        return <ArrowRight {...arrowProps} />;
    }
  };

  // 连接线样式
  const lineStyle = {
    width: `${lineWidth}px`,
    height: `${lineHeight}px`,
    backgroundColor: config.color,
  };

  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}
      style={{ width: `${width}px` }}
      title={`${sourceLabel} ${direction === "forward" ? "→" : direction === "backward" ? "←" : "↔"} ${targetLabel} (${config.label})`}
    >
      {/* 左节点，占剩余空间 */}
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium truncate block text-gray-700">
          {sourceLabel}
        </span>
      </div>

      {/* 中间连接线 + Badge */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <div style={lineStyle} />
        <div style={lineStyle} />
        
        <Badge
          className="h-5 text-white border-0 text-xs font-medium flex items-center justify-center"
          style={{ width: '120px', backgroundColor: config.color }}
          title={config.description}
        >
          {config.label}
        </Badge>

        <div style={lineStyle} />
        <div style={lineStyle} />
        {renderArrow()}
      </div>

      {/* 右节点，占剩余空间 */}
      <div className="flex-1 min-w-0 text-right">
        <span className="text-xs font-medium truncate block text-gray-700">
          {truncateText(targetLabel)}
        </span>
      </div>
    </div>
  );
};

export default EdgeLabel;