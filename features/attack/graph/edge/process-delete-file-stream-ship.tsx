// ProcessDeleteFileStreamShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessDeleteFileStreamShip 表示进程删除文件流节点的关系 (ProcessNode -> FileStreamNode)
 */
export interface ReverseProcessDeleteFileStreamShip {
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
 * Process Delete File Stream Ship 配置
 */
const processDeleteFileStreamShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#FFB74D",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#FFB74D",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "DELETE_FILE_STREAM",
  onClick: (data) => {
    alert(`Clicked edge: ${data}`);
  },
};

export default processDeleteFileStreamShipConfig;