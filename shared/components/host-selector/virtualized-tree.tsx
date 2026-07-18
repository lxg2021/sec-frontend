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
  const { nodes, selectedIds, onToggleExpanded, onToggleSelected, getNodeSelectionState, compactHostRows } = data
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
        compactHostRows={compactHostRows}
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
  compactHostRows = false,
}: {
  nodes: any[]
  selectedIds: Set<string>
  onToggleExpanded: (nodeId: string) => void
  onToggleSelected: (nodeId: string, node: any) => void
  getNodeSelectionState: (nodeId: string) => "checked" | "unchecked" | "indeterminate"
  height: number
  itemHeight: number
  compactHostRows?: boolean
}) {
  const itemData = useMemo(
    () => ({
      nodes,
      selectedIds,
      onToggleExpanded,
      onToggleSelected,
      getNodeSelectionState,
      compactHostRows,
    }),
    [nodes, selectedIds, onToggleExpanded, onToggleSelected, getNodeSelectionState, compactHostRows],
  )

  return (
    <List height={height} itemCount={nodes.length} itemSize={itemHeight} itemData={itemData} overscanCount={5}>
      {TreeItem}
    </List>
  )
})
