// TaskNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/features/attack/graph/interface";

/**
 * TaskImage
 * 表示任务相关的镜像信息
 */
export interface TaskImage {
  /** 镜像路径或名称 */
  Image: string;

  /** 镜像 MD5 */
  ImageMD5: string;

  /** 镜像参数 */
  Parameters: string;
}

/**
 * TaskTrigger
 * 表示任务调度的触发器信息
 */
export interface TaskTrigger {
  /** 结束边界 (ISO 8601 或自定义格式) */
  EndBoundry: string;

  /** 执行时间限制 */
  ExecutionTimeLimit: string;

  /** 开始边界 (ISO 8601 或自定义格式) */
  StartBoundary: string;

  /** 触发器 ID */
  TrigerId: string;

  /** 触发器类型 */
  TrigerType: string;
}

/**
 * TaskNode
 * 表示任务调度节点
 */
export interface TaskNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 记录时间 (ISO 8601 字符串) */
  Time: string;

  /** 域名 */
  Domain: string;

  /** 用户 */
  User: string;

  /** 服务器名 */
  ServerName: string;

  /** 任务名称 */
  TaskName: string;

  /** 任务路径 */
  TaskPath: string;

  /** 关联的镜像 MD5 列表 */
  ImageMD5s: string[];

  /** 任务镜像上下文 */
  TaskImageContext: TaskImage[];

  /** 任务触发器上下文 */
  TaskTriggerContext: TaskTrigger[];

  /** 对象哈希 */
  ObjHash: string;
}


/** task 节点配置 */
const taskNodeConfig: NodeConfig<TaskNode> = {
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
  getLabel: (data) => data.TaskName,
  getImage: () => "/icons/nodes/task-node.svg",
};

export default taskNodeConfig;
