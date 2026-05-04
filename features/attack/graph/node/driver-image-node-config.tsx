// DriverImageNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/features/attack/graph/interface";

/**
 * DriverImageNode
 * 表示驱动镜像节点
 */
export interface DriverImageNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 记录时间 (ISO 8601 字符串) */
  Time: string;

  /** 驱动文件路径或名称 */
  Image: string;

  /** 驱动文件 MD5 */
  ImageMD5: string;

  /** 签名状态 */
  Signature: number;

  /** 签名供应商 */
  SignVendor: string;

  /** 唯一 ID */
  UniqueID: string;
}


/** DriverImageNode 节点配置 */
const driverImageNodeConfig: NodeConfig<DriverImageNode> = {
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
    const fileName = data.Image;
    const lastSlashIndex = Math.max(fileName.lastIndexOf("\\"), fileName.lastIndexOf("/"));
    return lastSlashIndex >= 0 ? fileName.slice(lastSlashIndex + 1) : fileName;
  },
  getImage: () => "/icons/nodes/driver-image-node.svg",
};

export default driverImageNodeConfig;
