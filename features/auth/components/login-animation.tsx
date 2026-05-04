"use client"

import { useEffect, useRef } from "react"

export default function LoginAnimation({ className = "" }) {
  const canvasRef = useRef(null)
  const animationRef = useRef()
  const nodesRef = useRef([])

  // 初始化节点
  const initNodes = (width, height) => {
    const nodes = []
    const nodeCount = Math.floor((width * height) / 15000)

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 3 + 2,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        connections: [],
      })
    }

    // 为每个节点找到最近的几个节点作为连接
    nodes.forEach((node, i) => {
      const distances = nodes.map((otherNode, j) => ({
        index: j,
        distance: Math.sqrt(Math.pow(node.x - otherNode.x, 2) + Math.pow(node.y - otherNode.y, 2)),
      }))

      distances.sort((a, b) => a.distance - b.distance)

      const connectionCount = Math.floor(Math.random() * 5) + 4
      for (let j = 1; j <= connectionCount && j < distances.length; j++) {
        if (distances[j].distance < 200) {
          node.connections.push(distances[j].index)
        }
      }
    })

    return nodes
  }

  // 动画循环
  const animate = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width, height } = canvas

    // 清空画布 - 纯黑色背景
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
    ctx.fillRect(0, 0, width, height)

    const nodes = nodesRef.current

    // 更新节点位置和脉动
    nodes.forEach((node) => {
      node.x += node.vx
      node.y += node.vy

      if (node.x <= 0 || node.x >= width) node.vx *= -1
      if (node.y <= 0 || node.y >= height) node.vy *= -1

      node.x = Math.max(0, Math.min(width, node.x))
      node.y = Math.max(0, Math.min(height, node.y))

      node.pulse += node.pulseSpeed
    })

    // 绘制连接线 - 红色闪烁
    const time = Date.now() * 0.005
    nodes.forEach((node, i) => {
      node.connections.forEach((connectionIndex) => {
        if (connectionIndex > i) {
          const connectedNode = nodes[connectionIndex]
          const distance = Math.sqrt(Math.pow(node.x - connectedNode.x, 2) + Math.pow(node.y - connectedNode.y, 2))

          const baseOpacity = Math.max(0, 1 - distance / 200)
          const flicker = Math.sin(time + i * 0.5) * 0.3 + 0.7
          const opacity = baseOpacity * flicker

          ctx.strokeStyle = `rgba(239, 68, 68, ${opacity * 0.3})`
          ctx.lineWidth = 1.5

          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          ctx.lineTo(connectedNode.x, connectedNode.y)
          ctx.stroke()
        }
      })
    })

    // 绘制简单的蓝色节点
    nodes.forEach((node) => {
      const pulseSize = Math.sin(node.pulse) * 0.3 + 1
      const currentRadius = node.radius * pulseSize
      const flickerIntensity = Math.sin(node.pulse * 2) * 0.4 + 0.6

      // 简单的蓝色圆圈
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.6 * flickerIntensity})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2)
      ctx.stroke()

      // 中心点
      ctx.fillStyle = `rgba(147, 197, 253, ${0.8 * flickerIntensity})`
      ctx.beginPath()
      ctx.arc(node.x, node.y, currentRadius * 0.3, 0, Math.PI * 2)
      ctx.fill()
    })

    animationRef.current = requestAnimationFrame(animate)
  }

  // 处理画布大小调整
  const handleResize = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    nodesRef.current = initNodes(canvas.width, canvas.height)
  }

  // 清理动画
  const cleanup = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  useEffect(() => {
    handleResize()
    animate()

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      cleanup()
    }
  }, [])

  // 组件卸载时清理
  useEffect(() => {
    return cleanup
  }, [])

  return (
    <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full ${className}`} style={{ background: "black" }} />
  )
}
