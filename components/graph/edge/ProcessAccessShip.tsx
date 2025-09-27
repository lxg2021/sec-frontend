import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ProcessAccessShip 表示进程访问关系 (ProcessNode -> ProcessNode)
 */
export interface ProcessAccessShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 授权访问标志 */
  GrantedAccess: number;

  /** 被访问进程的唯一标识符 */
  ProcessGuid: string;

  /** 执行访问操作的进程唯一标识符 */
  OperatorProcessGuid: string;

  /** 调用栈信息 */
  CallTrace: string;

  /** 关系的唯一 ID，用于去重 */
  UniqueID: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

 /**
 * Process Access Process 边配置
 */
const processAccessShipConfig: LinkConfig<any> = {
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
  getLabel: () => "ACCESS_PROCESS",
  onClick: (data) => {
  },
};

export default processAccessShipConfig;
