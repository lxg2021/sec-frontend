"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  createForensicTask,
  listForensicArtifacts,
  listForensicEndpoints,
  listForensicEvidence,
  listForensicTasks,
  syncForensicEndpoints,
  syncForensicTaskResult,
} from "./api"
import type {
  BackendNotice,
  CreateForensicTaskRequest,
  ForensicArtifactDefinitionItem,
  ForensicContext,
  ForensicEndpointItem,
  ForensicEvidenceItem,
  ForensicTaskItem,
} from "./types"

interface BlockState<T> {
  data: T
  loading: boolean
  error: string | null
  selected?: T extends ForensicEndpointItem[] ? ForensicEndpointItem : never
}

export interface ReadinessMetrics {
  endpointTotal: number
  endpointOnline: number
  endpointUnbound: number
  taskRunning: number
  taskPending: number
  taskFailed: number
  evidenceTotal: number
  artifactEnabled: number
}

const POLL_INTERVAL = 20000

export function useForensicOverview(ctx: ForensicContext) {
  const [endpoints, setEndpoints] = useState<BlockState<ForensicEndpointItem[]>>({
    data: [],
    loading: true,
    error: null,
  })
  const [artifacts, setArtifacts] = useState<
    BlockState<ForensicArtifactDefinitionItem[]>
  >({ data: [], loading: true, error: null })
  const [tasks, setTasks] = useState<BlockState<ForensicTaskItem[]>>({
    data: [],
    loading: true,
    error: null,
  })
  const [evidence, setEvidence] = useState<BlockState<ForensicEvidenceItem[]>>({
    data: [],
    loading: true,
    error: null,
  })

  const [endpointTotal, setEndpointTotal] = useState(0)
  const [evidenceTotal, setEvidenceTotal] = useState(0)
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null)
  const [syncing, setSyncing] = useState(false)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const loadEndpoints = useCallback(async () => {
    setEndpoints((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await listForensicEndpoints({
        page: 1,
        page_size: 100,
        agent_id: ctx.agent_id,
        endpoint_id: ctx.endpoint_id,
      })
      if (!mountedRef.current) return
      const selected =
        res.items.find(
          (item) =>
            (ctx.endpoint_id && item.endpoint_id === ctx.endpoint_id) ||
            (ctx.agent_id && item.agent_id === ctx.agent_id),
        ) ?? undefined
      setEndpointTotal(res.pagination.total_count)
      setEndpoints({
        data: res.items,
        loading: false,
        error: null,
        selected,
      })
    } catch (e) {
      if (!mountedRef.current) return
      setEndpoints({
        data: [],
        loading: false,
        error: (e as Error).message || "终端列表加载失败",
      })
    }
  }, [ctx.agent_id, ctx.endpoint_id])

  const loadArtifacts = useCallback(async () => {
    setArtifacts((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await listForensicArtifacts({ enabled: true })
      if (!mountedRef.current) return
      setArtifacts({
        data: res.items,
        loading: false,
        error: null,
      })
    } catch (e) {
      if (!mountedRef.current) return
      setArtifacts({
        data: [],
        loading: false,
        error: (e as Error).message || "工件列表加载失败",
      })
    }
  }, [])

  const loadTasks = useCallback(async () => {
    setTasks((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await listForensicTasks({
        page: 1,
        page_size: 10,
        case_id: ctx.case_id,
        workflow_id: ctx.workflow_id,
        workflow_action_id: ctx.workflow_action_id,
        endpoint_id: ctx.endpoint_id,
      })
      if (!mountedRef.current) return
      setTasks({
        data: res.items,
        loading: false,
        error: null,
      })
    } catch (e) {
      if (!mountedRef.current) return
      setTasks({
        data: [],
        loading: false,
        error: (e as Error).message || "任务列表加载失败",
      })
    }
  }, [ctx.case_id, ctx.endpoint_id, ctx.workflow_action_id, ctx.workflow_id])

  const loadEvidence = useCallback(async () => {
    setEvidence((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await listForensicEvidence({
        page: 1,
        page_size: 10,
        case_id: ctx.case_id,
      })
      if (!mountedRef.current) return
      setEvidenceTotal(res.pagination.total_count)
      setEvidence({
        data: res.items,
        loading: false,
        error: null,
      })
    } catch (e) {
      if (!mountedRef.current) return
      setEvidence({
        data: [],
        loading: false,
        error: (e as Error).message || "证据列表加载失败",
      })
    }
  }, [ctx.case_id])

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([
      loadEndpoints(),
      loadArtifacts(),
      loadTasks(),
      loadEvidence(),
    ])
    if (mountedRef.current) setLastRefreshAt(Math.floor(Date.now() / 1000))
  }, [loadEndpoints, loadArtifacts, loadTasks, loadEvidence])

  // 初次加载
  useEffect(() => {
    refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.case_id, ctx.endpoint_id, ctx.agent_id, ctx.workflow_id, ctx.workflow_action_id])

  // 存在 pending/running 时轮询任务与证据
  const hasActive = tasks.data.some(
    (t) => t.status === "pending" || t.status === "running",
  )
  useEffect(() => {
    if (!hasActive) return
    const id = setInterval(() => {
      loadTasks()
      loadEvidence()
    }, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [hasActive, loadTasks, loadEvidence])

  // 同步终端
  const syncEndpoints = useCallback(async () => {
    setSyncing(true)
    try {
      const res = await syncForensicEndpoints()
      await loadEndpoints()
      return {
        synced_count: res.synced_count,
      }
    } finally {
      if (mountedRef.current) setSyncing(false)
    }
  }, [loadEndpoints])

  // 同步单条任务
  const syncTask = useCallback(
    async (taskId: string) => {
      const res = await syncForensicTaskResult(taskId)
      setTasks((s) => ({
        ...s,
        data: s.data.map((t) => (t.task_id === taskId ? res.task : t)),
      }))
      await loadEvidence()
      return res.task
    },
    [loadEvidence],
  )

  // 创建任务
  const createTask = useCallback(
    async (req: CreateForensicTaskRequest) => {
      const res = await createForensicTask(req)
      await loadTasks()
      return res
    },
    [loadTasks],
  )

  // 就绪指标
  const metrics: ReadinessMetrics = useMemo(() => {
    return {
      endpointTotal: endpointTotal || endpoints.data.length,
      endpointOnline: endpoints.data.filter((e) => e.status === "online").length,
      endpointUnbound: endpoints.data.filter((e) => !e.agent_id).length,
      taskRunning: tasks.data.filter((t) => t.status === "running").length,
      taskPending: tasks.data.filter((t) => t.status === "pending").length,
      taskFailed: tasks.data.filter((t) => t.status === "failed").length,
      evidenceTotal: evidenceTotal || evidence.data.length,
      artifactEnabled: artifacts.data.filter((a) => a.enabled).length,
    }
  }, [endpoints.data, tasks.data, evidence.data, artifacts.data, endpointTotal, evidenceTotal])

  // 后端能力提示
  const notices: BackendNotice[] = useMemo(() => {
    const list: BackendNotice[] = []
    if (artifacts.error) {
      list.push({
        id: "artifacts-error",
        level: "error",
        title: "工件配置加载失败",
        description: `${artifacts.error}。快速创建任务暂不可用，请检查 conf/forensic/artifacts.yaml。`,
      })
    }
    if (!artifacts.loading && !artifacts.error && artifacts.data.length === 0) {
      list.push({
        id: "artifacts-empty",
        level: "warning",
        title: "没有已启用的工件",
        description: "请检查 conf/forensic/artifacts.yaml 和工件目录配置。",
      })
    }
    if (!endpoints.loading && !endpoints.error && endpoints.data.length === 0) {
      list.push({
        id: "endpoints-empty",
        level: "warning",
        title: "没有可取证终端",
        description: "请先点击“同步终端”，或确认 Velociraptor 客户端是否已上线。",
      })
    }
    if (endpoints.error) {
      list.push({
        id: "endpoints-error",
        level: "error",
        title: "终端列表加载失败",
        description: endpoints.error,
      })
    }
    list.push({
      id: "unimplemented",
      level: "info",
      title: "部分能力属于任务中心",
      description:
        "任务取消、任务事件时间线、证据下载等能力后端第一阶段未开放，请前往任务中心查看完整详情。",
    })
    return list
  }, [
    endpoints.error,
    endpoints.loading,
    endpoints.data.length,
    artifacts.error,
    artifacts.loading,
    artifacts.data.length,
  ])

  return {
    endpoints,
    artifacts,
    tasks,
    evidence,
    metrics,
    notices,
    lastRefreshAt,
    syncing,
    refreshAll,
    syncEndpoints,
    syncTask,
    createTask,
  }
}

