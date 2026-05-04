// ProcessDllLoadShip.tsx
import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessDllLoadShip 表示进程加载 DLL 的关系 (ProcessNode -> DllImageNode)
 */
export interface ReverseProcessDllLoadShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程唯一标识符 */
  ProcessGuid: string;

  /** DLL 节点唯一标识符 */
  UniqueID: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

 /**
 * Process DLL Load 边配置
 */
const processDllLoadShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#434260",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#434260",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "LOAD_DLL",
  onClick: (data) => {
  },
};

export default processDllLoadShipConfig;