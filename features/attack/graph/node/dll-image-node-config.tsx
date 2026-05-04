// DllImageNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/features/attack/graph/interface";

/**
 * DllImageNode
 * 表示 DLL 镜像节点
 */
export interface DllImageNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 记录时间 (ISO 8601 字符串) */
  Time: string;

  /** 镜像路径或名称 */
  Image: string;

  /** 镜像 MD5 */
  ImageMD5: string;

  /** 签名状态 */
  Signature: number;

  /** 签名厂商 */
  SignVendor: string;

  /** 原始文件名 */
  OrgFileName: string;

  /** 唯一 ID */
  UniqueID: string;
}

/** DllImageNode 节点配置 */
const dllImageNodeConfig: NodeConfig<DllImageNode> = {
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
  getImage: () => "/icons/nodes/dll-node.svg",
};

export default dllImageNodeConfig;
