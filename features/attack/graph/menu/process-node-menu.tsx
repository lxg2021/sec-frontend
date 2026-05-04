import { CheckSquare, Drill, FileSearch, Square } from "lucide-react"
import { useProcessMenuStore } from "@/features/attack/graph/menu/use-process-menu-store"

export function getProcessNodeMenu(data) {
  const { getNodeState, toggleIsolateFile, toggleBlockExecution } = useProcessMenuStore.getState()

  const nodeState = getNodeState(data.nodeId)
  const { isolateFileSelected, blockExecutionSelected } = nodeState

  return [
    {
      label: (
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Drill className="w-4 h-4 text-violet-500" />
          Node drilldown
        </div>
      ),
      action: () => alert(`Drilldown: ${data.label}`),
      className: "hover:bg-violet-50 focus:bg-violet-50 transition-colors",
    },
    {
      label: (
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <FileSearch className="w-4 h-4 text-green-500" />
          Analyze file
        </div>
      ),
      action: () => alert(`Analyze hash: ${data.label}`),
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
          Isolate process
        </div>
      ),
      action: () => {
        toggleIsolateFile(data.nodeId)
        alert(`Isolate file: ${!isolateFileSelected ? "selected" : "cleared"}`)
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
          Block execution
        </div>
      ),
      action: () => {
        toggleBlockExecution(data.nodeId)
        alert(`Block execution: ${!blockExecutionSelected ? "selected" : "cleared"}`)
      },
      className: "hover:bg-red-50 focus:bg-red-50 transition-colors hover:text-red-700",
    },
  ]
}
