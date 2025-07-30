"use client"

import { memo, useMemo } from "react"
import { FixedSizeList as List } from "react-window"
import { TreeNodeWithState } from "./TreeNodeWithState"

const TreeItem = memo(function TreeItem({ index, style, data }) {
  const { nodes, selectedIds, onToggleExpanded, onToggleSelected, getNodeSelectionState } = data
  const node = nodes[index]

  if (!node) return null

  // 获取节点的选择状态
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
