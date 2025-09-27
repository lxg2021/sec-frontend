// page.tsx
"use client";

import React, { useState, useEffect } from "react";
import GraphVisualization from "@/components/graph/GraphVisualization";
import {
  GraphNode,
  GraphLink,
} from "@/components/graph/interface";
import "reactflow/dist/base.css";

// 引入注册中心
import nodeRegistry, { getNodeRegistry } from "@/components/graph/center/RegisterNodeCenter";
import edgeRegistry, { getEdgeRegistry } from "@/components/graph/center/RegisterEdgeCenter";
import { Shield, Clock, Workflow } from "lucide-react"
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { KillChainTimeline } from "@/components/killchain/kill-chain-timeline"
import type { DynamicKillChainData } from "@/lib/kill-chain"

// 初始节点数据
const initialNodes: GraphNode<{ label: string }>[] = [
  { id: "1", type: "ProcessNode", data: { nodeId: "1", label: "Process A" } },
  { id: "2", type: "FileNode", data: { nodeId: "2", label: "File B" } },
  { id: "3", type: "ProcessNode", data: { nodeId: "3", label: "Process C" } },
  { id: "4", type: "FileNode", data: { nodeId: "4", label: "File D with long name" } },
  { id: "5", type: "ProcessNode", data: { nodeId: "5", label: "Process E" } },
  { id: "6", type: "FileNode", data: { nodeId: "6", label: "File F" } },
  { id: "n1", type: "NetNode", data: { nodeId: "n1", label: "Net G" } },
  { id: "d1", type: "DnsNode", data: { nodeId: "d1", label: "DNS A" } },
  { id: "v1", type: "VolumeNode", data: { nodeId: "v1", label: "Volume A" } },
  { id: "fs1", type: "FileStreamNode", data: { nodeId: "fs1", label: "File Stream A" } },
  { id: "bits1", type: "BitsJobNode", data: { nodeId: "bits1", label: "Bits Job A" } },
  { id: "t1", type: "TaskNode", data: { nodeId: "t1", label: "Task A" } },
  { id: "dll1", type: "DllImageNode", data: { nodeId: "dll1", label: "DLL Image A" } },
  { id: "drv1", type: "DriverImageNode", data: { nodeId: "drv1", label: "Driver Image A" } },
  { id: "enc1", type: "EnDecryptNode", data: { nodeId: "enc1", label: "Encrypt Node A" } },
  { id: "ev1", type: "EventNode", data: { nodeId: "ev1", label: "Event Node A" } },
  { id: "fm1", type: "FileMappingNode", data: { nodeId: "fm1", label: "File Mapping Node A" } },
  { id: "ms1", type: "MailSlotNode", data: { nodeId: "ms1", label: "Mail Slot Node A" } },
  { id: "mbr1", type: "MbrNode", data: { nodeId: "mbr1", label: "MBR Node A" } },
  { id: "p1", type: "PipeNode", data: { nodeId: "p1", label: "Pipe Node A" } },
  { id: "ps1", type: "PowershellNode", data: { nodeId: "ps1", label: "Powershell Node A" } },
  { id: "rk1", type: "RegKeyNode", data: { nodeId: "rk1", label: "Reg Key Node A" } },
  { id: "rk2", type: "RegKeyNode", data: { nodeId: "rk2", label: "Reg Key Node B" } },

  { id: "rv1", type: "RegValueNode", data: { nodeId: "rv1", label: "Reg Value Node A" } },
  { id: "cr1", type: "CredentialsNode", data: { nodeId: "cr1", label: "Credentials Node A" } },
  { id: "it1", type: "ImpersonationTokenNode", data: { nodeId: "it1", label: "Impersonation Token Node A" } },
  { id: "msg1", type: "MessageNode", data: { nodeId: "msg1", label: "Message Node A" } },
  { id: "url1", type: "UrlNode", data: { nodeId: "url1", label: "URL Node A" } },
  { id: "wmi1", type: "WmiClassNode", data: { nodeId: "wmi1", label: "WMI Class Node A" } },
  { id: "wmiq1", type: "WmiQueryNode", data: { nodeId: "wmiq1", label: "WMI Query Node A" } },
  { id: "wmie1", type: "WmiExecuteNode", data: { nodeId: "wmie1", label: "WMI Execute Node A" } },
  { id: "wmic1", type: "WmiConsumerNode", data: { nodeId: "wmic1", label: "WMI Consumer Node A" } },
  { id: "wmif1", type: "WmiFilterNode", data: { nodeId: "wmif1", label: "WMI Filter Node A" } },
  { id: "ag1", type: "AgentNode", data: { nodeId: "ag1", label: "Agent Node A" } },
  { id: "dc1", type: "DeviceChangeNode", data: { nodeId: "dc1", label: "Device Change Node A" } },
  { id: "sv1", type: "ServiceNode", data: { nodeId: "sv1", label: "Service Node A" } },
  { id: "ac1", type: "AccountGroupNode", data: { nodeId: "ac1", label: "Account Group Node A" } },
  { id: "ac2", type: "AccountNode", data: { nodeId: "ac2", label: "Account Node A" } },
  { id: "at1", type: "AttackNode", data: { nodeId: "at1", label: "Attack Node A" } },
  { id: "fr1", type: "FileNode", data: { nodeId: "fr1", label: "File RenameX" } },
];

