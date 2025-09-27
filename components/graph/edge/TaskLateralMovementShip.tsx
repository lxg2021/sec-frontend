// TaskLateralMovementShip.tsx
import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * TaskLateralMovementShip 表示任务节点向 Agent 节点横向移动的关系 (TaskNode -> AgentNode)
 */
export interface TaskLateralMovementShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 对象哈希值 */
  ObjHash: string;

  /** 目标 Agent ID */
  AgentID: string;

  /** 目标服务器名称 */
  ServerName: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}


/**
 * Task Lateral Movement 边配置
 */
const taskLateralMovementShipConfig: LinkConfig<any> = {
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
  getLabel: () => "TASK_LATERAL_MOVEMENT",
  onClick: (data) => {

  },
};

export default taskLateralMovementShipConfig;