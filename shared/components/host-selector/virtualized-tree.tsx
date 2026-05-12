"use client"

import { memo, useMemo } from "react"
import { FixedSizeList as List } from "react-window"

import { TreeNodeWithState } from "./tree-node-with-state"

const TreeItem = memo(function TreeItem({
  index,
  style,
  data,
}: {
  index: number
  style: React.CSSProperties
  data: any
}) {
  const { nodes, selectedIds, onToggleExpanded, onToggleSelected, getNodeSelectionState } = data
  const node = nodes[index]

  if (!node) return null

  const selectionState = getNodeSelectionState(node.id)
  const isSelected = selectedIds.has(node.id)

  return (
    <div style={style}>
      <TreeNodeWithState
        node={node}
        isSelected={isSelected}
        checkboxState={selectionState}
        onToggleExpanded={onToggleExpanded}
        onToggleSelected={onToggleSelected}
      />
    </div>
  )
})

export const VirtualizedTree = memo(function VirtualizedTree({
  nodes,
  selectedIds,
  onToggleExpanded,
  onToggleSelected,
  getNodeSelectionState,
  height,
  itemHeight,
}: {
  nodes: any[]
  selectedIds: Set<string>
  onToggleExpanded: (nodeId: string) => void
  onToggleSelected: (nodeId: string, node: any) => void
  getNodeSelectionState: (nodeId: string) => "checked" | "unchecked" | "indeterminate"
  height: number
  itemHeight: number
}) {
  const itemData = useMemo(
    () => ({
      nodes,
      selectedIds,
      onToggleExpanded,
      onToggleSelected,
      getNodeSelectionState,
    }),
    [nodes, selectedIds, onToggleExpanded, onToggleSelected, getNodeSelectionState],
  )

  return (
    <List height={height} itemCount={nodes.length} itemSize={itemHeight} itemData={itemData} overscanCount={5}>
      {TreeItem}
    </List>
  )
})
