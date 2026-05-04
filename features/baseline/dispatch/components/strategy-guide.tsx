"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/shared/ui/button"
import {
  Sparkles,
  Server,
  ClipboardCheck,
  Clock,
} from "lucide-react"

const steps = [
  {
    title: "选择主机",
    icon: <Server className="w-12 h-12 text-blue-500 drop-shadow-xl" />,
    subtitle: "通过组织结构，选定要应用策略的主机。",
    description: (
      <>
        你可以从企业的 <strong>公司 / 部门 / 主机</strong> 层级结构中快速定位目标主机，<br />
        支持<strong>关键字搜索</strong>与<strong>批量选择</strong>，适用于上百台设备的场景。
        <br />
        ✅ 支持标签过滤、状态筛选、已选项预览。
      </>
    ),
  },
  {
    title: "选择策略",
    icon: <ClipboardCheck className="w-12 h-12 text-green-500 drop-shadow-xl" />,
    subtitle: "根据主机类型匹配对应策略。",
    description: (
      <>
        可选策略类型包括 <strong>基线检查、补丁更新、回溯审计</strong>，支持单选或多选。
        <br />
        每个策略都带有<strong>优先级</strong>与<strong>规则详情</strong>，方便比对与确认。
        <br />
        🔍 支持策略搜索与预览规则内容。
      </>
    ),
  },
  {
    title: "设定执行计划",
    icon: <Clock className="w-12 h-12 text-indigo-500 drop-shadow-xl" />,
    subtitle: "配置策略的执行时间与周期。",
    description: (
      <>
        可选择 <strong>立即执行</strong> 或 <strong>设置周期计划</strong>，如每日、每周、每月定时检查。
        <br />
        支持设置<strong>任务优先级</strong>与<strong>失败重试机制</strong>。
        <br />
        🕒 系统将自动下发任务并追踪执行结果。
      </>
    ),
  },
]

export default function StrategyGuide() {
  const [step, setStep] = useState(0)

  const next = () => setStep((prev) => (prev + 1) % steps.length)
  const prev = () => setStep((prev) => (prev - 1 + steps.length) % steps.length)

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 flex items-center justify-center p-6">
      <div className="relative w-full max-w-4xl p-10 rounded-2xl shadow-2xl bg-white/70 backdrop-blur-lg border border-slate-200/60">
        <Sparkles className="absolute top-5 right-5 text-yellow-400 animate-pulse" />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">{steps[step].icon}</div>

            <h2 className="text-3xl font-bold text-slate-800 drop-shadow-sm">
              第 {step + 1} 步：{steps[step].title}
            </h2>

            <p className="text-xl text-slate-600">{steps[step].subtitle}</p>

            <div className="mt-4 text-base leading-relaxed text-slate-700 max-w-3xl mx-auto">
              {steps[step].description}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex justify-between">
          <Button variant="ghost" onClick={prev} className="hover:text-blue-500">
            上一步
          </Button>
          <Button onClick={next} className="bg-blue-500 hover:bg-blue-600 text-white px-6">
            下一步
          </Button>
        </div>
      </div>
    </div>
  )
}
