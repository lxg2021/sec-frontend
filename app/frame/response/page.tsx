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

// 初始节点数据
const initialNodes: GraphNode<{ label: string }>[] = [
  { id: "1", type: "process",   data: { nodeId: "1", label: "Process A" } },
  { id: "2", type: "file",      data: { nodeId: "2", label: "File B" } },
  { id: "3", type: "process",   data: { nodeId: "3", label: "Process C" } },
  { id: "4", type: "file",      data: { nodeId: "4", label: "File D with long name" } },
  { id: "5", type: "process",   data: { nodeId: "5", label: "Process E" } },
  { id: "6", type: "file",      data: { nodeId: "6", label: "File F" } },
];

// 初始边数据（使用注册的边类型）
const initialLinks: GraphLink<{}>[] = [
  { id: "e1", source: "1", target: "2", type: "CREATE_FILE", data: "abc" },
  { id: "e2", source: "1", target: "3", type: "CREATE_PROCESS", data: "abc" },
  { id: "e3", source: "3", target: "4", type: "CREATE_FILE", data: "abc" },
  { id: "e4", source: "2", target: "4", type: "CREATE_FILE", data: "abc" },
  { id: "e5", source: "5", target: "6", type: "CREATE_FILE", data: "abc" },
  { id: "e6", source: "3", target: "5", type: "CREATE_PROCESS", data: "abc" },
  { id: "e7", source: "1", target: "1", type: "CREATE_PROCESS", data: "self" }, // 自环
];

// 测试数据 - 重复节点和边
const duplicateNodes: GraphNode<{ label: string }>[] = [
  { id: "1", type: "process", data: { nodeId: "1", label: "Duplicate Process A" } }, // 重复节点ID
  { id: "7", type: "process", data: { nodeId: "7", label: "Process G" } }, // 新节点
];

const duplicateLinks: GraphLink<{}>[] = [
  { id: "e1", source: "1", target: "2", type: "CREATE_FILE", data: "abc" }, // 重复边ID
  { id: "e8", source: "5", target: "7", type: "CREATE_PROCESS", data: "new edge" }, // 新边
];

export default function App() {
  const [nodes, setNodes] = useState<GraphNode<{ label: string }>[]>(initialNodes);
  const [links, setLinks] = useState<GraphLink<{}>[]>(initialLinks);
  const [timer, setTimer] = useState(10);
  const [testPhase, setTestPhase] = useState(0); // 0: 初始, 1: 已添加重复数据, 2: 已添加新数据

  useEffect(() => {
    if (timer > 0 && testPhase === 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    } else if (timer === 0 && testPhase === 0) {
      // 添加重复数据
      setNodes([...nodes, ...duplicateNodes]);
      setLinks([...links, ...duplicateLinks]);
      setTestPhase(1);
      setTimer(5);

      setTimeout(() => {
        alert("已添加重复数据测试：\n- 重复节点ID: 1\n- 重复边ID: e1\n请观察控制台是否有错误，以及图表是否正常显示");
      }, 500);
    } else if (timer > 0 && testPhase === 1) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    } else if (timer === 0 && testPhase === 1) {
      // 添加新数据
      const newNodes: GraphNode<{ label: string }>[] = [
        { id: "8", type: "file", data: { nodeId: "8", label: "File H" } },
        { id: "9", type: "process", data: { nodeId: "9", label: "Process I" } },
      ];

      const newLinks: GraphLink<{}>[] = [
        { id: "e9", source: "7", target: "8", type: "CREATE_FILE", data: "new edge 2" },
        { id: "e10", source: "8", target: "9", type: "CREATE_PROCESS", data: "new edge 3" },
      ];

      setNodes([...nodes, ...newNodes]);
      setLinks([...links, ...newLinks]);
      setTestPhase(2);

      setTimeout(() => {
        alert("已添加新数据：\n- 节点8 (File H)\n- 节点9 (Process I)\n- 边e9, e10\n测试完成！");
      }, 500);
    }
  }, [timer, testPhase, nodes, links]);

  return (
    <div className="w-screen h-screen relative bg-white">
      {/* 计时器显示 */}
      <div className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-10">
        {testPhase === 0 ? (
          <span>{timer}秒后添加重复数据测试...</span>
        ) : testPhase === 1 ? (
          <span>{timer}秒后添加新数据...</span>
        ) : (
          <span>测试完成!</span>
        )}
      </div>

      {/* 测试说明 */}
      <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-10 max-w-md">
        <h3 className="font-bold mb-2">重复数据测试</h3>
        <p className="text-sm mb-2">此测试将验证组件对重复节点和边的处理能力。</p>
        <ul className="text-xs list-disc pl-4">
          <li>第一阶段: 添加重复节点(ID:1)和重复边(ID:e1)</li>
          <li>第二阶段: 添加新节点(ID:8,9)和新边(ID:e9,e10)</li>
        </ul>
      </div>

      <GraphVisualization
        nodes={nodes}
        links={links}
        nodeConfigs={getNodeRegistry()}
        edgeConfigs={getEdgeRegistry()}
        direction="LR"
        forceLayout={true}
      />
    </div>
  );
}
