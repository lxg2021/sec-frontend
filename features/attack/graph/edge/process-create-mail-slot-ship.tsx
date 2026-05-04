// ProcessCreateMailSlotShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessCreateMailSlotShip 表示进程创建 MailSlot 节点的关系 (ProcessNode -> MailSlotNode)
 */
export interface ReverseProcessCreateMailSlotShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程唯一标识符 */
  ProcessGuid: string;

  /** MailSlot 节点哈希值 */
  ObjHash: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

 /**
 * Process Create MailSlot Ship 边配置
 */
const processCreateMailSlotShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#FF5722",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#FF5722",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "CREATE_MAILSLOT",
  onClick: (data) => {
  },
};

export default processCreateMailSlotShipConfig;