// 初始边数据（使用注册的边类型）
const initialLinks: GraphLink<{}>[] = [
  { id: "e1", source: "1", target: "2", type: "CREATE_FILE", data: "abc" },
  { id: "e2", source: "1", target: "3", type: "TERMINATE_PROCESS", data: "abc" },
  { id: "e3", source: "3", target: "4", type: "CREATE_FILE", data: "abc" },
  { id: "e5", source: "5", target: "6", type: "CREATE_FILE", data: "abc" },
  { id: "e6", source: "3", target: "5", type: "ACCESS_PROCESS", data: "abc" },
  { id: "e7", source: "1", target: "1", type: "CREATE_PROCESS", data: "self" }, // 自环
  { id: "e11", source: "3", target: "n1", type: "PROCESS_NET", data: "abc" },
  { id: "e12", source: "3", target: "d1", type: "PROCESS_DNS", data: "abc" },
  { id: "e13", source: "n1", target: "d1", type: "NET_DNS", data: "abc" },
  { id: "e14", source: "ag1", target: "d1", type: "NET_LATERAL_MOVEMENT", data: "abc" },
  { id: "e15", source: "3", target: "v1", type: "ACCESS_VOLUME", data: "abc" },
  { id: "e16", source: "5", target: "4", type: "DELETE_FILE", data: "abc" },
  { id: "e17", source: "3", target: "6", type: "READ_FILE", data: "abc" },
  { id: "e18", source: "3", target: "6", type: "WRITE_FILE", data: "abc" },
  { id: "e19", source: "3", target: "6", type: "SET_FILE_EA", data: "abc2" },
  { id: "e20", source: "3", target: "fr1", type: "RENAME_FILE", data: "abc2" },
  { id: "e21", source: "4", target: "fr1", type: "RENAME_PEER_FILE", data: "abc2" },
  { id: "e22", source: "3", target: "6", type: "MOVE_FILE", data: "abc2" },
  { id: "e23", source: "6", target: "fr1", type: "MOVE_PEER_FILE", data: "abc2" },
  { id: "e24", source: "3", target: "6", type: "CHANGE_FILE_ATTRIBUTES", data: "abc2" },

  { id: "e25", source: "1", target: "fs1", type: "CREATE_FILE_STREAM", data: "abc" },
  { id: "e26", source: "1", target: "fs1", type: "DELETE_FILE_STREAM", data: "abc" },
  { id: "e27", source: "fs1", target: "2", type: "STREAM_PEER_FILE", data: "abc" },
  { id: "e28", source: "fr1", target: "fs1", type: "NEW_FILE_PEER_STREAM", data: "abc" },

  { id: "e29", source: "1", target: "bits1", type: "CREATE_BITS", data: "abc" },
  { id: "e30", source: "1", target: "bits1", type: "BITS_ADD_FILE", data: "abc" },
  { id: "e31", source: "1", target: "bits1", type: "BITS_STATUS_CHANGE", data: "abc" },

  { id: "e32", source: "3", target: "t1", type: "CREATE_TASK", data: "abc" },
  { id: "e33", source: "fr1", target: "t1", type: "FILE_MD5_PEER_SHIP", data: "abc" },
  { id: "e34", source: "t1", target: "ag1", type: "TASK_LATERAL_MOVEMENT", data: "abc" },
  { id: "e35", source: "5", target: "t1", type: "DELETE_TASK", data: "abc" },
  { id: "e36", source: "5", target: "3", type: "CROSS_MEMORY_EXECUTE", data: "abc" },

  { id: "e37", source: "3", target: "dll1", type: "LOAD_DLL", data: "abc" },
  { id: "e38", source: "fr1", target: "dll1", type: "DLL_MD5_PEER_SHIP", data: "abc" },

  { id: "e39", source: "3", target: "drv1", type: "LOAD_DRIVER", data: "abc" },
  { id: "e40", source: "fr1", target: "drv1", type: "DRIVER_MD5_PEER_SHIP", data: "abc" },
  { id: "e41", source: "3", target: "enc1", type: "ENCRYPT_DECRYPT", data: "abc" },

  { id: "e42", source: "3", target: "ev1", type: "CREATE_EVENT", data: "abc" },
  { id: "e43", source: "3", target: "ev1", type: "OPEN_EVENT", data: "abc" },

  { id: "e44", source: "3", target: "fm1", type: "CREATE_FILE_MAPPING", data: "abc" },
  { id: "e45", source: "3", target: "fm1", type: "CONNECT_FILE_MAPPING", data: "abc" },

  { id: "e46", source: "3", target: "ms1", type: "CREATE_MAILSLOT", data: "abc" },
  { id: "e47", source: "3", target: "ms1", type: "CONNECT_MAILSLOT", data: "abc" },

  { id: "e48", source: "3", target: "mbr1", type: "MODIFY_MBR", data: "abc" },

  { id: "e49", source: "3", target: "p1", type: "CREATE_PIPE", data: "abc" },
  { id: "e50", source: "3", target: "p1", type: "CONNECT_PIPE", data: "abc" },

  { id: "e51", source: "3", target: "ps1", type: "POWERSHELL", data: "abc" },

  { id: "e52", source: "3", target: "rk1", type: "CREATE_REGKEY", data: "abc" },
  { id: "e53", source: "3", target: "rk1", type: "DELETE_REGKEY", data: "abc" },
  { id: "e54", source: "3", target: "rk1", type: "RENAME_REGKEY", data: "abc" },
  { id: "e55", source: "rk1", target: "rk2", type: "RENAME_REGKEY_PEER", data: "abc" },

  { id: "e56", source: "3", target: "rv1", type: "SET_REGVALUE", data: "abc" },
  { id: "e57", source: "3", target: "rv1", type: "DELETE_REGVALUE", data: "abc" },
  { id: "e58", source: "3", target: "rv1", type: "QUERY_REGVALUE", data: "abc" },

  { id: "e59", source: "3", target: "cr1", type: "STEALING_CREDENTIALS", data: "abc" },

  { id: "e60", source: "3", target: "5", type: "ADJUST_PRIVILEGE", data: "abc" },
  { id: "e61", source: "3", target: "it1", type: "IMPERSONATION_TOKEN", data: "abc" },

  { id: "e62", source: "3", target: "msg1", type: "HOOK_MESSAGE", data: "abc" },
  { id: "e63", source: "3", target: "it1", type: "SET_TOKEN", data: "abc" },

  { id: "e64", source: "3", target: "url1", type: "ACCESS_URL", data: "abc" },

  { id: "e65", source: "5", target: "wmi1", type: "CREATE_WMI_CLASS", data: "abc" },

  { id: "e66", source: "wmi1", target: "ag1", type: "WMI_LATERAL_MOVEMENT", data: "abc" },

  { id: "e67", source: "5", target: "wmiq1", type: "WMI_QUERY", data: "abc" },
  { id: "e68", source: "5", target: "wmie1", type: "WMI_EXECUTE", data: "abc" },
  { id: "e69", source: "5", target: "wmic1", type: "WMI_CONSUMER", data: "abc" },
  { id: "e70", source: "5", target: "wmif1", type: "WMI_FILTER", data: "abc" },
  { id: "e71", source: "wmic1", target: "wmif1", type: "CONSUMER_FILTER_BINDING", data: "abc" },
  { id: "e72", source: "dc1", target: "ag1", type: "DEVICE_CHANGE", data: "abc" },

  { id: "e74", source: "5", target: "sv1", type: "CREATE_SERVICE", data: "abc" },
  { id: "e75", source: "5", target: "sv1", type: "START_SERVICE", data: "abc" },
  { id: "e76", source: "5", target: "sv1", type: "DELETE_SERVICE", data: "abc" },
  { id: "e77", source: "5", target: "sv1", type: "STOP_SERVICE", data: "abc" },
  { id: "e78", source: "5", target: "sv1", type: "PAUSE_RESTORE_SERVICE", data: "abc" },
  { id: "e79", source: "5", target: "sv1", type: "CHANGE_SERVICE", data: "abc" },
  { id: "e80", source: "sv1", target: "2", type: "SERVICE_MD5_PEER_SHIP", data: "abc" },

  { id: "e81", source: "5", target: "ac2", type: "CREATE_ACCOUNT", data: "abc" },
  { id: "e82", source: "5", target: "ac2", type: "ENABLE_ACCOUNT", data: "abc" },
  { id: "e83", source: "5", target: "ac2", type: "RESET_ACCOUNT_PASSWORD", data: "abc" },
  { id: "e84", source: "5", target: "ac2", type: "DISABLE_ACCOUNT", data: "abc" },
  { id: "e85", source: "5", target: "ac2", type: "DELETE_ACCOUNT", data: "abc" },
  { id: "e86", source: "5", target: "ac2", type: "MODIFY_ACCOUNT", data: "abc" },

  { id: "e87", source: "5", target: "ac1", type: "ADD_ACCOUNT_GROUP", data: "abc" },
  { id: "e88", source: "5", target: "ac1", type: "DELETE_ACCOUNT_GROUP", data: "abc" },
  { id: "e89", source: "5", target: "ac1", type: "CREATE_GROUP", data: "abc" },
  { id: "e90", source: "5", target: "ac1", type: "DELETE_GROUP", data: "abc" },

];

