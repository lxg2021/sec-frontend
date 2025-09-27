// ProcessWmiConsumerShip.tsx
import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessWmiConsumerShip 表示进程创建 WMI Consumer 节点的关系 (ProcessNode -> WmiConsumerNode)
 */
export interface ReverseProcessWmiConsumerShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程唯一标识符 */
  ProcessGuid: string;

  /** WMI Consumer 节点唯一 ID */
  UniqueID: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}


/**
 * Process Wmi Consumer Ship 边配置
 */
const processWmiConsumerShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#4396F0",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#4396F0",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "WMI_CONSUMER",
  onClick: (data) => {
  },
};

export default processWmiConsumerShipConfig;