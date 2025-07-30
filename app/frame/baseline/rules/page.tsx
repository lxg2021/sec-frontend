"use client"

import { HostInfoCard } from '@/components/InfoCard';
import HostSelector from "@/components/hosts/HostSelector"
import { mockData } from "@/data/mockData"
import { useState, useCallback } from "react" 


export default function Page() {
  const [selectedNodes, setSelectedNodes] = useState([])

  // 使用 useCallback 包装回调函数，避免每次渲染都重新创建
  const handleSelectionChange = useCallback((nodes, selectedIds) => {
    setSelectedNodes(nodes)
    console.log("选中的节点:", nodes)
    console.log("选中的ID集合:", Array.from(selectedIds))
  }, [])
  
  const dummyHost = {
    name: 'server-01',
    hostInfo: {
      id: 'ID-001',
      status: 'Online',
      os: 'Ubuntu 22.04',
      location: '数据中心A',
      cpu: 'Intel Xeon E5-2680',
      memory: '64GB',
      storage: '2TB SSD',
      ip: '192.168.1.10',
	  mac: '00:1A:2B:3C:4D:5E',
      // uptime: '3天12小时', // 新增字段支持
    },
  };

  return (
	<div>
		<div className="p-6 max-w-3xl mx-auto">
			<HostInfoCard host={dummyHost} />
		</div>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-700 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            主机管理系统
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
            优雅地选择和管理您的主机资源，支持多维度层级结构和智能搜索
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 mx-auto rounded-full"></div>
        </div>

        <HostSelector data={mockData} onSelectionChange={handleSelectionChange} />
      </div>
    </div>
	</div>
  );
}
