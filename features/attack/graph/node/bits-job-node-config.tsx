// BitsJobNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/features/attack/graph/interface";

/**
 * JobFile
 * 表示作业相关的文件
 */
export interface JobFile {
  /** 本地文件名 */
  LocalName: string;

  /** 远程文件名 */
  RemoteName: string;
}

/**
 * BitsJobNode
 * 表示 BITS 作业节点
 */
export interface BitsJobNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 最后事件时间 (ISO 8601 字符串) */
  Time: string;

  /** 作业 ID */
  JobId: string;

  /** 作业类型 */
  JobType: number;

  /** 作业类型描述 */
  JobTypeDesc: string;

  /** 作业名称 */
  JobName: string;

  /** 作业关联文件列表 */
  JobFiles: JobFile[];

  /** 作业状态 */
  JobStatus: number;

  /** 作业状态描述 */
  JobStatusDesc: string;

  /** 对象哈希 */
  ObjHash: string;
}


/** bitsJob 节点配置 */
const bitsJobNodeConfig: NodeConfig<BitsJobNode> = {
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
  getLabel: (data) => data.JobName,
  getImage: () => "/icons/nodes/bits-job-node.svg",
};

export default bitsJobNodeConfig;
