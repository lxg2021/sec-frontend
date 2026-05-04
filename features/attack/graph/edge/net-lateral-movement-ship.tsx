import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";


/**
 * NetLateralMovementShip 表示网络节点到 Agent 节点的横向移动关系 (NetNode -> AgentNode)
 */
export interface NetLateralMovementShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 对象哈希 */
  ObjHash: string;

  /** 目标 Agent ID */
  AgentID: string;

  /** 源 IP */
  SourceIP: string;

  /** 目标 IP */
  DestinationIP: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

/**
 * Net Dns 边配置
 */
const netLateralMovementShipConfig: LinkConfig<any> = {
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
  getLabel: () => "NET_LATERAL_MOVEMENT",
  onClick: (data) => {

  },
};

export default netLateralMovementShipConfig;