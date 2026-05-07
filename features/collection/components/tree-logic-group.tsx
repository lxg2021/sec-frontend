"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { useToast } from "@/shared/hooks/use-toast"
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
  GitBranch,
  FolderTree,
  SquarePen,
} from "lucide-react"
import type { UserLogicGroup } from "@/features/collection/types"
import type { TableLogicGroup } from "@/features/collection/table-types"
import { convertToTableLogicGroups, validateUserLogicGroups } from "@/features/collection/lib/logic-group-converter"
import { useTranslations } from "next-intl"

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
  /** 外部保存请求版本号，递增时触发一次保存 */
  saveRequestVersion?: number
  /** 隐藏组件内部保存按钮，用外部按钮承载提交动作 */
  hideSaveButton?: boolean
  /** 是否渲染组件自带卡片外框和标题 */
  showFrame?: boolean
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
  saveRequestVersion,
  hideSaveButton = false,
  showFrame = true,
}: TreeLogicGroupProps) {
  const t = useTranslations("pages.collection.tree")
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
  const previousSaveRequestVersion = useRef<number | undefined>(saveRequestVersion)

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
      return { isDuplicate: true, message: t("nameRequired") }
    }

    // 检查根级别（公司）
    if (!parentId) {
      const duplicate = groups.find((g) => g.id !== excludeId && g.name === trimmedName)
      if (duplicate) {
        return { isDuplicate: true, message: t("companyExists", { name: trimmedName }) }
      }
      return { isDuplicate: false, message: "" }
    }

    // 检查子级别（部门或组）
    const findParentAndCheckChildren = (nodes: UserLogicGroup[]): boolean => {
      for (const node of nodes) {
        if (node.id === parentId) {
          const duplicate = node.children?.find((child) => child.id !== excludeId && child.name === trimmedName)
          if (duplicate) {
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
      return { isDuplicate: true, message: t("siblingExists", { name: trimmedName }) }
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
        title: t("duplicateName"),
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

    const newName = childType === "department" ? t("newDepartment") : t("newGroup")

    const validation = checkDuplicateName(newName, parentId)
    if (validation.isDuplicate) {
      toast({
        title: t("duplicateName"),
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

    const newName = t("newCompany")

    const validation = checkDuplicateName(newName, undefined)
    if (validation.isDuplicate) {
      toast({
        title: t("duplicateName"),
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
    console.log("Converted TableLogicGroup data:", tableGroups)

    // 调用回调
    onSave?.(tableGroups)
    setValidationErrors([])
  }

  useEffect(() => {
    if (saveRequestVersion === undefined) return

    if (previousSaveRequestVersion.current === undefined) {
      previousSaveRequestVersion.current = saveRequestVersion
      return
    }

    if (saveRequestVersion !== previousSaveRequestVersion.current) {
      previousSaveRequestVersion.current = saveRequestVersion
      handleSave()
    }
  }, [saveRequestVersion])

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
      if (node.type === "company") return t("company")
      if (node.type === "department") return t("department")
      return t("group")
    }

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={`flex items-center gap-2 p-2 rounded-md transition-colors ${isSelected ? "bg-primary/10 border border-primary" : "hover:bg-muted"
            } ${isMatched ? "ring-2 ring-yellow-400" : ""} ${level > 0 ? "ml-6" : ""}`}
          onClick={() => selectNode(node.id)}
          onDoubleClick={() => startEdit(node.id, node.name)}
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
              <Badge
                variant="outline"
                className="text-xs font-medium text-primary border-primary/30 px-2 py-0.5 rounded-md bg-transparent"
              >
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
                      title={node.type === "company" ? t("addDepartment") : t("addGroup")}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => startEdit(node.id, node.name)}
                    title={t("editName")}
                  >
                    <SquarePen className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => confirmDelete(node.id)}
                    title={t("deleteNode")}
                  >
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

  const treeContent = (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {!readOnly && !disabled && (
          <Button
            onClick={addRootNode}
            size="sm"
            className="h-10 w-28 shrink-0 justify-center bg-slate-900 text-white hover:bg-slate-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("addCompany")}
          </Button>
        )}
      </div>

      {validationErrors.length > 0 && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
          <p className="mb-2 font-semibold text-destructive">{t("validationError")}</p>
          <ul className="list-inside list-disc space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-sm text-destructive">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        {groups.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Building2 className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>{t("empty")}</p>
            {!readOnly && !disabled && (
              <Button onClick={addRootNode} size="sm" variant="outline" className="mt-4 bg-transparent">
                <Plus className="mr-2 h-4 w-4" />
                {t("addFirstCompany")}
              </Button>
            )}
          </div>
        ) : (
          groups.map((group) => renderNode(group))
        )}
      </div>
    </div>
  )

  const deleteDialog = (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("confirmDeleteDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setNodeToDelete(null)}>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={deleteNode}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  if (!showFrame) {
    return (
      <>
        {treeContent}
        {deleteDialog}
      </>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          {/* 左侧标题区 */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
              <FolderTree className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                {t("title")}
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {readOnly ? t("readonlyDescription") : t("editDescription")}
              </CardDescription>
            </div>
          </div>

          {/* 右侧操作按钮区 */}
          <div className="flex items-center gap-2">
            {!readOnly && !disabled && (
              <Button
                onClick={addRootNode}
                size="sm"
                className="flex h-10 w-28 items-center justify-center gap-1 bg-slate-900 text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                {t("addCompany")}
              </Button>
            )}
            {!readOnly && !hideSaveButton && (
              <Button
                onClick={handleSave}
                size="sm"
                variant="default"
                className="flex h-10 w-28 items-center justify-center gap-1 bg-slate-900 text-white hover:bg-slate-800"
              >
                <Save className="h-4 w-4" />
                {t("save")}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>{treeContent}</CardContent>
      </Card>
      {deleteDialog}
    </>
  )
}
