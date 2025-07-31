"use client"

import { useState, useMemo, useCallback } from "react"

export function useTreeData(initialData) {
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [selectedIds, setSelectedIds] = useState(new Set())

  // 扁平化树形数据
  const flattenTree = useCallback(
    (nodes, level = 0, parentPath = []) => {
      const result = []

      nodes.forEach((node, index) => {
        const path = [...parentPath, node.name]
        const hasChildren = Boolean(node.children && node.children.length > 0)
        const isExpanded = expandedIds.has(node.id)
        const isLastChild = index === nodes.length - 1

        result.push({
          ...node,
          level,
          hasChildren,
          isLastChild,
          path,
          isExpanded,
        })

        // 如果节点展开且有子节点，递归添加子节点
        if (isExpanded && node.children) {
          result.push(...flattenTree(node.children, level + 1, path))
        }
      })

      return result
    },
    [expandedIds],
  )

  // 获取扁平化的可见节点
  const flatNodes = useMemo(() => {
    return flattenTree(initialData)
  }, [initialData, flattenTree])

  // 切换节点展开状态
  const toggleExpanded = useCallback((nodeId) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }, [])

  // 获取节点的所有子节点ID
  const getAllChildrenIds = useCallback(
    (nodeId) => {
      const findNodeInData = (nodes, targetId) => {
        for (const node of nodes) {
          if (node.id === targetId) return node
          if (node.children) {
            const found = findNodeInData(node.children, targetId)
            if (found) return found
          }
        }
        return null
      }

      const collectChildrenIds = (node) => {
        const ids = []
        if (node.children) {
          node.children.forEach((child) => {
            ids.push(child.id)
            ids.push(...collectChildrenIds(child))
          })
        }
        return ids
      }

      const node = findNodeInData(initialData, nodeId)
      return node ? collectChildrenIds(node) : []
    },
    [initialData],
  )

  // 获取节点的直接子节点ID
  const getDirectChildrenIds = useCallback(
    (nodeId) => {
      const findNodeInData = (nodes, targetId) => {
        for (const node of nodes) {
          if (node.id === targetId) return node
          if (node.children) {
            const found = findNodeInData(node.children, targetId)
            if (found) return found
          }
        }
        return null
      }

      const node = findNodeInData(initialData, nodeId)
      return node?.children?.map((child) => child.id) || []
    },
    [initialData],
  )

  // 计算节点的选择状态 - 使用 memo 缓存结果
  const getNodeSelectionState = useCallback(
    (nodeId) => {
      if (selectedIds.has(nodeId)) {
        return "checked"
      }

      // 检查是否有子节点被选中
      const directChildrenIds = getDirectChildrenIds(nodeId)
      if (directChildrenIds.length === 0) {
        return "unchecked"
      }

      const selectedChildrenCount = directChildrenIds.filter((id) => selectedIds.has(id)).length

      if (selectedChildrenCount === 0) {
        return "unchecked"
      } else if (selectedChildrenCount === directChildrenIds.length) {
        return "checked"
      } else {
        return "indeterminate"
      }
    },
    [selectedIds, getDirectChildrenIds],
  )

  // 选择节点 - 简化逻辑，避免复杂的父节点状态更新
  const toggleSelected = useCallback(
    (nodeId, node) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev)

        if (newSet.has(nodeId)) {
          // 取消选择：移除当前节点和所有子节点
          newSet.delete(nodeId)
          const childrenIds = getAllChildrenIds(nodeId)
          childrenIds.forEach((id) => newSet.delete(id))
        } else {
          // 选择：添加当前节点和所有子节点
          newSet.add(nodeId)
          const childrenIds = getAllChildrenIds(nodeId)
          childrenIds.forEach((id) => newSet.add(id))
        }

        return newSet
      })
    },
    [getAllChildrenIds],
  )

  // 全选
  const selectAll = useCallback(() => {
    const getAllNodeIds = (nodes) => {
      const ids = []
      nodes.forEach((node) => {
        ids.push(node.id)
        if (node.children) {
          ids.push(...getAllNodeIds(node.children))
        }
      })
      return ids
    }

    const allNodeIds = getAllNodeIds(initialData)
    setSelectedIds(new Set(allNodeIds))
  }, [initialData])

  // 清空选择
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // 展开所有匹配的节点路径 - 修复展开逻辑
  const expandMatchingPaths = useCallback(
    (matchingIds) => {
      setExpandedIds((prev) => {
        const newExpandedIds = new Set(prev)

        // 为每个匹配的节点找到并展开其完整的父节点路径
        const expandNodePath = (nodeId) => {
          const findNodeAndPath = (nodes, targetId, path = []) => {
            for (const node of nodes) {
              const currentPath = [...path, node.id]

              if (node.id === targetId) {
                // 找到目标节点，展开路径中的所有父节点（不包括自己）
                path.forEach((parentId) => {
                  newExpandedIds.add(parentId)
                })
                return true
              }

              if (node.children && findNodeAndPath(node.children, targetId, currentPath)) {
                return true
              }
            }
            return false
          }

          findNodeAndPath(initialData, nodeId)
        }

        // 为所有匹配的节点展开路径
        matchingIds.forEach((nodeId) => {
          expandNodePath(nodeId)
        })

        return newExpandedIds
      })
    },
    [initialData],
  )

  return {
    flatNodes,
    selectedIds,
    expandedIds,
    toggleExpanded,
    toggleSelected,
    selectAll,
    clearSelection,
    expandMatchingPaths,
    getNodeSelectionState,
  }
}
