// ProcessEnDecryptShip.tsx
import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessEnDecryptShip 表示进程与加解密节点之间的关系 (ProcessNode -> EnDecryptNode)
 */
export interface ReverseProcessEnDecryptShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程唯一标识符 */
  ProcessGuid: string;

  /** 加解密节点唯一标识符 */
  UniqueID: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

 /**
 * Process EnDecrypt Ship 边配置
 */
const processEnDecryptShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#E91E63",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#E91E63",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "ENCRYPT_DECRYPT",
  onClick: (data) => {
  },
};

export default processEnDecryptShipConfig;