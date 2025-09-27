"use client"

// GraphVisualization.tsx
import React, { useCallback, useEffect, useMemo } from "react"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeTypes,
  type EdgeTypes,
  Position,
  type EdgeProps,
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
  EdgeLabelRenderer,
  Handle,
  type NodeProps,
} from "reactflow"
import "reactflow/dist/style.css"
import dagre from "dagre"
import type {
  GraphNode,
  GraphLink,
  NodeConfig,
  LinkConfig,
  NodeTypeMap,
  EdgeTypeMap,
  NodeStyle,
  LinkStyle,
  ContextMenuItem,
} from "./interface"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem as ShadcnContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

interface GraphVisualizationProps<TNodeData = any, TEdgeData = any> {
  nodes: GraphNode<TNodeData>[]
  links: GraphLink<TEdgeData>[]
  nodeConfigs: NodeTypeMap<TNodeData>
  edgeConfigs: EdgeTypeMap<TEdgeData>
  direction?: "LR" | "TB"
  forceLayout?: boolean
}

const defaultNodeWidth = 150
const defaultNodeHeight = 50

function ensureUniqueItems<T extends { id: string }>(items: T[]): T[] {
  const seen = new Map<string, T>()
  const result: T[] = []

  items.forEach((item) => {
    if (!seen.has(item.id)) {
      // 首次出现，直接存
      seen.set(item.id, item)
      result.push(item)
    } else {
      const existing = seen.get(item.id)!

      // 判断内容是否相同（浅比较）
      const isSame = JSON.stringify({ ...existing, id: undefined }) === JSON.stringify({ ...item, id: undefined })

      if (isSame) {
        //  内容完全一样，丢弃
        return
      } else {
        // 内容不同，加后缀
        let counter = 1
        let newId = `${item.id}-dup${counter}`
        while (seen.has(newId)) {
          newId = `${item.id}-dup${++counter}`
        }
        const newItem = { ...item, id: newId }
        seen.set(newId, newItem)
        result.push(newItem)
      }
    }
  })

  return result
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  nodes: initialNodes,
  links: initialLinks,
  nodeConfigs,
  edgeConfigs,
  direction = "LR",
  forceLayout = false,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge>([])

  const getLayoutedElements = useCallback((rfNodes: RFNode[], rfEdges: RFEdge[], dir: "LR" | "TB") => {
    const dagreGraph = new dagre.graphlib.Graph()
    dagreGraph.setDefaultEdgeLabel(() => ({}))

    dagreGraph.setGraph({
      rankdir: dir,
      nodesep: 100, // maxWidth * 2 节点间距，可根据节点宽度调整
      ranksep: 120, // maxHeight * 2 层间距，可根据节点高度调整
    })

    rfNodes.forEach((node) => {
      // 修改：使用图形部分的大小而不是整个节点大小进行布局计算
      const nodeData = node.data as any;
      const config = nodeData?.type ? nodeConfigs[nodeData.type] : null;
      let nodeWidth = node.width ?? defaultNodeWidth;
      let nodeHeight = node.height ?? defaultNodeHeight;
      
      if (config && nodeData) {
        const style: NodeStyle = config.getStyle(nodeData);
        // 只使用图形部分的大小（忽略标签）
        nodeWidth = style.width ?? 60;
        nodeHeight = style.height ?? 60;
      }

      dagreGraph.setNode(node.id, {
        width: nodeWidth,
        height: nodeHeight,
      })
    })

    rfEdges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target)
    })

    dagre.layout(dagreGraph)

    rfNodes.forEach((node) => {
      const nodeWithPosition = dagreGraph.node(node.id)
      node.targetPosition = dir === "TB" ? Position.Top : Position.Left
      node.sourcePosition = dir === "TB" ? Position.Bottom : Position.Right
      
      // 修改：使用图形部分的大小进行位置计算
      const nodeData = node.data as any;
      const config = nodeData?.type ? nodeConfigs[nodeData.type] : null;
      let nodeWidth = node.width ?? defaultNodeWidth;
      let nodeHeight = node.height ?? defaultNodeHeight;
      
      if (config && nodeData) {
        const style: NodeStyle = config.getStyle(nodeData);
        nodeWidth = style.width ?? 60;
        nodeHeight = style.height ?? 60;
      }

      node.position = {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      }
    })

    return { nodes: rfNodes, edges: rfEdges }
  }, [nodeConfigs])

  useEffect(() => {
    const rfNodes: RFNode[] = initialNodes.map((node) => {
      const config = nodeConfigs[node.type]
      const style = config.getStyle(node.data)

      return {
        id: node.id,
        type: node.type,
        data: { ...node.data, nodeType: node.type }, // 添加 nodeType 以便在布局函数中访问
        position: node.position ?? { x: 0, y: 0 },
        width: style.width ?? 60,
        height: style.height ?? 60,
        sourcePosition: direction === "TB" ? Position.Bottom : Position.Right,
        targetPosition: direction === "TB" ? Position.Top : Position.Left,
      }
    })

    const rfEdges: RFEdge[] = initialLinks.map((link) => {
      const config = edgeConfigs[link.type]
      const style = config.getStyle(link.data ?? {})

      return {
        id: link.id ?? `${link.source}-${link.target}-${link.type}`,
        source: link.source,
        target: link.target,
        type: link.type,
        data: link.data,
        markerEnd: style.markerEnd ?? undefined,
      }
    })

    // 🔍 打印初始转换结果
    console.log("[GraphVisualization] rfEdges before dedup:", rfEdges);

    // 关键：去重 + 自动加后缀
    const uniqueNodes = ensureUniqueItems(rfNodes)
    let uniqueEdges = ensureUniqueItems(rfEdges)

    // 处理多重边：分组并计算 index, total, offset
    const edgeGroups = new Map<string, RFEdge[]>();
    uniqueEdges.forEach((edge) => {
      const key = `${edge.source}-${edge.target}`;
      if (!edgeGroups.has(key)) {
        edgeGroups.set(key, []);
      }
      edgeGroups.get(key)!.push(edge);
    });

    edgeGroups.forEach((group) => {
      if (group.length > 1) {
        // 按 id 排序以确保稳定顺序
        group.sort((a, b) => a.id.localeCompare(b.id));
        const total = group.length;
        group.forEach((edge, i) => {
          const multiOffset = i - (total - 1) / 2;
          edge.data = {
            ...edge.data,
            multiIndex: i + 1,
            multiTotal: total,
            multiOffset,
          };
        });
      }
    });

    // 🔍 打印去重后的结果
    console.log("[GraphVisualization] uniqueEdges after dedup:", uniqueEdges);

    let layoutedNodes = uniqueNodes
    let layoutedEdges = uniqueEdges

    if (forceLayout || initialNodes.some((n) => !n.position)) {
      const layouted = getLayoutedElements(uniqueNodes, uniqueEdges, direction)
      layoutedNodes = layouted.nodes
      layoutedEdges = layouted.edges
    }

    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [
    initialNodes,
    initialLinks,
    nodeConfigs,
    edgeConfigs,
    direction,
    forceLayout,
    getLayoutedElements,
    setNodes,
    setEdges,
  ])

  const nodeTypes: NodeTypes = useMemo(() => {
    const types: NodeTypes = {}
    Object.keys(nodeConfigs).forEach((type) => {
      types[type] = createCustomNodeComponent(nodeConfigs[type])
    })
    return types
  }, [nodeConfigs])

  const edgeTypes: EdgeTypes = useMemo(() => {
    const types: EdgeTypes = {}
    Object.keys(edgeConfigs).forEach((type) => {
      types[type] = createCustomEdgeComponent(edgeConfigs[type])
    })
    return types
  }, [edgeConfigs])

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: RFNode) => {
      nodeConfigs[node.type]?.onClick?.(node.data)
    },
    [nodeConfigs],
  )

  const handleNodeMouseEnter = useCallback(
    (event: React.MouseEvent, node: RFNode) => {
      nodeConfigs[node.type]?.onMouseEnter?.(node.data)
    },
    [nodeConfigs],
  )

  const handleNodeMouseLeave = useCallback(
    (event: React.MouseEvent, node: RFNode) => {
      nodeConfigs[node.type]?.onMouseLeave?.(node.data)
    },
    [nodeConfigs],
  )

  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: RFEdge) => {
      edgeConfigs[edge.type]?.onClick?.(edge.data)
    },
    [edgeConfigs],
  )

  const handleEdgeMouseEnter = useCallback(
    (event: React.MouseEvent, edge: RFEdge) => {
      edgeConfigs[edge.type]?.onMouseEnter?.(edge.data)
    },
    [edgeConfigs],
  )

  const handleEdgeMouseLeave = useCallback(
    (event: React.MouseEvent, edge: RFEdge) => {
      edgeConfigs[edge.type]?.onMouseLeave?.(edge.data)
    },
    [edgeConfigs],
  )

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        onEdgeClick={handleEdgeClick}
        onEdgeMouseEnter={handleEdgeMouseEnter}
        onEdgeMouseLeave={handleEdgeMouseLeave}
        fitView
      >
        <Background color="#fff" />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}

