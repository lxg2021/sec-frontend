"use client"

// GraphVisualization.tsx (完整修复版)
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
      dagreGraph.setNode(node.id, {
        width: node.width ?? defaultNodeWidth,
        height: node.height ?? defaultNodeHeight,
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
      node.position = {
        x: nodeWithPosition.x - (node.width ?? defaultNodeWidth) / 2,
        y: nodeWithPosition.y - (node.height ?? defaultNodeHeight) / 2,
      }
    })

    return { nodes: rfNodes, edges: rfEdges }
  }, [])

  useEffect(() => {
    const rfNodes: RFNode[] = initialNodes.map((node) => {
      const config = nodeConfigs[node.type]
      const style = config.getStyle(node.data)

      return {
        id: node.id,
        type: node.type,
        data: node.data,
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

    // 关键：去重 + 自动加后缀
    const uniqueNodes = ensureUniqueItems(rfNodes)
    const uniqueEdges = ensureUniqueItems(rfEdges)

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
        <Background color="transparent" />
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

    // 节点大小
    const width = style.width ?? 60
    const height = style.height ?? 60

    // shape 类型
    const shape = style.shape ?? "square"

    // 图形实际宽高
    let shapeWidth = width
    let shapeHeight = height
    if (shape === "circle" || shape === "square") {
      const size = Math.min(width, height)
      shapeWidth = size
      shapeHeight = size
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
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setIsSelected(!isSelected)}
      >
        {/* target handle */}
        <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />

        {/* 节点图形容器 */}
        <div
          className="relative flex items-center justify-center"
          style={{
            width: `${shapeWidth}px`,
            height: `${shapeHeight}px`,
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
                width: `${shapeWidth}px`,
                height: `${shapeHeight}px`,
                objectFit: "contain",
              }}
            />
          )}
        </div>

        {/* label */}
        <div
          style={{
            width: `${shapeWidth * 1.2}px`,
            maxWidth: `${shapeWidth * 1.2}px`,
            height: `${labelHeight}px`,
            textAlign: "center",
            lineHeight: `${labelHeight}px`,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: style.textColor ?? "#000",
            fontSize: `${style.fontSize ?? 12}px`,
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

        {/* source handle */}
        <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
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
                <ShadcnContextMenuItem key={index} onClick={item.action} className="flex items-center gap-2">
                  {item.icon}
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

    const data = props.data as T
    const linkStyle: LinkStyle = config.getStyle(data)
    const label = config.getLabel?.(data)

    // 检查是否是自环边（节点指向自己）
    const isSelfLoop = source === target

    // 根据 curve 类型选择不同的 path 生成函数
    let getPathFunction = getBezierPath
    if (linkStyle.curve === "straight") getPathFunction = getStraightPath
    else if (linkStyle.curve === "step") getPathFunction = getSmoothStepPath

    // 对于自环边，使用自定义路径生成函数
    const [edgePath, labelX, labelY] = isSelfLoop
      ? getSelfLoopPath({ sourceX, sourceY, sourcePosition })
      : getPathFunction({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        })

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
                background: "#fff",
                padding: 5,
                borderRadius: 5,
                fontSize: linkStyle.fontSize ?? 12,
                color: linkStyle.textColor ?? "#000",
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

export default GraphVisualization
