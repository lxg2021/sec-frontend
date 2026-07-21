"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"

function collectExpandedIdsByDepth(nodes, maxDepth, level = 0) {
  const ids = []

  nodes.forEach((node) => {
    if (level < maxDepth && node.children?.length) {
      ids.push(node.id)
      ids.push(...collectExpandedIdsByDepth(node.children, maxDepth, level + 1))
    }
  })

  return ids
}

export function useTreeData(initialData) {
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [selectedIds, setSelectedIds] = useState(new Set())
  const initializedExpandedRef = useRef(false)

  useEffect(() => {
    if (initializedExpandedRef.current || initialData.length === 0) {
      return
    }

    setExpandedIds(new Set(collectExpandedIdsByDepth(initialData, 2)))
    initializedExpandedRef.current = true
  }, [initialData])

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

        if (isExpanded && node.children) {
          result.push(...flattenTree(node.children, level + 1, path))
        }
      })

      return result
    },
    [expandedIds],
  )

  const flatNodes = useMemo(() => {
    return flattenTree(initialData)
  }, [initialData, flattenTree])

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

  const getNodeSelectionState = useCallback(
    (nodeId) => {
      if (selectedIds.has(nodeId)) {
        return "checked"
      }

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

  const toggleSelected = useCallback(
    (nodeId) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev)

        if (newSet.has(nodeId)) {
          newSet.delete(nodeId)
          const childrenIds = getAllChildrenIds(nodeId)
          childrenIds.forEach((id) => newSet.delete(id))
        } else {
          newSet.add(nodeId)
          const childrenIds = getAllChildrenIds(nodeId)
          childrenIds.forEach((id) => newSet.add(id))
        }

        return newSet
      })
    },
    [getAllChildrenIds],
  )

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

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const expandMatchingPaths = useCallback(
    (matchingIds) => {
      setExpandedIds((prev) => {
        const newExpandedIds = new Set(prev)

        const expandNodePath = (nodeId) => {
          const findNodeAndPath = (nodes, targetId, path = []) => {
            for (const node of nodes) {
              const currentPath = [...path, node.id]

              if (node.id === targetId) {
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
