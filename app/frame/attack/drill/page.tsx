// page.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import GraphVisualization from "@/features/attack/graph/components/graph-visualization";
import {
  GraphNode,
  GraphLink,
} from "@/features/attack/graph/interface";
import "reactflow/dist/base.css";

// 引入注册中心
import nodeRegistry, { getNodeRegistry } from "@/features/attack/graph/center/register-node-center";
import edgeRegistry, { getEdgeRegistry } from "@/features/attack/graph/center/register-edge-center";
import NodeEdgeAccordion from "@/features/attack/graph/components/node-edge-accordion";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";
import { Shield, Clock, Workflow } from "lucide-react"
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from "@/shared/ui/card";
import { KillChainTimeline } from "@/features/attack/kill-chain/components/kill-chain-timeline"
import { initialNodes, initialLinks, demoUpdates } from "@/features/attack/mock/drill";
import { useTranslations } from "next-intl"



export default function App() {
  const t = useTranslations("pages.attack.drill")

  const [resetKey, setResetKey] = useState(0)
  const [nodes, setNodes] = useState<GraphNode<any>[]>(initialNodes);
  const [links, setLinks] = useState<GraphLink<{}>[]>(initialLinks);
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

  /* 处理鼠标移动，更新宽度 */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const delta = startXRef.current - e.clientX;
    const newWidth = startWidthRef.current + delta;

    /* 限制宽度范围，比如最小800px，最大1200px */
    if (newWidth >= 800 && newWidth <= 1200) {
      setSheetWidth(newWidth);
    }
  }, [isDragging]);

  /* 处理鼠标抬起，结束拖拽 */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /* 添加全局鼠标事件监听器 */
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

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
              <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
              <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
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
                <CardTitle className="text-lg font-bold text-gray-900">{t("timeline")}</CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  {t("timelineDescription")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="w-full overflow-x-auto">  {/* Added overflow-x-auto for horizontal scrolling */}
              {/* Kill Chain Timeline */}
              <KillChainTimeline key={resetKey} dynamicData={demoUpdates[2]} />
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
                  {t("graph")}
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          {/* 分割线 */}
          <div className="border-t border-gray-100" />

          <CardContent>
            <div className="w-full h-[760px]">
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
              <SheetTitle className="sr-only">{t("sheetTitle")}</SheetTitle>

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
    </div >
  )
}
