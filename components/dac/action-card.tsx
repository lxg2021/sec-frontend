"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

export interface ActionOption {
  value: string
  label: string
  description: string
}

interface ActionCardProps {
  title: string
  description: string
  actions: string[]
  availableActions: ActionOption[]
  onActionToggle: (action: string) => void
  disabledActions?: string[]
  badgeColor?: "default" | "destructive" | "outline" | "secondary"
}

export function ActionCard({
  title,
  description,
  actions,
  availableActions,
  onActionToggle,
  disabledActions = [],
  badgeColor = "default",
}: ActionCardProps) {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{title}</h3>
          <Badge variant={badgeColor}>{actions.length}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>

        <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
          {availableActions.map((action) => {
            const isSelected = actions.includes(action.value)
            const isDisabled = disabledActions.includes(action.value)

            return (
              <div
                key={action.value}
                className={`flex items-center space-x-2 rounded-md p-2 border ${
                  isSelected
                    ? "bg-primary/10 border-primary/20"
                    : isDisabled
                      ? "opacity-50 cursor-not-allowed bg-muted/50"
                      : "hover:bg-accent cursor-pointer border-transparent"
                }`}
                onClick={() => !isDisabled && onActionToggle(action.value)}
              >
                <Checkbox
                  checked={isSelected}
                  disabled={isDisabled}
                  onCheckedChange={() => !isDisabled && onActionToggle(action.value)}
                />
                <label className={`text-sm font-medium ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
                  {action.label}
                </label>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
