"use client"

import { memo, useMemo } from "react"
import { FixedSizeList as List } from "react-window"

import { TreeNodeWithState } from "./tree-node-with-state"
import type { HostSelectorFlatNode, HostSelectorSelectionState } from "./types"

interface TreeItemData {
  nodes: HostSelectorFlatNode[]
  onToggleExpanded: (nodeId: string) => void
  onToggleSelected: (nodeId: string, node: HostSelectorFlatNode) => void
  getNodeSelectionState: (nodeId: string) => HostSelectorSelectionState
  compactHostRows: boolean
}

const TreeItem = memo(function TreeItem({
  index,
  style,
  data,
}: {
  index: number
  style: React.CSSProperties
  data: TreeItemData
}) {
  const { nodes, onToggleExpanded, onToggleSelected, getNodeSelectionState, compactHostRows } = data
  const node = nodes[index]

  if (!node) return null

  const selectionState = getNodeSelectionState(node.id)

  return (
    <div style={style}>
      <TreeNodeWithState
        node={node}
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
  onToggleExpanded,
  onToggleSelected,
  getNodeSelectionState,
  height,
  itemHeight,
  compactHostRows = false,
}: {
  nodes: HostSelectorFlatNode[]
  onToggleExpanded: (nodeId: string) => void
  onToggleSelected: (nodeId: string, node: HostSelectorFlatNode) => void
  getNodeSelectionState: (nodeId: string) => HostSelectorSelectionState
  height: number
  itemHeight: number
  compactHostRows?: boolean
}) {
  const itemData = useMemo(
    () => ({
      nodes,
      onToggleExpanded,
      onToggleSelected,
      getNodeSelectionState,
      compactHostRows,
    }),
    [nodes, onToggleExpanded, onToggleSelected, getNodeSelectionState, compactHostRows],
  )

  return (
    <List
      width="100%"
      height={height}
      itemCount={nodes.length}
      itemSize={itemHeight}
      itemData={itemData}
      overscanCount={5}
    >
      {TreeItem}
    </List>
  )
})
