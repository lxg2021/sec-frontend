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

  // 获取节点的父节点ID
  const getParentId = useCallback(
    (nodeId) => {
      const findParent = (nodes, targetId, parentId = null) => {
        for (const node of nodes) {
          if (node.id === targetId) return parentId
          if (node.children) {
            const found = findParent(node.children, targetId, node.id)
            if (found !== null) return found
          }
        }
        return null
      }

      return findParent(initialData, nodeId)
    },
    [initialData],
  )

  // 更新父节点状态
  const updateParentStates = useCallback(
    (newSelectedIds) => {
      const updatedIds = new Set(newSelectedIds)

      // 递归更新所有父节点的状态
      const updateParent = (nodeId) => {
        const parentId = getParentId(nodeId)
        if (!parentId) return

        const directChildrenIds = getDirectChildrenIds(parentId)
        const selectedChildrenCount = directChildrenIds.filter((id) => updatedIds.has(id)).length

        if (selectedChildrenCount === directChildrenIds.length && directChildrenIds.length > 0) {
          // 所有子节点都选中，父节点也选中
          updatedIds.add(parentId)
        } else if (selectedChildrenCount === 0) {
          // 没有子节点选中，父节点取消选中
          updatedIds.delete(parentId)
        } else {
          // 部分子节点选中，父节点取消选中（但会在UI中显示为indeterminate）
          updatedIds.delete(parentId)
        }

        // 递归更新上级父节点
        updateParent(parentId)
      }

      // 获取所有需要更新的节点
      const allNodeIds = new Set()
      const collectAllNodeIds = (nodes) => {
        nodes.forEach((node) => {
          allNodeIds.add(node.id)
          if (node.children) {
            collectAllNodeIds(node.children)
          }
        })
      }
      collectAllNodeIds(initialData)

      // 为每个节点更新其父节点状态
      allNodeIds.forEach((nodeId) => {
        updateParent(nodeId)
      })

      return updatedIds
    },
    [getParentId, getDirectChildrenIds],
  )

  // 选择节点
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

        // 更新父节点状态
        return updateParentStates(newSet)
      })
    },
    [getAllChildrenIds, updateParentStates],
  )

  // 计算节点的选择状态
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

      const selectedChildrenCount = directChildrenIds.filter((id) => {
        // 检查直接子节点的状态
        const childState = getNodeSelectionState(id)
        return childState === "checked" || childState === "indeterminate"
      }).length

      if (selectedChildrenCount === 0) {
        return "unchecked"
      } else if (selectedChildrenCount === directChildrenIds.length) {
        // 所有子节点都选中或处于中间态，检查是否真的全部选中
        const allChildrenSelected = directChildrenIds.every((id) => selectedIds.has(id))
        return allChildrenSelected ? "checked" : "indeterminate"
      } else {
        return "indeterminate"
      }
    },
    [selectedIds, getDirectChildrenIds],
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

  // 展开所有匹配的节点路径
  const expandMatchingPaths = useCallback(
    (matchingIds) => {
      const newExpandedIds = new Set(expandedIds)

      const expandPath = (nodes, targetIds) => {
        for (const node of nodes) {
          if (targetIds.has(node.id)) {
            newExpandedIds.add(node.id)
            return true
          }

          if (node.children && expandPath(node.children, targetIds)) {
            newExpandedIds.add(node.id)
          }
        }
        return false
      }

      expandPath(initialData, matchingIds)
      setExpandedIds(newExpandedIds)
    },
    [initialData, expandedIds],
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
