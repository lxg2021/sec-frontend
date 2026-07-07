"use client"

import * as React from "react"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "space-y-3",
        month_caption: "flex h-8 items-center justify-center px-9",
        caption_label: "flex items-center gap-1 text-sm font-medium",
        dropdowns: "flex items-center gap-1",
        dropdown_root:
          "relative inline-flex h-7 items-center rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/40",
        dropdown: "absolute inset-0 h-full w-full cursor-pointer opacity-0",
        months_dropdown: "min-w-[76px]",
        years_dropdown: "min-w-[72px]",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        chevron: "h-4 w-4",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-9 rounded-md text-center text-[0.8rem] font-normal text-muted-foreground",
        weeks: "flex flex-col",
        week: "mt-2 flex w-full",
        day: "relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button:hover]:bg-primary [&>button:hover]:text-primary-foreground [&>button:focus]:bg-primary [&>button:focus]:text-primary-foreground",
        today: "[&>button]:bg-accent [&>button]:text-accent-foreground",
        outside:
          "text-muted-foreground opacity-50 data-[selected=true]:bg-accent/50 data-[selected=true]:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        range_end: "day-range-end",
        range_middle:
          "[&>button]:bg-accent [&>button]:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className }) => {
          const iconClassName = cn("h-4 w-4", className)
          if (orientation === "left") return <ChevronLeft className={iconClassName} />
          if (orientation === "right") return <ChevronRight className={iconClassName} />
          if (orientation === "up") return <ChevronUp className={iconClassName} />
          return <ChevronDown className={iconClassName} />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
