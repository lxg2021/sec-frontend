// ProcessAdjuestPrivilegeShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessAdjuestPrivilegeShip 表示进程调整权限的关系 (ProcessNode -> ProcessNode)
 */
export interface ReverseProcessAdjuestPrivilegeShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 调整权限的进程唯一标识符 */
  ProcessGuid: string;

  /** 目标进程唯一标识符 */
  TargetProcessGuid: string;

  /** 权限名称 */
  Privileges: string;

  /** Token 标志 */
  TokenFlag: number;

  /** Token 标志描述 */
  TokenFlagDescription: string;

  /** 是否作用于自身 */
  Self: number;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}


/**
 * Process Adjust Privilege Ship 边配置
 */
const processAdjustPrivilegeShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#4CAF50",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#4CAF50",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "ADJUST_PRIVILEGE",
  onClick: (data) => {
  },
};

export default processAdjustPrivilegeShipConfig;
