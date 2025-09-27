// FileStreamNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * FileStreamNode
 * 表示一个文件流节点
 */
export interface FileStreamNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 记录时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程 GUID */
  ProcessGuid: string;

  /** 文件名称 */
  FileName: string;

  /** 文件流名称 */
  FileStreamName: string;

  /** 文件 MD5 */
  FileMD5: string;

  /** 文件分类代码 */
  FileClass: number;

  /** 文件分类描述 */
  FileClassDescription: string;

  /** 文件格式代码 */
  FileFormat: number;

  /** 文件格式描述 */
  FileFormatDescription: string;

  /** 驱动类型 */
  DriverType: number;

  /** 唯一标识 ID */
  UniqueID: string;

  /** 对象哈希 */
  ObjHash: string;
}


interface NodeData {
  label: string;
}

/** fileStream 节点配置 */
const fileStreamNodeConfig: NodeConfig<NodeData> = {
  getStyle: () => ({
    color: "#F1FBFC",
    width: 32,
    height: 32,
    textColor: "#000",
    borderColor: "transparent",
    borderWidth: 0,
    fontSize: 8,
    opacity: 1,
    shape: "square",
    hoverAnimation: true,
  }),
  getLabel: (data) => data.label,
  getImage: () => "/icons/nodes/file-stream-node.svg",
};

export default fileStreamNodeConfig;
