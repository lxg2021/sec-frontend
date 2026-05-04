// WmiLateralMovementShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * WmiLateralMovementShip 表示 WMI Class 节点横向移动到 Agent 节点的关系 (WmiClassNode -> AgentNode)
 */
export interface WmiLateralMovementShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** WMI Class 唯一 ID */
  UniqueID: string;

  /** Agent 唯一标识符 */
  AgentID: string;

  /** Agent 所在服务器名称 */
  ServerName: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

/**
 * Wmi Lateral Movement 边配置
 */
const wmiLateralMovementShipConfig: LinkConfig<any> = {
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
  getLabel: () => "WMI_LATERAL_MOVEMENT",
  onClick: (data) => {

  },
};

export default wmiLateralMovementShipConfig;