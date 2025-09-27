import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { AttackTag } from "@/components/graph/edge/AttackTag";
import { LinkConfig, LinkStyle } from "@/components/graph/interface";
import { MarkerType } from "reactflow";

/**
 * NetDnsShip 表示网络对象与 DNS 对象的关系 (NetNode -> DnsNode)
 */
export interface NetDnsShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 关系唯一 ID */
  UniqueID: string;

  /** 对象哈希 (md5(NetNode.ObjHash + DnsNode.ObjHash)) */
  Hash: string;
}

/**
 * DnsNetShip 表示 DNS 对象与网络对象的关系 (DnsNode -> NetNode)
 */
export interface DnsNetShip {
  /** 关系元素 ID */
  ShipElementID: ShipElementID;

  /** 关系发生时间 (ISO 8601 字符串) */
  Time: string;

  /** 关系唯一 ID */
  UniqueID: string;

  /** 对象哈希 (md5(NetNode.ObjHash + DnsNode.ObjHash)) */
  Hash: string;
}

/**
 * Net Dns 边配置
 */
const netDnsShipConfig: LinkConfig<any> = {
  getStyle: () => {
    const style: LinkStyle = {
      color: "#2196F3",
      width: 1,
      curve: "bezier",
      markerEnd: null,
      opacity: 1,
      fontSize: 8,
      textColor: "black",
    };
    return style;
  },
  getLabel: () => "NET_DNS",
  onClick: (data) => {

  },
};

export default netDnsShipConfig;
