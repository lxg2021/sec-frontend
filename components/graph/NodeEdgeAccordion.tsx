"use client";

import React, { useMemo } from "react";
import { EventCard } from "@/components/event/event-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { GetNodeLabel } from "@/components/graph/NodeLable";
import EdgeLabel from "@/components/graph/EdgeLabel";
import { GetEdgeDirection } from "./LinkDirection";

interface GraphNode<T> {
  id: string;
  type: string;
  data: T;
}

interface GraphLink<T> {
  id: string;
  source: string;
  target: string;
  type: string;
  data: T;
}

interface NodeEdgeAccordionProps {
  nodes: GraphNode<any>[];
  links: GraphLink<{}>[];
  treeRootId: string | null;
  onClearSelection: () => void;
  onShowGlobalTree: () => void;
  maxDepth?: number; // 可选最大递归深度
}

const NodeEdgeAccordion: React.FC<NodeEdgeAccordionProps> = ({
  nodes,
  links,
  treeRootId,
  onClearSelection,
  onShowGlobalTree,
  maxDepth = 3,
}) => {
  // 构建节点和出边 Map
  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
  const outLinksMap = useMemo(() => {
    const map = new Map<string, GraphLink<any>[]>();
    nodes.forEach(n => map.set(n.id, []));
    links.forEach(link => {
      if (!map.has(link.source)) map.set(link.source, []);
      map.get(link.source)?.push(link);
    });
    return map;
  }, [nodes, links]);

  // 获取根节点
  const rootNodes = useMemo(() => {
    const nodesWithIncoming = new Set(links.map(l => l.target));
    return nodes.filter(n => !nodesWithIncoming.has(n.id));
  }, [nodes, links]);

  // 递归渲染节点
  const renderNodeAccordion = (
    nodeId: string,
    path = new Set<string>(),
    level = 0
  ): JSX.Element | null => {
    if (path.has(nodeId)) {
      // 已经访问过，避免环路
      return (
        <div className={`ml-${level * 4} text-red-500 text-sm`}>
          环路节点: {nodeId}
        </div>
      );
    }

    const node = nodeMap.get(nodeId);
    if (!node) return null;

    if (level >= maxDepth) {
      return (
        <div className={`ml-${level * 4} text-gray-400 text-sm`}>
          节点 {nodeId} (展开过深，未显示子节点)
        </div>
      );
    }

    const newPath = new Set(path);
    newPath.add(nodeId);

    const outLinks = outLinksMap.get(nodeId) || [];

    return (
      <AccordionItem key={nodeId} value={`node-${nodeId}`}>
        <AccordionTrigger className="text-left hover:no-underline">
          <div className="flex items-center justify-between w-full">
            <span className={`font-medium ${nodeId === treeRootId ? 'text-blue-600' : ''}`}>
              {GetNodeLabel(node.id, node.type, node.data)}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <EventCard data={node.data} eventType={node.type} />
          </div>

          {outLinks.length > 0 && (
            <div className="space-y-3">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative bg-white px-3">
                  <Badge
                    variant="outline"
                    className="font-medium text-gray-700 text-sm border-gray-300"
                  >
                    {outLinks.length} 条边
                  </Badge>
                </div>
              </div>

              <Accordion type="multiple" className="space-y-2">
                {outLinks.map(link => {
                  const targetNode = nodeMap.get(link.target);

                  // 自环单独展示
                  if (link.source === link.target) {
                    return (
                      <div key={link.id} className="ml-4 text-red-500 text-sm">
                        自环边: {link.source} → {link.target}
                      </div>
                    );
                  }

                  if (!targetNode) return null;

                  return (
                    <AccordionItem key={link.id} value={`edge-${link.id}`}>
                      <AccordionTrigger className="text-left hover:no-underline py-2">
                        <EdgeLabel
                          link={link}
                          direction={GetEdgeDirection(link.type)}
                          sourcenode={node}
                          targetnode={targetNode}
                          className="bg-green-50 border-green-100 px-3 py-2 rounded"
                        />
                      </AccordionTrigger>
                      <AccordionContent className="ml-4 mt-2 border-l-2 border-gray-200 pl-4">
                        {renderNodeAccordion(link.target, newPath, level + 1)}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 space-y-6 bg-white border-b flex-shrink-0">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* 图标容器 */}
            <div className="p-2 bg-blue-50 rounded-lg">
              <svg
                className="h-6 w-6 text-blue-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 2L2 6v6c0 5 8 10 8 10s8-5 8-10V6l-8-4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">节点关联视图</h1>
              <p className="text-sm text-gray-500 mt-1">
                {nodes.length} 个节点，{links.length} 条边
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Accordion type="multiple" className="space-y-4">
          {treeRootId
            ? renderNodeAccordion(treeRootId)
            : rootNodes.length > 0
              ? rootNodes.map(root => renderNodeAccordion(root.id))
              : nodes.length > 0
                ? renderNodeAccordion(nodes[0].id)
                : <div className="text-center text-gray-500 py-8">暂无节点数据</div>
          }
        </Accordion>
      </div>
    </div>
  );
};

export default NodeEdgeAccordion;
