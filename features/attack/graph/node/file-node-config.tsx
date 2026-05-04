// FileNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/features/attack/graph/interface";

/**
 * FileNode
 * 表示一个文件节点
 */
export interface FileNode {
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

  /** 签名状态 */
  Signature: number;

  /** 签名厂商 */
  SignVendor: string;

  /** 驱动类型 */
  DriverType: number;

  /** 检测主类型 */
  DetectionMajorType: number;

  /** 检测次类型 */
  DetectionMinorType: number;

  /** 检测内容 */
  DetectionContent: string;

  /** 文件描述 */
  Description: string;

  /** 文件类型 */
  FileType: number;

  /** 唯一标识 ID */
  UniqueID: string;

  /** 对象哈希 */
  ObjHash: string;
}

/** file 节点配置 */
const fileNodeConfig: NodeConfig<FileNode> = {
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

  getLabel: (data) => {
    const fileName = data.FileName;
    const lastSlashIndex = Math.max(fileName.lastIndexOf("\\"), fileName.lastIndexOf("/"));
    return lastSlashIndex >= 0 ? fileName.slice(lastSlashIndex + 1) : fileName;
  },
  getImage: () => "/icons/nodes/file-node.svg",
};

export default fileNodeConfig;
