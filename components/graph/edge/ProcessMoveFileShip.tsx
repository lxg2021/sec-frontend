// ProcessMoveFileShip.tsx
import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessMoveFileShip 表示进程移动文件节点的关系 (ProcessNode -> FileNode)
 */
export interface ReverseProcessMoveFileShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程唯一标识符 */
  ProcessGuid: string;

  /** 对象哈希值 */
  ObjHash: string;

  /** 原始文件名 */
  FileName: string;

  /** 新文件名或目标文件名 */
  NewFileName: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}


/**
 * Process Move File Ship 配置
 */
const processMoveFileShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {              
      color: "#FF9800",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#FF9800",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "MOVE_FILE",
  onClick: (data) => {
    alert(`Clicked edge: ${data}`);
  },
};

export default processMoveFileShipConfig;
