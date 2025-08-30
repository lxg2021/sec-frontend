// processNodeMenu.tsx
import { Drill, FileSearch, CheckSquare, Square } from "lucide-react"
import { useProcessMenuStore } from "@/components/graph/menu/useProcessMenuStore"

export function getProcessNodeMenu(data) {
  // 这里取特定节点的状态
  const { getNodeState, toggleIsolateFile, toggleBlockExecution } = useProcessMenuStore.getState()

  const nodeState = getNodeState(data.nodeId)
  const { isolateFileSelected, blockExecutionSelected } = nodeState

  return [
    {
      label: (
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Drill className="w-4 h-4 text-violet-500" />
          节点钻探
        </div>
      ),
      action: () => alert(`钻探: ${data.label}`),
      className: "hover:bg-violet-50 focus:bg-violet-50 transition-colors",
    },
    {
      label: (
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <FileSearch className="w-4 h-4 text-green-500" />
          分析文件
        </div>
      ),
      action: () => alert(`分析HASH: ${data.label}`),
      className: "hover:bg-green-50 focus:bg-green-50 transition-colors",
    },
    { type: "separator" },
    {
      label: (
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          {isolateFileSelected ? (
            <CheckSquare className="w-4 h-4 text-red-500" />
          ) : (
            <Square className="w-4 h-4 text-gray-400" />
          )}
          隔离进程
        </div>
      ),
      action: () => {
        toggleIsolateFile(data.nodeId)
        alert(`隔离文件: ${!isolateFileSelected ? "已选中" : "已取消"}`)
      },
      className: "hover:bg-blue-50 focus:bg-blue-50 transition-colors",
    },
    {
      label: (
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          {blockExecutionSelected ? (
            <CheckSquare className="w-4 h-4 text-red-500" />
          ) : (
            <Square className="w-4 h-4 text-gray-400" />
          )}
          阻断执行
        </div>
      ),
      action: () => {
        toggleBlockExecution(data.nodeId)
        alert(`阻断执行: ${!blockExecutionSelected ? "已选中" : "已取消"}`)
      },
      className: "hover:bg-red-50 focus:bg-red-50 transition-colors hover:text-red-700",
    },
  ]
}
