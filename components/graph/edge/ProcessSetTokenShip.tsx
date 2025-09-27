// ProcessSetTokenShip.tsx
import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";
import { Token } from "@/components/graph/edge/Token";

/**
 * ReverseProcessSetTokenShip 表示进程设置 Token 的关系 (ProcessNode -> ProcessNode)
 */
export interface ReverseProcessSetTokenShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程唯一标识符 */
  ProcessGuid: string;

  /** 父进程唯一标识符 */
  ParentProcessGuid: string;

  /** 操作进程的 Token 上下文 */
  OperatorTokenContext: Token;

  /** 目标进程的 Token 上下文 */
  TargetTokenContext: Token;

  /** Token 标志位 */
  TokenFlag: number;

  /** Token 标志描述 */
  TokenFlagDescription: string;

  /** 哈希值 */
  Hash: string;

  /** 攻击标签列表 */
  Tags: AttackTag[];
}

/**
 * Process Set Token 边配置
 */
const processSetTokenShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#AD1457",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#AD1457",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "SET_TOKEN",
  onClick: (data) => {
  },
};

export default processSetTokenShipConfig;