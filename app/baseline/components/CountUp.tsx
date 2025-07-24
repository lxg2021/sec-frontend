"use client"

import { useEffect, useState } from "react"

interface CountUpProps {
  end: number
  duration?: number
  delay?: number
  suffix?: string
  className?: string
  decimals?: number
}

export default function CountUp({
  end,
  duration = 1500,
  delay = 0,
  suffix = "",
  className = "",
  decimals = 0,
}: CountUpProps) {
  const [count, setCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true)
      const startTime = Date.now()
      const startValue = 0

      const animate = () => {
        const now = Date.now()
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)

        // 使用缓动函数让动画更自然
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const currentValue = startValue + (end - startValue) * easeOutQuart

        setCount(currentValue)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)
        }
      }

      requestAnimationFrame(animate)
    }, delay)

    return () => clearTimeout(timer)
  }, [end, duration, delay])

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
