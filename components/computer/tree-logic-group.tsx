"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Building2,
  Briefcase,
  Users,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Save,
  Search,
  X,
  Check,
} from "lucide-react"
import type { UserLogicGroup } from "@/lib/computer/ui-asset-data"
import type { TableLogicGroup } from "@/lib/computer/table"
import { convertToTableLogicGroups, validateUserLogicGroups } from "@/lib/computer/utils/logic-group-converter"

export interface TreeLogicGroupProps {
  /** 输入的用户逻辑组数据 */
  groups: UserLogicGroup[]
  /** 保存回调，返回转换后的TableLogicGroup数据 */
  onSave?: (tableGroups: TableLogicGroup[]) => void
  /** 是否禁用编辑 */
  disabled?: boolean
  /** 是否只读模式 */
  readOnly?: boolean
  /** 租户ID */
  tenantId?: string
  /** 创建者ID */
  createdBy?: string
}

interface TreeNodeState {
  expanded: Record<string, boolean>
  selected: string | null
  editing: string | null
  editValue: string
}

export function TreeLogicGroup({
  groups: initialGroups,
  onSave,
  disabled = false,
  readOnly = false,
  tenantId,
  createdBy = "system",
}: TreeLogicGroupProps) {
  const { toast } = useToast()
  const [groups, setGroups] = useState<UserLogicGroup[]>(initialGroups)
  const [nodeState, setNodeState] = useState<TreeNodeState>({
    expanded: {},
    selected: null,
    editing: null,
    editValue: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // 搜索匹配的节点
  const matchedNodes = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>()
    const matches = new Set<string>()

    function searchInGroup(group: UserLogicGroup) {
      if (group.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        matches.add(group.id)
      }
      group.children?.forEach(searchInGroup)
    }

    groups.forEach(searchInGroup)
    return matches
  }, [groups, searchQuery])

  const checkDuplicateName = (
    name: string,
    parentId: string | undefined,
    excludeId?: string,
  ): { isDuplicate: boolean; message: string } => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return { isDuplicate: true, message: "名称不能为空" }
    }

    // 检查根级别（公司）
    if (!parentId) {
      const duplicate = groups.find((g) => g.id !== excludeId && g.name === trimmedName)
      if (duplicate) {
        return { isDuplicate: true, message: `公司名称"${trimmedName}"已存在` }
      }
      return { isDuplicate: false, message: "" }
    }

    // 检查子级别（部门或组）
    const findParentAndCheckChildren = (nodes: UserLogicGroup[]): boolean => {
      for (const node of nodes) {
        if (node.id === parentId) {
          const duplicate = node.children?.find((child) => child.id !== excludeId && child.name === trimmedName)
          if (duplicate) {
            const parentType = node.type === "company" ? "公司" : "部门"
            const childType = duplicate.type === "department" ? "部门" : "组"
            return true
          }
          return false
        }
        if (node.children && findParentAndCheckChildren(node.children)) {
          return true
        }
      }
      return false
    }

    const hasDuplicate = findParentAndCheckChildren(groups)
    if (hasDuplicate) {
      return { isDuplicate: true, message: `同级别下已存在名称"${trimmedName}"` }
    }

    return { isDuplicate: false, message: "" }
  }

  // 切换展开/折叠
  const toggleExpand = (id: string) => {
    setNodeState((prev) => ({
      ...prev,
      expanded: {
        ...prev.expanded,
        [id]: !prev.expanded[id],
      },
    }))
  }

  // 选中节点
  const selectNode = (id: string) => {
    setNodeState((prev) => ({
      ...prev,
      selected: prev.selected === id ? null : id,
    }))
  }

  // 开始编辑
  const startEdit = (id: string, currentName: string) => {
    if (readOnly || disabled) return
    setNodeState((prev) => ({
      ...prev,
      editing: id,
      editValue: currentName,
    }))
  }

  // 取消编辑
  const cancelEdit = () => {
    setNodeState((prev) => ({
      ...prev,
      editing: null,
      editValue: "",
    }))
  }

  // 保存编辑
  const saveEdit = () => {
    if (!nodeState.editing || !nodeState.editValue.trim()) return

    // 查找当前节点的parentId
    let currentParentId: string | undefined
    const findParentId = (nodes: UserLogicGroup[], targetId: string, parentId?: string): string | undefined => {
      for (const node of nodes) {
        if (node.id === targetId) {
          return parentId
        }
        if (node.children) {
          const found = findParentId(node.children, targetId, node.id)
          if (found !== undefined) return found
        }
      }
      return undefined
    }
    currentParentId = findParentId(groups, nodeState.editing)

    const validation = checkDuplicateName(nodeState.editValue, currentParentId, nodeState.editing)
    if (validation.isDuplicate) {
      toast({
        title: "名称重复",
        description: validation.message,
        duration: 2000,
        className: "bg-black text-white border-none",
      })
      return
    }

    const updateNode = (nodes: UserLogicGroup[]): UserLogicGroup[] => {
      return nodes.map((node) => {
        if (node.id === nodeState.editing) {
          const newPath = node.path.split("/")
          newPath[newPath.length - 1] = nodeState.editValue.trim()
          return {
            ...node,
            name: nodeState.editValue.trim(),
            path: newPath.join("/"),
          }
        }
        if (node.children) {
          return {
            ...node,
            children: updateNode(node.children),
          }
        }
        return node
      })
    }

    setGroups(updateNode(groups))
    setValidationErrors([])
    cancelEdit()
  }

  // 添加子节点
  const addChild = (parentId: string) => {
    if (readOnly || disabled) return

    // 查找父节点，自动推断子节点类型
    let childType: "department" | "group" = "group"
    const findParentType = (nodes: UserLogicGroup[]): "company" | "department" | "group" | null => {
      for (const node of nodes) {
        if (node.id === parentId) {
          return node.type
        }
        if (node.children) {
          const found = findParentType(node.children)
          if (found) return found
        }
      }
      return null
    }

    const parentType = findParentType(groups)
    if (parentType === "company") {
      childType = "department"
    } else if (parentType === "department") {
      childType = "group"
    }

    const newName = `新${childType === "department" ? "部门" : "组"}`

    const validation = checkDuplicateName(newName, parentId)
    if (validation.isDuplicate) {
      toast({
        title: "名称重复",
        description: validation.message,
        duration: 2000,
        className: "bg-black text-white border-none",
      })
      return
    }

    const newNode: UserLogicGroup = {
      id: `new-${Date.now()}`,
      name: newName,
      path: "",
      type: childType,
      parentId,
    }

    const addToNode = (nodes: UserLogicGroup[]): UserLogicGroup[] => {
      return nodes.map((node) => {
        if (node.id === parentId) {
          const children = node.children || []
          newNode.path = `${node.path}/${newNode.name}`
          return {
            ...node,
            children: [...children, newNode],
          }
        }
        if (node.children) {
          return {
            ...node,
            children: addToNode(node.children),
          }
        }
        return node
      })
    }

    setGroups(addToNode(groups))
    setValidationErrors([])
    setNodeState((prev) => ({
      ...prev,
      expanded: { ...prev.expanded, [parentId]: true },
    }))
  }

  // 添加根节点
  const addRootNode = () => {
    if (readOnly || disabled) return

    const newName = "新公司"

    const validation = checkDuplicateName(newName, undefined)
    if (validation.isDuplicate) {
      toast({
        title: "名称重复",
        description: validation.message,
        duration: 2000,
        className: "bg-black text-white border-none",
      })
      return
    }

    const newNode: UserLogicGroup = {
      id: `company-${Date.now()}`,
      name: newName,
      path: newName,
      type: "company",
    }

    setGroups([...groups, newNode])
    setValidationErrors([])
  }

  // 删除节点
  const confirmDelete = (id: string) => {
    setNodeToDelete(id)
    setDeleteDialogOpen(true)
  }

  const deleteNode = () => {
    if (!nodeToDelete) return

    const removeNode = (nodes: UserLogicGroup[]): UserLogicGroup[] => {
      return nodes.filter((node) => {
        if (node.id === nodeToDelete) return false
        if (node.children) {
          node.children = removeNode(node.children)
        }
        return true
      })
    }

    setGroups(removeNode(groups))
    setDeleteDialogOpen(false)
    setNodeToDelete(null)
  }

  // 保存并转换
  const handleSave = () => {
    // 验证数据
    const errors = validateUserLogicGroups(groups)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    // 转换为TableLogicGroup
    const tableGroups = convertToTableLogicGroups(groups, tenantId, createdBy)
    console.log("[v0] 转换后的TableLogicGroup数据:", tableGroups)

    // 调用回调
    onSave?.(tableGroups)
    setValidationErrors([])
  }

  // 渲染树节点
  const renderNode = (node: UserLogicGroup, level = 0) => {
    const isExpanded = nodeState.expanded[node.id]
    const isSelected = nodeState.selected === node.id
    const isEditing = nodeState.editing === node.id
    const isMatched = matchedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0

    const getIcon = () => {
      if (node.type === "company") return <Building2 className="h-4 w-4 text-blue-600" />
      if (node.type === "department") return <Briefcase className="h-4 w-4 text-green-600" />
      return <Users className="h-4 w-4 text-purple-600" />
    }

    const getTypeLabel = () => {
      if (node.type === "company") return "公司"
      if (node.type === "department") return "部门"
      return "组"
    }

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={`flex items-center gap-2 p-2 rounded-md transition-colors ${isSelected ? "bg-primary/10 border border-primary" : "hover:bg-muted"
            } ${isMatched ? "ring-2 ring-yellow-400" : ""} ${level > 0 ? "ml-6" : ""}`}
          onClick={() => selectNode(node.id)}
        >
          {/* 展开/折叠按钮 */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(node.id)
              }}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
          {!hasChildren && <div className="w-6" />}

          {/* 图标 */}
          {getIcon()}

          {/* 名称或编辑框 */}
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
              <Input
                value={nodeState.editValue}
                onChange={(e) => setNodeState((prev) => ({ ...prev, editValue: e.target.value }))}
                className="h-8"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit()
                  if (e.key === "Escape") cancelEdit()
                }}
              />
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={saveEdit}>
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={cancelEdit}>
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ) : (
            <>
              <span className="font-medium flex-1">{node.name}</span>
              <Badge variant="outline" className="text-xs">
                {getTypeLabel()}
              </Badge>

              {/* 操作按钮 */}
              {!readOnly && !disabled && (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {node.type !== "group" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => addChild(node.id)}
                      title={node.type === "company" ? "添加部门" : "添加组"}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => startEdit(node.id, node.name)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => confirmDelete(node.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* 子节点 */}
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-border ml-3 pl-2">
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>组织结构树</CardTitle>
              <CardDescription>
                {readOnly ? "查看组织结构" : "编辑组织结构（支持新增、编辑、删除节点）"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!readOnly && !disabled && (
                <Button onClick={addRootNode} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  添加公司
                </Button>
              )}
              {!readOnly && (
                <Button onClick={handleSave} size="sm" variant="default">
                  <Save className="h-4 w-4 mr-2" />
                  保存
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索节点名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 验证错误 */}
          {validationErrors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive rounded-md p-4">
              <p className="font-semibold text-destructive mb-2">验证错误：</p>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm text-destructive">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 树形结构 */}
          <div className="space-y-2">
            {groups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>暂无组织结构</p>
                {!readOnly && !disabled && (
                  <Button onClick={addRootNode} size="sm" variant="outline" className="mt-4 bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    添加第一个公司
                  </Button>
                )}
              </div>
            ) : (
              groups.map((group) => renderNode(group))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除此节点吗？如果该节点有子节点，所有子节点也会被删除。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNodeToDelete(null)}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteNode}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
