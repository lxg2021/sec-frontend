"use client"

import { Search } from "@/components/search/Search"
import { Shield, Workflow } from "lucide-react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import GraphVisualization from "@/components/graph/GraphVisualization";
import {
  GraphNode,
  GraphLink,
} from "@/components/graph/interface";
import "reactflow/dist/base.css";
import { initPositionNodes, initPositionLinks } from "@/data/drill-mock-data";
import React, { useState, useCallback, useRef, useEffect } from "react";
import nodeRegistry, { getNodeRegistry } from "@/components/graph/center/RegisterNodeCenter";
import edgeRegistry, { getEdgeRegistry } from "@/components/graph/center/RegisterEdgeCenter";
import NodeEdgeAccordion from "@/components/graph/NodeEdgeAccordion";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";


export default function Home() {
  const [nodes, setNodes] = useState<GraphNode<any>[]>(initPositionNodes);
  const [links, setLinks] = useState<GraphLink<{}>[]>(initPositionLinks);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [treeRootId, setTreeRootId] = useState<string | null>(null);
  const [sheetWidth, setSheetWidth] = useState(800);

  /* 拖拽相关状态和引用 */
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  /* 节点点击处理函数 */
  const handleNodeClick = useCallback((event: React.MouseEvent, node: any) => {
    setCurrentNodeId(node.id);
    setTreeRootId(node.id);
    setIsSheetOpen(true);
  }, []);

  /* 边点击处理函数 */
  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: any) => {
  }, []);

  /* 关闭抽屉 */
  const handleCloseSheet = useCallback(() => {
    setIsSheetOpen(false);
    setTreeRootId(null);
  }, []);

  /* 处理鼠标按下，开始拖拽 */
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = sheetWidth;
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Shield className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">数据定位</h1>
              <p className="text-sm text-gray-500 mt-1">Pinpoint Data Source</p>
            </div>
          </div>
        </div>

        {/* 搜索组件 */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Workflow className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">搜索查询</CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  输入 IP、DNS、MD5 或端口进行查询
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="w-full overflow-x-auto">
              <Search
                onSearch={(params) => {
                  console.log("Search params:", params)
                  // 完成后台数据库搜素，设置nodes, links
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Graph 可视化 */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 flex items-center justify-center rounded-lg bg-blue-500">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-lg md:text-xl font-semibold">
                  数据图谱
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          {/* 分割线 */}
          <div className="border-t border-gray-100" />

          <CardContent>
            <div className="w-full h-[640px]">
              <GraphVisualization
                nodes={nodes}
                links={links}
                nodeConfigs={getNodeRegistry()}
                edgeConfigs={getEdgeRegistry()}
                direction="LR"
                forceLayout={true}
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
              />
            </div>
          </CardContent>
        </Card>


        {/* 使用 Sheet 组件 */}
        <div className="bg-white shadow-sm mb-6">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen} modal={false}>
            <SheetContent
              side="right"
              className="p-0 flex flex-col"
              style={{
                width: `${Math.max(240, sheetWidth)}px`,
                minWidth: '680px',
                maxWidth: 'none',
                marginTop: '48px',
              }}
              onInteractOutside={(e) => e.preventDefault()}
            >
              {/* 添加隐藏的 SheetTitle 用于可访问性 */}
              <SheetTitle className="sr-only">节点详情面板</SheetTitle>

              {/* 拖拽条 */}
              <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize bg-gray-200 hover:bg-gray-300 z-10"
                onMouseDown={handleMouseDown}
              />

              {/* NodeEdgeAccordion 组件 */}
              <NodeEdgeAccordion
                nodes={nodes}
                links={links}
                treeRootId={treeRootId}
              />
            </SheetContent>
          </Sheet>

          {/* 拖拽时的遮罩，防止文本选中 */}
          {isDragging && (
            <div className="fixed inset-0 z-50 cursor-col-resize" />
          )}
        </div>

      </div>
    </div>
  )
}
