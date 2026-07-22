"use client"

import { useEffect, useState } from "react"

interface LoginAnimationProps {
  className?: string
}

const ANIMATED_BACKGROUND = "/backgrounds/login-background-attack-trace-v2.svg"
const STATIC_BACKGROUND = "/backgrounds/login-background-attack-trace-v2-static.svg"

export default function LoginAnimation({ className = "" }: LoginAnimationProps) {
  const [backgroundSource, setBackgroundSource] = useState(ANIMATED_BACKGROUND)

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")

    const syncBackgroundMotion = () => {
      const shouldAnimate = document.visibilityState === "visible" && !reducedMotion.matches
      setBackgroundSource(shouldAnimate ? ANIMATED_BACKGROUND : STATIC_BACKGROUND)
    }

    syncBackgroundMotion()
    document.addEventListener("visibilitychange", syncBackgroundMotion)
    reducedMotion.addEventListener("change", syncBackgroundMotion)

    return () => {
      document.removeEventListener("visibilitychange", syncBackgroundMotion)
      reducedMotion.removeEventListener("change", syncBackgroundMotion)
    }
  }, [])

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden bg-[#02060b] ${className}`}
      aria-hidden="true"
    >
      <img
        src={backgroundSource}
        alt=""
        className="h-full w-full select-none object-cover object-center"
        draggable={false}
      />
    </div>
  )
}
