"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, SearchIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type SearchParams = {
  ip?: string
  dns?: string
  md5?: string
  port?: string
  startTime?: Date
  endTime?: Date
}

const REGEX_PATTERNS = {
  // IPv4 pattern
  ip: /^(\d{1,3}\.){3}\d{1,3}$/,
  // MD5 pattern (32 hexadecimal characters)
  md5: /^[a-fA-F0-9]{32}$/,
  // Port pattern (1-65535)
  port: /^\d{1,5}$/,
  // DNS pattern (domain name)
  dns: /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
}

interface SearchProps {
  onSearch?: (params: SearchParams) => void
}

export function Search({ onSearch }: SearchProps) {
  const [searchValue, setSearchValue] = useState<string>("")
  const [searchParams, setSearchParams] = useState<SearchParams>({})
  const [error, setError] = useState<string>("")
  const [detectedType, setDetectedType] = useState<string>("")

  const detectSearchType = (value: string): keyof SearchParams | null => {
    if (!value.trim()) return null

    // Check port first (most specific)
    if (REGEX_PATTERNS.port.test(value)) {
      const portNum = Number.parseInt(value, 10)
      if (portNum >= 1 && portNum <= 65535) {
        return "port"
      }
    }

    // Check MD5 (32 hex characters)
    if (REGEX_PATTERNS.md5.test(value)) {
      return "md5"
    }

    // Check IP address
    if (REGEX_PATTERNS.ip.test(value)) {
      const parts = value.split(".")
      if (parts.every((part) => Number.parseInt(part, 10) <= 255)) {
        return "ip"
      }
    }

    // Check DNS (domain name)
    if (REGEX_PATTERNS.dns.test(value)) {
      return "dns"
    }

    return null
  }

  const handleSearchInputChange = (value: string) => {
    setSearchValue(value)
    setError("")

    const type = detectSearchType(value)
    if (type) {
      setDetectedType(type.toUpperCase())
      setSearchParams((prev) => ({
        startTime: prev.startTime,
        endTime: prev.endTime,
        [type]: value,
      }))
    } else if (value.trim()) {
      setDetectedType("未识别")
      setSearchParams((prev) => ({
        startTime: prev.startTime,
        endTime: prev.endTime,
      }))
    } else {
      setDetectedType("")
      setSearchParams((prev) => ({
        startTime: prev.startTime,
        endTime: prev.endTime,
      }))
    }
  }

  const handleDateChange = (field: "startTime" | "endTime", date: Date | undefined) => {
    setSearchParams((prev) => ({
      ...prev,
      [field]: date,
    }))
    setError("")
  }

  const validateTimeRange = (): boolean => {
    if (searchParams.startTime && searchParams.endTime) {
      const diffTime = Math.abs(searchParams.endTime.getTime() - searchParams.startTime.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays > 31) {
        setError("时间范围不能超过1个月")
        return false
      }

      if (searchParams.startTime > searchParams.endTime) {
        setError("开始时间不能晚于结束时间")
        return false
      }
    }
    return true
  }

  const handleSearch = () => {
    // 检查搜索内容是否为空
    if (!searchValue.trim()) {
      setError("请输入搜索内容")
      return
    }

    // 检查开始时间是否为空
    if (!searchParams.startTime) {
      setError("请选择开始时间")
      return
    }

    // 检查结束时间是否为空
    if (!searchParams.endTime) {
      setError("请选择结束时间")
      return
    }

    // 检查搜索内容类型
    if (!detectSearchType(searchValue)) {
      setError("无法识别输入类型，请输入有效的 IP、DNS、MD5 或端口")
      return
    }

    // 验证时间范围
    if (!validateTimeRange()) {
      return
    }

    onSearch?.(searchParams)
  }

  const handleReset = () => {
    setSearchValue("")
    setDetectedType("")
    setSearchParams({})
    setError("")
  }

  return (
    <div className="w-full p-3 md:p-4 space-y-4 bg-card rounded-lg border">
      <div className="space-y-1.5">
        <Label htmlFor="search" className="text-sm">搜索内容</Label>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            id="search"
            placeholder="输入 IP (192.168.1.1) / DNS (example.com) / MD5 (32位) / 端口 (8080)"
            value={searchValue}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        {detectedType && (
          <p className="text-xs text-muted-foreground">
            检测到类型: <span className="font-medium text-foreground">{detectedType}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm">开始时间</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-9 text-sm",
                  !searchParams.startTime && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {searchParams.startTime ? format(searchParams.startTime, "yyyy-MM-dd") : <span>选择开始时间</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={searchParams.startTime}
                onSelect={(date) => handleDateChange("startTime", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">结束时间</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-9 text-sm",
                  !searchParams.endTime && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {searchParams.endTime ? format(searchParams.endTime, "yyyy-MM-dd") : <span>选择结束时间</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={searchParams.endTime}
                onSelect={(date) => handleDateChange("endTime", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {error && (
        <div className="p-2 text-xs text-destructive bg-destructive/10 border-l-4 border-destructive rounded-r-md">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleSearch} className="flex-1 h-9 text-sm">
          搜索
        </Button>
        <Button onClick={handleReset} variant="outline" className="h-9 text-sm">
          重置
        </Button>
      </div>
    </div>
  )
}