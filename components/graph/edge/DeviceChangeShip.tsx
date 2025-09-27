// DeviceChangeShip.tsx
import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * DeviceAgentShip 表示设备与 Agent 的关系 (DeviceNode -> AgentNode)
 */
export interface DeviceAgentShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** Agent ID */
  AgentID: string;

  /** 设备对象哈希 */
  ObjHash: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

/**
 * Device Agent Ship 边配置
 */
const deviceAgentShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#388E3C",
      width: 1,
      curve: "bezier",
      markerEnd: null,
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "DEVICE_CHANGE",
  onClick: (data) => {
  },
};

export default deviceAgentShipConfig;