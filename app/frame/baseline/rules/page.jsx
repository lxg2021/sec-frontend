"use client"

import HostSelector from "@/components/hosts/HostSelector"
import { mockData } from "@/data/mockData"
import StrategySelector from "@/components/strategy/StrategySelector"
import { useState, useCallback } from "react"
import StrategyGuide from "@/components/strategy/StrategyGuide"
import ReviewCard from "@/components/review/ReviewCard"

// Mock数据
const mockData2 = [
  {
    id: "e7b7c8f9-3a1d-4f0e-b2d1-9e2a12345678",
    name: "服务器基线安全策略V1",
    type: "基线",
    level: "高",
    description: "针对服务器操作系统的安全基线检查策略，包含防火墙、口令复杂度等规则。",
    createdBy: "admin",
    createdAt: "2025-07-31T09:30:00Z",
    updatedBy: "security_manager",
    updatedAt: "2025-07-31T12:15:00Z",
    status: "启用",
    version: 1,
    content:
      '{\n  "rules": [\n    {\n      "id": "rule-001",\n      "name": "防火墙状态",\n      "checkItem": "防火墙是否开启",\n      "expected": "开启",\n      "operator": "=",\n      "level": "高"\n    },\n    {\n      "id": "rule-002",\n      "name": "口令长度",\n      "checkItem": "密码长度是否不少于8位",\n      "expected": ">=8",\n      "operator": ">=",\n      "level": "中"\n    }\n  ]\n}',
  },
  {
    id: "a3d9f420-7e5b-4a2a-8f8a-654b21234567",
    name: "Windows补丁更新策略V2",
    type: "补丁",
    level: "中",
    description: "确保所有Windows服务器已安装关键安全补丁。",
    createdBy: "patch_admin",
    createdAt: "2025-06-15T08:20:00Z",
    updatedBy: "patch_admin",
    updatedAt: "2025-07-01T10:00:00Z",
    status: "启用",
    version: 2,
    content:
      '{\n  "rules": [\n    {\n      "id": "rule-101",\n      "name": "关键补丁安装",\n      "checkItem": "安装所有重要安全补丁",\n      "expected": "已安装",\n      "operator": "=",\n      "level": "中"\n    }\n  ]\n}',
  },
  {
    id: "d4c2e5e3-1234-4a9d-bb56-111122223333",
    name: "应用回溯审计策略V1",
    type: "回溯",
    level: "高",
    description: "回溯策略，用于追踪重要应用操作日志。",
    createdBy: "audit_lead",
    createdAt: "2025-07-01T14:45:00Z",
    updatedBy: "audit_lead",
    updatedAt: "2025-07-15T16:30:00Z",
    status: "启用",
    version: 1,
    content:
      '{\n  "rules": [\n    {\n      "id": "rule-201",\n      "name": "日志完整性",\n      "checkItem": "确保应用日志完整且未被篡改",\n      "expected": "完整",\n      "operator": "=",\n      "level": "高"\n    },\n    {\n      "id": "rule-202",\n      "name": "操作追踪",\n      "checkItem": "记录关键操作的详细信息",\n      "expected": "已记录",\n      "operator": "=",\n      "level": "高"\n    }\n  ]\n}',
  },
  {
    id: "f1122334-5566-7788-99aa-bbccddeeff00",
    name: "Linux服务器基线策略V1",
    type: "基线",
    level: "中",
    description: "Linux服务器基础安全配置基线，包括账户策略与防火墙规则。",
    createdBy: "linux_admin",
    createdAt: "2025-07-20T11:10:00Z",
    updatedBy: "linux_admin",
    updatedAt: "2025-07-25T09:50:00Z",
    status: "启用",
    version: 1,
    content:
      '{\n  "rules": [\n    {\n      "id": "rule-301",\n      "name": "账户锁定策略",\n      "checkItem": "账户连续登录失败次数限制",\n      "expected": "5次",\n      "operator": "<=",\n      "level": "中"\n    },\n    {\n      "id": "rule-302",\n      "name": "防火墙开启",\n      "checkItem": "iptables 防火墙是否开启",\n      "expected": "开启",\n      "operator": "=",\n      "level": "中"\n    }\n  ]\n}',
  },
  // 添加更多测试数据以便测试分页
  {
    id: "test-001",
    name: "数据库安全策略V1",
    type: "基线",
    level: "高",
    description: "数据库安全基线策略",
    createdBy: "db_admin",
    createdAt: "2025-07-25T10:00:00Z",
    updatedBy: "db_admin",
    updatedAt: "2025-07-25T10:00:00Z",
    status: "草稿",
    version: 1,
    content: "{}",
  },
  {
    id: "test-002",
    name: "网络设备补丁策略V1",
    type: "补丁",
    level: "低",
    description: "网络设备补丁更新策略",
    createdBy: "network_admin",
    createdAt: "2025-07-20T15:30:00Z",
    updatedBy: "network_admin",
    updatedAt: "2025-07-20T15:30:00Z",
    status: "禁用",
    version: 1,
    content: "{}",
  },
]


export default function Page() {
  const [selectedNodes, setSelectedNodes] = useState([])
  const [selectedStrategies, setSelectedStrategies] = useState([])

  // 使用 useCallback 包装回调函数，避免每次渲染都重新创建
  const handleHostsSelectionChange = useCallback((nodes, selectedIds) => {
     const newNodes = nodes.filter((node) => node.type === "host")
    setSelectedNodes(newNodes)
    console.log("选中的节点:", newNodes)
    console.log("选中的ID集合:", Array.from(selectedIds))
  }, [])

  const handleStrategySelectionChange = (strategies) => {
    setSelectedStrategies(strategies)
    console.log("选中的策略:", strategies)
  }

    // 预览回调
  const handlePreview = () => {
    console.log("预览确认")
    console.log("当前选中的主机:", selectedNodes)
    console.log("当前选中的策略:", selectedStrategies)
  }

  // 下发回调
  const handleDeploy = async (strategies, hosts) => {
    console.log("开始下发策略...")
    console.log("策略列表:", strategies)
    console.log("目标主机:", hosts)

    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // 模拟成功/失败（80%成功率）
    const success = Math.random() > 0.2

    console.log("下发结果:", success ? "成功" : "失败")
    return success
  }


  const node = {
    name: "Web Server 01",
    type: "host",
    level: 3,
    parentId: "group-1",
    hostname: "web-01.techcorp.com",
    hostId: "WEB-001",
    ip: "192.168.1.101",
    mac: "00:1B:44:11:3A:B7",
    os: "Ubuntu 22.04",
    status: "online",
    cpu: "Intel Xeon E5-2680 v4",
    memory: "32GB DDR4",
    disk: "1TB SSD",
  };

  return (
    <div>
      <StrategyGuide />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <HostSelector data={mockData} onSelectionChange={handleHostsSelectionChange} />
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-8">
        <div className="max-w-7xl mx-auto space-y-8"></div>
        <StrategySelector data={mockData2} onSelectionChange={handleStrategySelectionChange} multiSelect={true} />
      </div>

      <ReviewCard
        strategies={selectedStrategies}
        hosts={selectedNodes}
        onPreview={handlePreview}
        onDeploy={handleDeploy}
      />
    </div>
  );
}
