// ProcessPowershellShip.tsx
import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * ReverseProcessPowershellShip 表示进程执行 PowerShell 节点的关系 (ProcessNode -> PowershellNode)
 */
export interface ReverseProcessPowershellShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程唯一标识符 */
  ProcessGuid: string;

  /** PowerShell 节点唯一标识符 */
  UniqueID: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

/**
 * Process PowerShell Ship 边配置
 */
const processPowerShellShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#3F51B5",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#3F51B5",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "POWERSHELL",
  onClick: (data) => {
  },
};

export default processPowerShellShipConfig;