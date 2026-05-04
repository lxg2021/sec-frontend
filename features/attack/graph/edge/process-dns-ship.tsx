import type { ShipElementID } from "@/features/attack/graph/edge/ship-element-id";
import type { AttackTag } from "@/features/attack/graph/edge/attack-tag";
import { LinkConfig, LinkStyle } from "@/features/attack/graph/interface";
import { MarkerType } from "reactflow";


/**
 * ProcessDnsShip 表示进程与 DNS 对象的关系 (ProcessNode -> DnsNode)
 * ReverseProcessDnsShip 反向关系 (DnsNode -> ProcessNode)
 */
export interface ProcessDnsShip {
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
 * Process Dns 边配置
 */
const processDnsShipConfig: LinkConfig<ProcessDnsShip> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#03A9F4",
      width: 1,
      curve: "bezier",
      markerEnd: {
        type: MarkerType.Arrow,
        color: "#03A9F4",
        width: 4,
        height: 4,
      },
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "PROCESS_DNS",
};

export default processDnsShipConfig;