const badgeClassName = `
      absolute top-0 right-0
      translate-x-1/2 -translate-y-1/2
      w-3 h-3 rounded-full
      bg-white/20
      flex items-center justify-center
      shadow-sm pointer-events-none
    `

function createCustomNodeComponent<T>(config: NodeConfig<T>) {
  const CustomNode: React.FC<NodeProps<T>> = (props) => {
    const { data } = props
    const style: NodeStyle = config.getStyle(data)
    const label = config.getLabel(data)
    const image = config.getImage?.(data)
    const tooltip = config.getTooltip?.(data)

    const [hovered, setHovered] = React.useState(false)
    const [isSelected, setIsSelected] = React.useState(false)

    const contextMenuItems = config.onRightClick?.(data) ?? []

    // 节点图形部分大小
    const shapeWidth = style.width ?? 60
    const shapeHeight = style.height ?? 60

    // shape 类型
    const shape = style.shape ?? "square"

    // 图形实际宽高
    let actualShapeWidth = shapeWidth
    let actualShapeHeight = shapeHeight
    if (shape === "circle" || shape === "square") {
      const size = Math.min(shapeWidth, shapeHeight)
      actualShapeWidth = size
      actualShapeHeight = size
    }

    // label 高度
    const labelHeight = style.fontSize ? style.fontSize * 1.5 : 16

    // 图形样式
    const shapeStyles: React.CSSProperties = { boxSizing: "border-box" }
    if (shape === "circle") shapeStyles.borderRadius = "50%"
    else if (shape === "diamond") shapeStyles.clipPath = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
    else shapeStyles.borderRadius = "6px"

    const nodeContent = (
      <div
        className="flex flex-col items-center relative"
        style={{
          width: `${actualShapeWidth}px`, // 节点宽度只包含图形部分
          height: `${actualShapeHeight + labelHeight}px`, // 高度包含图形和标签
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setIsSelected(!isSelected)}
      >
        {/* target handle - 定位在图形部分的边缘 */}
        <Handle 
          type="target" 
          position={Position.Left} 
          style={{ 
            opacity: 0,
            top: `${actualShapeHeight / 2}px`,
            left: 0
          }} 
        />

        {/* 节点图形容器 */}
        <div
          className="relative flex items-center justify-center"
          style={{
            width: `${actualShapeWidth}px`,
            height: `${actualShapeHeight}px`,
            backgroundColor: style.color,
            borderStyle: "solid",
            borderWidth: style.borderWidth ?? 1,
            borderColor: style.borderColor ?? "#000",
            opacity: style.opacity ?? 1,
            overflow: "hidden",
            ...shapeStyles,
          }}
          title={typeof tooltip === "string" ? tooltip : undefined}
        >
          {image && (
            <motion.img
              src={image}
              alt="icon"
              initial={{ scale: 1 }}
              animate={hovered && style.hoverAnimation ? { scale: 1.2 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              style={{
                width: `${actualShapeWidth}px`,
                height: `${actualShapeHeight}px`,
                objectFit: "contain",
              }}
            />
          )}
        </div>

        {/* label - 修改为基于字符数的宽度 */}
        <div
          style={{
            width: "20ch",
            maxWidth: "20ch",
            height: `${labelHeight}px`,
            textAlign: "center",
            lineHeight: `${labelHeight}px`,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: style.textColor ?? "#000",
            fontSize: `${style.fontSize ?? 12}px`,
            marginTop: "4px", // 添加一点间距
          }}
        >
          {label}
        </div>

        {/* Badge（挂在外层，不会被 overflow 裁掉） */}
        {isSelected && (
          <div className={badgeClassName}>
            <Check className="w-2 h-2 text-green-600" />
          </div>
        )}

        {/* source handle - 定位在图形部分的边缘 */}
        <Handle 
          type="source" 
          position={Position.Right} 
          style={{ 
            opacity: 0,
            top: `${actualShapeHeight / 2}px`,
            right: 0
          }} 
        />
      </div>
    )

    if (contextMenuItems.length > 0) {
      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>{nodeContent}</ContextMenuTrigger>
          <ContextMenuContent>
            {contextMenuItems.map((item: ContextMenuItem, index: number) => {
              if (item.type === "separator") {
                return <ContextMenuSeparator key={index} className="bg-gray-200" />
              }
              return (
                <ShadcnContextMenuItem
                  key={index}
                  onClick={item.action}
                  className={item.className || "flex items-center gap-2"}
                >
                  {item.label}
                </ShadcnContextMenuItem>
              )
            })}
          </ContextMenuContent>
        </ContextMenu>
      )
    }

    return nodeContent
  }

  return CustomNode
}

function createCustomEdgeComponent<T>(config: LinkConfig<T>) {
  const CustomEdge: React.FC<EdgeProps> = (props) => {
    const {
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      id,
      style: edgeStyle,
      source,
      target,
    } = props

    const data = props.data as T & { multiIndex?: number; multiTotal?: number; multiOffset?: number }
    const linkStyle: LinkStyle = config.getStyle(data)
    const label = config.getLabel?.(data)

    // 检查是否是自环边（节点指向自己）
    const isSelfLoop = source === target

    // 根据 curve 类型选择不同的 path 生成函数
    let getPathFunction = getBezierPath
    if (linkStyle.curve === "straight") getPathFunction = getStraightPath
    else if (linkStyle.curve === "step") getPathFunction = getSmoothStepPath

    // 对于自环边，使用自定义路径生成函数
    let edgePath: string
    let labelX: number
    let labelY: number

    if (isSelfLoop) {
      [edgePath, labelX, labelY] = getSelfLoopPath({ sourceX, sourceY, sourcePosition })
    } else if (data?.multiTotal && data.multiTotal > 1 && getPathFunction === getBezierPath) {
      // 动态调整多重边的曲率（平行曲线）
      const deltaX = targetX - sourceX
      const deltaY = targetY - sourceY
      const dist = Math.sqrt(deltaX ** 2 + deltaY ** 2) || 1
      let perpX = -deltaY / dist
      let perpY = deltaX / dist
      const multiOffset = data.multiOffset ?? 0

      // 用于控制调整线间距
      const spacing = dist * 0.10
      const offsetAmount = multiOffset * spacing

      const curvature = 0.25
      const minDimension = Math.min(Math.abs(deltaX), Math.abs(deltaY))
      let c = minDimension * curvature
      const minC = dist * 0.15

      c = Math.max(c, minC)

      const sourceControl = getControlWithCurvature({
        pos: sourcePosition,
        x1: sourceX,
        y1: sourceY,
        x2: targetX,
        y2: targetY,
        c,
      })
      const targetControl = getControlWithCurvature({
        pos: targetPosition,
        x1: targetX,
        y1: targetY,
        x2: sourceX,
        y2: sourceY,
        c,
      })

      let [cx1, cy1] = sourceControl
      let [cx2, cy2] = targetControl

      cx1 += perpX * offsetAmount
      cy1 += perpY * offsetAmount
      cx2 += perpX * offsetAmount
      cy2 += perpY * offsetAmount

      edgePath = `M${sourceX},${sourceY} C${cx1},${cy1} ${cx2},${cy2} ${targetX},${targetY}`

      labelX = (sourceX + cx1 + cx2 + targetX) / 4 + perpX * offsetAmount
      labelY = (sourceY + cy1 + cy2 + targetY) / 4 + perpY * offsetAmount
    } else {
      [edgePath, labelX, labelY] = getPathFunction({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      })
    }

    const [hovered, setHovered] = React.useState(false)

    // 给 marker 一个唯一 id，避免冲突
    const markerId = `arrow-${id}`

    const strokeWidth = linkStyle.width ?? 2
    const defaultDash = [strokeWidth * 8, strokeWidth * 4]
    const dashArray = linkStyle.dash ?? (hovered ? defaultDash : null)
    const strokeDasharray = dashArray ? dashArray.join(",") : undefined
    const dashPeriod = dashArray ? dashArray.reduce((a, b) => a + b, 0) : 0
    const isAnimated = hovered && !!dashArray

    // 修复：确保路径颜色正确设置
    const strokeColor = linkStyle.color || "#3366ff"

    // 修复：确保标记颜色与线条颜色一致
    const markerColor = linkStyle.markerEnd?.color || strokeColor

    const basePathProps = {
      id,
      className: "react-flow__edge-path",
      d: edgePath,
      style: {
        ...edgeStyle,
        stroke: strokeColor,
        strokeWidth,
        strokeDasharray,
        opacity: linkStyle.opacity ?? 1,
        fill: "none",
      },
      markerEnd: linkStyle.markerEnd ? `url(#${markerId})` : undefined,
    }

    const edgeElement = isAnimated ? (
      <motion.path
        {...basePathProps}
        initial={{ strokeDashoffset: dashPeriod }}
        animate={{ strokeDashoffset: 0 }}
        transition={{
          duration: 1,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
          repeatType: "loop",
        }}
        onAnimationStart={() => {
          basePathProps.style.opacity = 1
        }}
      />
    ) : (
      <path {...basePathProps} />
    )

    return (
      <>
        <defs>
          {linkStyle.markerEnd && (
            <marker
              id={markerId}
              viewBox="0 -5 10 10"
              refX={isSelfLoop ? 5 : 10} // 自环边调整箭头位置
              refY={0}
              markerWidth={linkStyle.markerEnd.width ?? 8}
              markerHeight={linkStyle.markerEnd.height ?? 8}
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,-5L10,0L0,5" fill={markerColor} stroke="none" />
            </marker>
          )}
        </defs>

        {/* 修复：增加悬停检测区域透明度，但保持足够大以便检测 */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={25}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          pointerEvents="stroke"
          style={{ opacity: 0.1 }}
        />

        {edgeElement}

        {label && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                background: "#fff",   // background: "transparent", 透明
                padding: 5,
                borderRadius: 5,
                fontSize: linkStyle.fontSize ?? 12,
                color: linkStyle.textColor ?? "#000",
                textShadow: "0 0 2px #fff, 0 0 2px #fff",
                pointerEvents: "all",
              }}
              className="nodrag nopan"
            >
              {label}
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    )
  }
  return CustomEdge
}

// 自环边路径生成函数
function getSelfLoopPath({ sourceX, sourceY, sourcePosition }) {
  const loopRadius = 50 // 自环半径
  const loopHeight = 70 // 自环高度

  // 根据源节点位置调整自环方向
  let controlX, controlY, endX, endY

  switch (sourcePosition) {
    case "left":
      controlX = sourceX - loopRadius
      controlY = sourceY - loopHeight
      endX = sourceX
      endY = sourceY - loopHeight / 2
      break
    case "right":
      controlX = sourceX + loopRadius
      controlY = sourceY - loopHeight
      endX = sourceX
      endY = sourceY - loopHeight / 2
      break
    case "top":
      controlX = sourceX + loopHeight
      controlY = sourceY - loopRadius
      endX = sourceX + loopHeight / 2
      endY = sourceY
      break
    case "bottom":
      controlX = sourceX - loopHeight
      controlY = sourceY + loopRadius
      endX = sourceX - loopHeight / 2
      endY = sourceY
      break
    default:
      controlX = sourceX + loopRadius
      controlY = sourceY - loopHeight
      endX = sourceX
      endY = sourceY - loopHeight / 2
  }

  // 创建自环路径
  const path = `M ${sourceX},${sourceY} Q ${controlX},${controlY} ${endX},${endY} T ${sourceX},${sourceY}`

  // 计算标签位置
  const labelX = (sourceX + controlX + endX) / 3
  const labelY = (sourceY + controlY + endY) / 3

  return [path, labelX, labelY]
}

function getControlWithCurvature({ pos, x1, y1, x2, y2, c }: { pos: Position, x1: number, y1: number, x2: number, y2: number, c: number }) {
  switch (pos) {
    case Position.Left:
      return [x1 - c, y1]
    case Position.Right:
      return [x1 + c, y1]
    case Position.Top:
      return [x1, y1 - c]
    case Position.Bottom:
      return [x1, y1 + c]
    default:
      return [x1, y1]
  }
}

export default GraphVisualization