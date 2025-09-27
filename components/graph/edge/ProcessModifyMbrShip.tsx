// ProcessModifyMbrShip.tsx
import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessModifyMbrShip 表示进程修改 MBR 节点的关系 (ProcessNode -> MbrNode)
 */
export interface ReverseProcessModifyMbrShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程唯一标识符 */
  ProcessGuid: string;

  /** MBR 节点唯一标识符 */
  UniqueID: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

 /**
 * Process Modify MBR Ship 边配置
 */
const processModifyMbrShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#B71C1C",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#B71C1C",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "MODIFY_MBR",
  onClick: (data) => {
  },
};

export default processModifyMbrShipConfig;
