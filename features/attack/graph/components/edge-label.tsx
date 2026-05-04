// EdgeLabel.tsx
"use client";

import React from "react";
import { Badge } from "@/shared/ui/badge";
import { ArrowRight, ArrowLeft, Minus, ArrowLeftRight } from "lucide-react";
import { GetNodeDisplayString } from "@/features/attack/graph/components/node-label";
import { useTranslations } from "next-intl";

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
  color: string;
}

// 边类型配置映射
const EDGE_CONFIGS: Record<string, EdgeConfig> = {
  "CREATE_PROCESS": { color: "#4CAF50" },
  "CREATE_FILE": { color: "#FF9800" },
  "PROCESS_NET": { color: "#2196F3" },
  "PROCESS_DNS": { color: "#03A9F4" },
  "TERMINATE_PROCESS": { color: "#4CAF50" },
  "ACCESS_PROCESS": { color: "#4CAF50" },
  "NET_DNS": { color: "#2196F3" },
  "NET_LATERAL_MOVEMENT": { color: "#388E3C" },
  "ACCESS_VOLUME": { color: "#8BC34A" },
  "DELETE_FILE": { color: "#FF9800" },
  "READ_FILE": { color: "#FF9800" },
  "WRITE_FILE": { color: "#FF9800" },
  "SET_FILE_EA": { color: "#FF9800" },
  "RENAME_FILE": { color: "#FF9800" },
  "RENAME_PEER_FILE": { color: "#FF9800" },
  "MOVE_FILE": { color: "#FF9800" },
  "MOVE_PEER_FILE": { color: "#FF9800" },
  "CHANGE_FILE_ATTRIBUTES": { color: "#FF9800" },
  "CREATE_FILE_STREAM": { color: "#FFB74D" },
  "DELETE_FILE_STREAM": { color: "#FFB74D" },
  "STREAM_PEER_FILE": { color: "#FFB74D" },
  "NEW_FILE_PEER_STREAM": { color: "#FFB74D" },
  "CREATE_BITS": { color: "#F57C00" },
  "BITS_ADD_FILE": { color: "#F57C00" },
  "BITS_STATUS_CHANGE": { color: "#F57C00" },
  "CREATE_TASK": { color: "#9C27B0" },
  "FILE_MD5_PEER_SHIP": { color: "#9C27B0" },
  "TASK_LATERAL_MOVEMENT": { color: "#388E3C" },
  "DELETE_TASK": { color: "#9C27B0" },
  "CROSS_MEMORY_EXECUTE": { color: "#4CAF50" },
  "LOAD_DLL": { color: "#434260" },
  "DLL_MD5_PEER_SHIP": { color: "#434260" },
  "LOAD_DRIVER": { color: "#434260" },
  "DRIVER_MD5_PEER_SHIP": { color: "#434260" },
  "ENCRYPT_DECRYPT": { color: "#E91E63" },
  "CREATE_EVENT": { color: "#795548" },
  "OPEN_EVENT": { color: "#795548" },
  "CREATE_FILE_MAPPING": { color: "#6D4C41" },
  "CONNECT_FILE_MAPPING": { color: "#6D4C41" },
  "CREATE_MAILSLOT": { color: "#FF5722" },
  "CONNECT_MAILSLOT": { color: "#FF5722" },
  "MODIFY_MBR": { color: "#B71C1C" },
  "CREATE_PIPE": { color: "#607D8B" },
  "CONNECT_PIPE": { color: "#607D8B" },
  "POWERSHELL": { color: "#3F51B5" },
  "CREATE_REGKEY": { color: "#009688" },
  "DELETE_REGKEY": { color: "#009688" },
  "RENAME_REGKEY": { color: "#009688" },
  "RENAME_REGKEY_PEER": { color: "#009688" },
  "SET_REGVALUE": { color: "#8E24AA" },
  "DELETE_REGVALUE": { color: "#8E24AA" },
  "QUERY_REGVALUE": { color: "#8E24AA" },
  "STEALING_CREDENTIALS": { color: "#C2185B" },
  "ADJUST_PRIVILEGE": { color: "#4CAF50" },
  "IMPERSONATION_TOKEN": { color: "#AD1457" },
  "SET_TOKEN": { color: "#AD1457" },
  "HOOK_MESSAGE": { color: "#CDDC39" },
  "ACCESS_URL": { color: "#00BCD4" },
  "CREATE_WMI_CLASS": { color: "#26A69A" },
  "WMI_QUERY": { color: "#BA68C8" },
  "WMI_EXECUTE": { color: "#CE93D8" },
  "WMI_CONSUMER": { color: "#4396F0" },
  "WMI_FILTER": { color: "#6A1B9A" },
  "CONSUMER_FILTER_BINDING": { color: "#6A1B9A" },
  "WMI_LATERAL_MOVEMENT": { color: "#388E3C" },
  "DEVICE_CHANGE": { color: "#388E3C" },
  "CREATE_SERVICE": { color: "#FF7043" },
  "START_SERVICE": { color: "#FF7043" },
  "DELETE_SERVICE": { color: "#FF7043" },
  "STOP_SERVICE": { color: "#FF7043" },
  "PAUSE_RESTORE_SERVICE": { color: "#FF7043" },
  "CHANGE_SERVICE": { color: "#FF7043" },
  "SERVICE_MD5_PEER_SHIP": { color: "#434260" },
  "CREATE_ACCOUNT": { color: "#039BE5" },
  "ENABLE_ACCOUNT": { color: "#039BE5" },
  "RESET_ACCOUNT_PASSWORD": { color: "#039BE5" },
  "DISABLE_ACCOUNT": { color: "#039BE5" },
  "DELETE_ACCOUNT": { color: "#039BE5" },
  "MODIFY_ACCOUNT": { color: "#039BE5" },
  "ADD_ACCOUNT_GROUP": { color: "#0288D1" },
  "DELETE_ACCOUNT_GROUP": { color: "#0288D1" },
  "CREATE_GROUP": { color: "#0288D1" },
  "DELETE_GROUP": { color: "#0288D1" },

  // 默认边
  "default": { color: "#6B7280" }
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
  const edgeKey = EDGE_CONFIGS[link.type] ? link.type : "default";
  const edgeLabel = t(`${edgeKey}.label`);
  const edgeDescription = t(`${edgeKey}.description`);

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
      title={`${sourceLabel} ${direction === "forward" ? "→" : direction === "backward" ? "←" : "↔"} ${targetLabel} (${edgeLabel})`}
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
          title={edgeDescription}
        >
          {edgeLabel}
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