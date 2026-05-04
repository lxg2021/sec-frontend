// deviceChangeNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/features/attack/graph/interface";

/**
 * DeviceChangeNode
 * 表示设备变更节点
 */
export interface DeviceChangeNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 记录时间 (ISO 8601 字符串) */
  Time: string;

  /** 设备 GUID */
  DeviceGUID: string;

  /** HID */
  HID: string;

  /** 设备类型 */
  DeviceType: number;

  /** 设备描述 */
  DeviceDescription: string;

  /** 设备标记 */
  DeviceFlag: number;

  /** 设备标记描述 */
  DeviceFlagDescription: string;

  /** 对象哈希 */
  ObjHash: string;
}


/** deviceChangeNode 节点配置 */
const deviceChangeNodeConfig: NodeConfig<DeviceChangeNode> = {
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
  getLabel: (data) => "DeviceChange",
  getImage: () => "/icons/nodes/device-change-node.svg",
};

export default deviceChangeNodeConfig;
