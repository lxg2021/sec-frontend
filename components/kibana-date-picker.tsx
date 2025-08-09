"use client"

import { useState, useRef, useMemo } from "react"
import { CalendarIcon, Clock, ChevronDown, RefreshCw } from "lucide-react"
import { format, isAfter, differenceInDays, differenceInMinutes } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DateRange {
  startTime: Date
  endTime: Date
}

interface QuickOption {
  label: string
  value: string
  getRange: () => DateRange
}

interface KibanaDatePickerProps {
  value?: DateRange
  onChange?: (range: DateRange) => void
  quickOptions?: QuickOption[]
  maxDays?: number
  className?: string
}

// 默认快捷选项
const defaultQuickOptions: QuickOption[] = [
  {
    label: "最近 15 分钟",
    value: "15m",
    getRange: () => {
      const now = new Date()
      return {
        startTime: new Date(now.getTime() - 15 * 60 * 1000),
        endTime: now,
      }
    },
  },
  {
    label: "最近 30 分钟",
    value: "30m",
    getRange: () => {
      const now = new Date()
      return {
        startTime: new Date(now.getTime() - 30 * 60 * 1000),
        endTime: now,
      }
    },
  },
  {
    label: "最近 1 小时",
    value: "1h",
    getRange: () => {
      const now = new Date()
      return {
        startTime: new Date(now.getTime() - 60 * 60 * 1000),
        endTime: now,
      }
    },
  },
  {
    label: "最近 4 小时",
    value: "4h",
    getRange: () => {
      const now = new Date()
      return {
        startTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        endTime: now,
      }
    },
  },
  {
    label: "最近 12 小时",
    value: "12h",
    getRange: () => {
      const now = new Date()
      return {
        startTime: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        endTime: now,
      }
    },
  },
  {
    label: "最近 24 小时",
    value: "24h",
    getRange: () => {
      const now = new Date()
      return {
        startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        endTime: now,
      }
    },
  },
  {
    label: "最近 7 天",
    value: "7d",
    getRange: () => {
      const now = new Date()
      return {
        startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endTime: now,
      }
    },
  },
  {
    label: "最近 30 天",
    value: "30d",
    getRange: () => {
      const now = new Date()
      return {
        startTime: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endTime: now,
      }
    },
  },
  {
    label: "最近 90 天",
    value: "90d",
    getRange: () => {
      const now = new Date()
      return {
        startTime: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        endTime: now,
      }
    },
  },
]

