// ProcessBitsAddFileShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";


/**
 * ReverseProcessBitsAddFileShip 表示进程向 BITS 任务添加文件的关系 (ProcessNode -> BitsJobNode)
 */
export interface ReverseProcessBitsAddFileShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程唯一标识符 */
  ProcessGuid: string;

  /** 对象哈希值 */
  ObjHash: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

/**
 * Process Bits Add File Ship 配置
 */
const processBitsAddFileShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {              
      color: "#F57C00",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#F57C00",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "BITS_ADD_FILE",
  onClick: (data) => {
    alert(`Clicked edge: ${data}`);
  },
};

export default processBitsAddFileShipConfig;