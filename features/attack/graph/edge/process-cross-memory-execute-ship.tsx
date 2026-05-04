// ProcessCrossMemoryExecuteShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessCrossMemoryExecuteShip 表示进程跨内存执行的关系 (ProcessNode -> ProcessNode)
 */
export interface ReverseProcessCrossMemoryExecuteShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 内存地址 */
  Address: string;

  /** 页保护属性 */
  PageProtect: number;

  /** 目标进程唯一标识符 */
  ProcessGuid: string;

  /** 操作进程唯一标识符 */
  OperatorProcessGuid: string;

  /** 对象哈希值 (ship hash = hash(address + PageProtect)) */
  ObjHash: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

/**
 * Process Cross Memory Execute Ship 配置
 */
const processCrossMemoryExecuteShipConfig: LinkConfig<any> = {
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
  getLabel: () => "CROSS_MEMORY_EXECUTE",
  onClick: (data) => {
    alert(`Clicked edge: ${data}`);
  },
};

export default processCrossMemoryExecuteShipConfig;