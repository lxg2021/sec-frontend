import * as React from "react"
import { cn } from "@/lib/utils"

const Badge = React.forwardRef<React.HTMLAttributes<HTMLDivElement>, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Badge.displayName = "Badge"

const Alert = React.forwardRef<React.HTMLAttributes<HTMLDivElement>, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div className={cn("relative w-full rounded-lg border p-4", className)} role="alert" ref={ref} {...props} />
  },
)
Alert.displayName = "Alert"

const AlertDescription = React.forwardRef<
  React.HTMLAttributes<HTMLParagraphElement>,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return <div className={cn("text-sm [&_p]:leading-relaxed", className)} ref={ref} {...props} />
})
AlertDescription.displayName = "AlertDescription"

const AlertTitle = React.forwardRef<
  React.HTMLAttributes<HTMLParagraphElement>,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)} ref={ref} {...props} />
})
AlertTitle.displayName = "AlertTitle"

export { Badge, Alert, AlertDescription, AlertTitle }
