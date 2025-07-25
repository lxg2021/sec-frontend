"use client"

import { useEffect, useState, useRef } from "react"

interface CountUpProps {
  end: number
  duration?: number
  delay?: number
  suffix?: string
  className?: string
  decimals?: number
  start?: number
}

export default function CountUp({
  end,
  duration = 1500,
  delay = 0,
  suffix = "",
  className = "",
  decimals = 0,
  start = 0,
}: CountUpProps) {
  const [count, setCount] = useState(start)
  const [isAnimating, setIsAnimating] = useState(false)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    let timer: NodeJS.Timeout

    const startAnimation = () => {
      setIsAnimating(true)
      startTimeRef.current = Date.now()

      const animate = () => {
        if (!startTimeRef.current) return // Ensure startTimeRef is valid

        const now = Date.now()
        const elapsed = now - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)

        // 使用缓动函数让动画更自然
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const currentValue = start + (end - start) * easeOutQuart

        setCount(currentValue)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)
        }
      }

      requestAnimationFrame(animate)
    }

    if (delay > 0) {
      timer = setTimeout(startAnimation, delay)
    } else {
      startAnimation()
    }

    return () => {
      clearTimeout(timer)
      startTimeRef.current = null // Clear the ref on unmount
    }
  }, [end, duration, delay, start])

  const formatNumber = (num: number) => {
    if (decimals > 0) {
      return num.toFixed(decimals)
    }
    return Math.floor(num).toLocaleString()
  }

  return (
    <span className={`${className} ${isAnimating ? "animate-pulse" : ""}`}>
      {formatNumber(count)}
      {suffix}
    </span>
  )
}
