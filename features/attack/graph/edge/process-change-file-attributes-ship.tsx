// ProcessChangeFileAttributesShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessChangeFileAttributesShip 表示进程修改文件属性节点的关系 (ProcessNode -> FileNode)
 */
export interface ReverseProcessChangeFileAttributesShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程唯一标识符 */
  ProcessGuid: string;

  /** 对象哈希值 */
  ObjHash: string;

  /** 文件属性标志 */
  Flag: number;

  /** 原始创建时间 (ISO 8601 字符串) */
  OrgCreateTime: string;

  /** 新创建时间 (ISO 8601 字符串) */
  NewCreateTime: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

/**
 * Process Change File Attributes Ship 配置
 */
const processChangeFileAttributesShipConfig: LinkConfig<any> = {
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
  getLabel: () => "CHANGE_FILE_ATTRIBUTES",
  onClick: (data) => {
    alert(`Clicked edge: ${data}`);
  },
};

export default processChangeFileAttributesShipConfig;