// ProcessDeleteRegValueShip.tsx
import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessDeleteRegValueShip 表示进程删除注册表值节点的关系 (ProcessNode -> RegValueNode)
 */
export interface ReverseProcessDeleteRegValueShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程唯一标识符 */
  ProcessGuid: string;

  /** 注册表值节点哈希值 */
  ObjHash: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}


/**
 * Process Delete RegValue Ship 配置
 */
const processDeleteRegValueShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {              
      color: "#8E24AA",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#8E24AA",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "DELETE_REGVALUE",
  onClick: (data) => {
    alert(`Clicked edge: ${data}`);
  },
};

export default processDeleteRegValueShipConfig;