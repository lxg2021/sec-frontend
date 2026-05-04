// ProcessRenameFileShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessRenameFileShip 表示进程重命名文件节点的关系 (ProcessNode -> FileNode)
 */
export interface ReverseProcessRenameFileShip {
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

  /** 新文件名 */
  NewFileName: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

/**
 * Process Rename File Ship 配置
 */
const processRenameFileShipConfig: LinkConfig<any> = {
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
  getLabel: () => "RENAME_FILE",
  onClick: (data) => {
    alert(`Clicked edge: ${data}`);
  },
};

export default processRenameFileShipConfig;