// Demo data for testing dynamic updates
const demoUpdates: DynamicKillChainData[][] = [
  // First update - Reconnaissance stage
  [
    {
      id: "recon",
      name: "侦察 (Reconnaissance)",
      status: "active",
      attckStages: [
        {
          slug: "reconnaissance",
          name: "侦察",
          techniques: [
            {
              id: "T1595",
              name: "主动扫描",
              time: "09:15:23",
              description: "攻击者执行主动侦察扫描以收集信息",
              references: ["https://attack.mitre.org/techniques/T1595/"],
            },
            {
              id: "T1590",
              name: "收集受害者网络信息",
              time: "09:25:45",
              description: "攻击者收集有关受害者网络的信息",
              references: [
                "https://attack.mitre.org/techniques/T1590/",
                "https://attack.mitre.org/techniques/T1590/001"
              ],
            },
          ],
        },
      ],
    },
  ],
  // Second update - Complete recon, start weaponization
  [
    {
      id: "recon",
      name: "侦察 (Reconnaissance)",
      status: "completed",
      attckStages: [
        {
          slug: "reconnaissance",
          name: "侦察",
          techniques: [
            {
              id: "T1595",
              name: "主动扫描",
              time: "09:15:23",
              description: "攻击者执行主动侦察扫描以收集信息",
              references: ["https://attack.mitre.org/techniques/T1595/"],
            },
            {
              id: "T1590",
              name: "收集受害者网络信息",
              time: "09:25:45",
              references: [
                "https://attack.mitre.org/techniques/T1590/",
                "https://attack.mitre.org/techniques/T1590/001"
              ],
              description: "攻击者收集有关受害者网络的信息",
            },
            {
              id: "T1596",
              name: "搜索开放技术数据库",
              time: "09:45:12",
              description: "攻击者搜索开放的技术数据库获取信息",
              references: [
                "https://attack.mitre.org/techniques/T1596/",
                "https://attack.mitre.org/techniques/T1596/001",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "weapon",
      name: "武器化 (Weaponization)",
      status: "active",
      attckStages: [
        {
          slug: "resource-development",
          name: "资源开发",
          techniques: [
            {
              id: "T1587",
              name: "开发能力",
              time: "10:22:45",
              description: "攻击者构建可在目标定位期间使用的能力",
              references: [
                "https://attack.mitre.org/techniques/T1587/",
                "https://attack.mitre.org/techniques/T1587/001",
              ],
            },
          ],
        },
        {
          slug: "resource-development-testing",
          name: "资源开发testing",
          techniques: [
            {
              id: "T1580",
              name: "开发能力testing",
              time: "10:22:45",
              description: "攻击者构建可在目标定位期间使用的能力testing",
              references: [
                "https://attack.mitre.org/techniques/T1580/",
                "https://attack.mitre.org/techniques/T1580/001",
              ],
            },
          ],
        },
      ],
    },
  ],
  // Third update - Complete weaponization, start delivery
  [
    {
      id: "weapon",
      name: "武器化 (Weaponization)",
      status: "completed",
      attckStages: [
        {
          slug: "resource-development",
          name: "资源开发",
          techniques: [
            {
              id: "T1587",
              name: "开发能力",
              time: "10:22:45",
              description: "攻击者构建可在目标定位期间使用的能力",
              references: [
                "https://attack.mitre.org/techniques/T1587/",
                "https://attack.mitre.org/techniques/T1587/001",
              ],
            },
            {
              id: "T1588",
              name: "获取能力",
              time: "11:15:33",
              description: "攻击者购买和/或窃取能力",
              references: [
                "https://attack.mitre.org/techniques/T1588/",
                "https://attack.mitre.org/techniques/T1588/001",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "delivery",
      name: "投递 (Delivery)",
      status: "active",
      attckStages: [
        {
          slug: "initial-access",
          name: "初始访问",
          techniques: [
            {
              id: "T1566",
              name: "钓鱼攻击",
              time: "11:30:15",
              description: "攻击者发送钓鱼消息以获得访问权限",
              references: [
                "https://attack.mitre.org/techniques/T1566/",
                "https://attack.mitre.org/techniques/T1566/001",
              ],
            },
          ],
        },
      ],
    },
  ],
]


export default function App() {
  const [nodes, setNodes] = useState<GraphNode<{ label: string }>[]>(initialNodes)
  const [links, setLinks] = useState<GraphLink<{}>[]>(initialLinks)
  const [currentData, setCurrentData] = useState<DynamicKillChainData[]>(demoUpdates[2])
  const [resetKey, setResetKey] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              {/* 这里可以换成 Graph 图标 */}
              <Shield className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">溯源详情</h1>
              <p className="text-sm text-gray-500 mt-1">Attack Investigation Details</p>
            </div>
          </div>
        </div>

        {/* Kill Chain Timeline */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Workflow className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">攻击时间线</CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  APT Timeline
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="w-full">
              {/* Kill Chain Timeline */}
              <KillChainTimeline key={resetKey} dynamicData={currentData} />
            </div>
          </CardContent>
        </Card>

        {/* Graph 可视化 */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 flex items-center justify-center rounded-lg bg-blue-500">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-lg md:text-xl font-semibold">
                  溯源图谱
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          {/* 分割线 */}
          <div className="border-t border-gray-100" />

          <CardContent>
            <div className="w-full h-[700px]">
              <GraphVisualization
                nodes={nodes}
                links={links}
                nodeConfigs={getNodeRegistry()}
                edgeConfigs={getEdgeRegistry()}
                direction="LR"
                forceLayout={true}
              />
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  )
}