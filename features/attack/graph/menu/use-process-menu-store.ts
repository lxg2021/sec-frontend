import { create } from "zustand"

interface NodeMenuState {
  isolateFileSelected: boolean
  blockExecutionSelected: boolean
}

interface ProcessMenuState {
  nodeStates: Map<string, NodeMenuState>
  getNodeState: (nodeId: string) => NodeMenuState
  toggleIsolateFile: (nodeId: string) => void
  toggleBlockExecution: (nodeId: string) => void
}

export const useProcessMenuStore = create<ProcessMenuState>((set, get) => ({
  nodeStates: new Map(),

  getNodeState: (nodeId: string) => {
    const { nodeStates } = get()
    if (!nodeStates.has(nodeId)) {
      nodeStates.set(nodeId, {
        isolateFileSelected: false,
        blockExecutionSelected: false,
      })
    }
    return nodeStates.get(nodeId)!
  },

  toggleIsolateFile: (nodeId: string) =>
    set((state) => {
      const newNodeStates = new Map(state.nodeStates)
      const nodeState = state.getNodeState(nodeId)
      newNodeStates.set(nodeId, {
        ...nodeState,
        isolateFileSelected: !nodeState.isolateFileSelected,
      })
      return { nodeStates: newNodeStates }
    }),

  toggleBlockExecution: (nodeId: string) =>
    set((state) => {
      const newNodeStates = new Map(state.nodeStates)
      const nodeState = state.getNodeState(nodeId)
      newNodeStates.set(nodeId, {
        ...nodeState,
        blockExecutionSelected: !nodeState.blockExecutionSelected,
      })
      return { nodeStates: newNodeStates }
    }),
}))
