"use client"

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <HostSelector data={mockData} onSelectionChange={handleSelectionChange} />
        </div>
      </div>
    </div>
  );
}
