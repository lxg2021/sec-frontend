"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { getAccessToken } from "@/shared/lib/http/auth"

import { getHostSelectorTree } from "../api"
import type { HostSelectorTreeNode } from "../types"

export function useHostSelectorTree() {
  const [data, setData] = useState<HostSelectorTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [requiresLogin, setRequiresLogin] = useState(false)
  const requestIdRef = useRef(0)

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current

    setLoading(true)
    setError("")
    setRequiresLogin(false)

    if (!getAccessToken()) {
      if (requestId !== requestIdRef.current) return

      setData([])
      setRequiresLogin(true)
      setLoading(false)
      return
    }

    try {
      const nextData = await getHostSelectorTree()
      if (requestId !== requestIdRef.current) return

      setData(nextData)
    } catch (nextError) {
      if (requestId !== requestIdRef.current) return

      setData([])
      setError(nextError instanceof Error ? nextError.message : "Failed to load host tree.")
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void reload()

    return () => {
      requestIdRef.current += 1
    }
  }, [reload])

  return {
    data,
    error,
    loading,
    reload,
    requiresLogin,
  }
}
