interface LoginAnimationProps {
  className?: string
}

export default function LoginAnimation({ className = "" }: LoginAnimationProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden bg-[#02060b] ${className}`}
      aria-hidden="true"
    >
      <img
        src="/backgrounds/login-background-attack-trace-v2.svg"
        alt=""
        className="h-full w-full select-none object-cover object-center"
        draggable={false}
      />
    </div>
  )
}