export default function KibanaDatePicker({
  value,
  onChange,
  quickOptions = defaultQuickOptions,
  maxDays = 90,
  className,
}: KibanaDatePickerProps) {
  // 过滤快捷选项，确保范围不超过 maxDays
  const availableQuickOptions = useMemo(() => 
    quickOptions.filter(option => {
      const range = option.getRange();
      return differenceInDays(range.endTime, range.startTime) <= maxDays;
    }), [quickOptions, maxDays]
  );

  // 初始化选中的快捷选项
  const initialSelectedQuick = availableQuickOptions.find(opt => opt.value === "30m")?.value || availableQuickOptions[0]?.value || "";

  // 初始化当前范围
  const initialRange = value || (availableQuickOptions.find(opt => opt.value === initialSelectedQuick)?.getRange() || { startTime: new Date(), endTime: new Date() });

  const [isOpen, setIsOpen] = useState(false)
  const [selectedQuick, setSelectedQuick] = useState(initialSelectedQuick)
  const [currentRange, setCurrentRange] = useState(initialRange)
  const [error, setError] = useState("")

  // 自定义时间状态 - 初始化为当前范围的值
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(initialRange.startTime)
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(initialRange.endTime)
  const [customStartTime, setCustomStartTime] = useState(format(initialRange.startTime, "HH:mm"))
  const [customEndTime, setCustomEndTime] = useState(format(initialRange.endTime, "HH:mm"))

  // 使用 ref 来避免在渲染过程中更新状态
  const isUpdatingRef = useRef(false)

  // 验证时间范围
  const validateRange = (start: Date, end: Date): string => {
    if (!isAfter(end, start)) {
      return "结束时间必须晚于开始时间"
    }

    const daysDiff = differenceInDays(end, start)
    if (daysDiff > maxDays) {
      return `时间跨度不能超过 ${maxDays} 天`
    }

    return ""
  }

  // 格式化显示时间范围
  const formatDisplayRange = (range: DateRange) => {
    const minutesDiff = differenceInMinutes(range.endTime, range.startTime)

    if (minutesDiff < 60) {
      return `最近 ${minutesDiff} 分钟`
    } else if (minutesDiff < 1440) {
      const hours = Math.floor(minutesDiff / 60)
      return `最近 ${hours} 小时`
    } else {
      const days = Math.floor(minutesDiff / 1440)
      return `最近 ${days} 天`
    }
  }

  // 解析时间字符串并与日期合并
  const parseTimeWithDate = (date: Date, timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number)
    const newDate = new Date(date)
    newDate.setHours(hours, minutes, 0, 0)
    return newDate
  }

  // 处理快捷选择
  const handleQuickSelect = (option: QuickOption) => {
    if (isUpdatingRef.current) return

    isUpdatingRef.current = true
    const range = option.getRange()

    setSelectedQuick(option.value)
    setCurrentRange(range)
    setError("")

    // 同步更新自定义时间状态
    setCustomStartDate(range.startTime)
    setCustomEndDate(range.endTime)
    setCustomStartTime(format(range.startTime, "HH:mm"))
    setCustomEndTime(format(range.endTime, "HH:mm"))

    isUpdatingRef.current = false
  }

  // 处理自定义时间变化 - 增强验证逻辑
  const handleCustomTimeChange = () => {
    if (isUpdatingRef.current) return

    // 检查所有必需的值是否存在
    if (!customStartDate || !customEndDate || !customStartTime || !customEndTime) {
      if (customStartDate || customEndDate || customStartTime || customEndTime) {
        setError("请完整填写开始时间和结束时间")
      }
      return
    }

    isUpdatingRef.current = true

    try {
      const start = parseTimeWithDate(customStartDate, customStartTime)
      const end = parseTimeWithDate(customEndDate, customEndTime)

      // 验证时间范围
      const validationError = validateRange(start, end)
      setError(validationError)

      if (!validationError) {
        const range = { startTime: start, endTime: end }
        setCurrentRange(range)
        setSelectedQuick("") // 清除快捷选择
      }
    } catch (err) {
      setError("时间格式不正确")
    }

    isUpdatingRef.current = false
  }

  // 处理自定义开始日期变化
  const handleStartDateChange = (date: Date | undefined) => {
    setCustomStartDate(date)
    setTimeout(handleCustomTimeChange, 0)
  }

  // 处理自定义结束日期变化
  const handleEndDateChange = (date: Date | undefined) => {
    setCustomEndDate(date)
    setTimeout(handleCustomTimeChange, 0)
  }

  // 处理自定义开始时间变化
  const handleStartTimeChange = (timeString: string) => {
    setCustomStartTime(timeString)
    setTimeout(handleCustomTimeChange, 0)
  }

  // 处理自定义结束时间变化
  const handleEndTimeChange = (timeString: string) => {
    setCustomEndTime(timeString)
    setTimeout(handleCustomTimeChange, 0)
  }

  // 应用选择
  const handleApply = () => {
    onChange?.(currentRange)
    setIsOpen(false)
  }

  // 刷新到当前时间
  const handleRefresh = () => {
    if (selectedQuick) {
      const option = quickOptions.find((opt) => opt.value === selectedQuick)
      if (option) {
        handleQuickSelect(option)
      }
    }
  }

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-left font-normal min-w-[280px] bg-transparent"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="truncate">
                {selectedQuick
                  ? quickOptions.find((opt) => opt.value === selectedQuick)?.label
                  : formatDisplayRange(currentRange)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRefresh()
                }}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <ChevronDown className="h-4 w-4" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-0" align="start">
          <div className="flex h-[400px]">
            {/* 左侧快捷选项 */}
            <div className="w-48 border-r">
              <div className="p-3 border-b">
                <h4 className="font-medium text-sm">快速选择</h4>
              </div>
              <ScrollArea className="h-[320px]">
                <div className="p-2">
                  {availableQuickOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={selectedQuick === option.value ? "secondary" : "ghost"}
                      className="w-full justify-start text-sm h-8 mb-1"
                      onClick={() => handleQuickSelect(option)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* 右侧自定义选择 */}
            <div className="flex-1">
              <div className="p-3 border-b">
                <h4 className="font-medium text-sm">自定义时间范围</h4>
              </div>

              <div className="p-4 space-y-4">
                {/* 开始时间 */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">开始时间</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 justify-start text-left font-normal text-xs bg-transparent"
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {customStartDate
                            ? format(customStartDate, "yyyy年MM月dd日", { locale: zhCN })
                            : "请选择开始日期"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customStartDate}
                          onSelect={handleStartDateChange}
                          locale={zhCN}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={customStartTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-24 text-xs"
                      placeholder="09:00"
                    />
                  </div>
                </div>

                {/* 结束时间 */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">结束时间</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 justify-start text-left font-normal text-xs bg-transparent"
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {customEndDate ? format(customEndDate, "yyyy年MM月dd日", { locale: zhCN }) : "请选择结束日期"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customEndDate}
                          onSelect={handleEndDateChange}
                          locale={zhCN}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={customEndTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      className="w-24 text-xs"
                      placeholder="18:00"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-200">{error}</div>
                )}
              </div>
            </div>
          </div>

          {/* 底部信息和操作 */}
          <div className="border-t p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {format(currentRange.startTime, "yyyy年MM月dd日 HH:mm", { locale: zhCN })} →{" "}
                {format(currentRange.endTime, "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                  取消
                </Button>
                <Button size="sm" onClick={handleApply}>
                  应用
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}