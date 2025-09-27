import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ProcessTerminateShip 表示进程终止的关系 (ProcessNode -> ProcessNode)
 */
export interface ProcessTerminateShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 是否是进程自退出 (0/1) */
  SelfExit: number;

  /** 被终止进程的唯一标识符 */
  ProcessGuid: string;

  /** 执行终止操作的进程唯一标识符 */
  OperatorProcessGuid: string;

  /** 关系的唯一 ID，用于去重 */
  UniqueID: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

/**
 * Process Create Process 边配置
 */
const processTerminateShipConfig: LinkConfig<any> = {
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
  getLabel: () => "TERMINATE_PROCESS",
  onClick: (data) => {
  },
};

export default processTerminateShipConfig;
