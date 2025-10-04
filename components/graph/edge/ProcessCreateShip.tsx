import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";


/**
 * ProcessCreateShip 表示 ProcessNode -> ProcessNode 的创建关系
 */
export interface ProcessCreateShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 */
  Time: string;

  /** 子进程的唯一标识符 */
  ProcessGuid: string;

  /** 父进程的唯一标识符 */
  ParentProcessGuid: string;

  /** 关系的唯一 ID，用于去重 */
  UniqueID: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

/**
 * Process Create Process 边配置
 */
const processCreateShipConfig: LinkConfig<ProcessCreateShip> = {
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
  getLabel: () => "CREATE_PROCESS",
};

export default processCreateShipConfig;
