"use client"

import { useState } from "react"
import { KillChainTimeline } from "@/components/killchain/kill-chain-timeline"
import type { DynamicKillChainData } from "@/lib/kill-chain"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Demo data for testing dynamic updates
const demoUpdates: DynamicKillChainData[][] = [
  // First update - Reconnaissance stage
  [
    {
      id: "recon",
      name: "侦察 (Reconnaissance)",
      status: "active",
      attckStages: [
        {
          slug: "reconnaissance",
          name: "侦察",
          techniques: [
            {
              id: "T1595",
              name: "主动扫描",
              time: "09:15:23",
              description: "攻击者执行主动侦察扫描以收集信息",
              references: ["https://attack.mitre.org/techniques/T1595/"],
            },
            {
              id: "T1590",
              name: "收集受害者网络信息",
              time: "09:25:45",
              description: "攻击者收集有关受害者网络的信息",
              references: [
                "https://attack.mitre.org/techniques/T1590/",
                "https://attack.mitre.org/techniques/T1590/001"
              ],
            },
          ],
        },
      ],
    },
  ],
  // Second update - Complete recon, start weaponization
  [
    {
      id: "recon",
      name: "侦察 (Reconnaissance)",
      status: "completed",
      attckStages: [
        {
          slug: "reconnaissance",
          name: "侦察",
          techniques: [
            {
              id: "T1595",
              name: "主动扫描",
              time: "09:15:23",
              description: "攻击者执行主动侦察扫描以收集信息",
              references: ["https://attack.mitre.org/techniques/T1595/"],
            },
            {
              id: "T1590",
              name: "收集受害者网络信息",
              time: "09:25:45",
              references: [
                "https://attack.mitre.org/techniques/T1590/",
                "https://attack.mitre.org/techniques/T1590/001"
              ],
              description: "攻击者收集有关受害者网络的信息",
            },
            {
              id: "T1596",
              name: "搜索开放技术数据库",
              time: "09:45:12",
              description: "攻击者搜索开放的技术数据库获取信息",
              references: [
                "https://attack.mitre.org/techniques/T1596/",
                "https://attack.mitre.org/techniques/T1596/001",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "weapon",
      name: "武器化 (Weaponization)",
      status: "active",
      attckStages: [
        {
          slug: "resource-development",
          name: "资源开发",
          techniques: [
            {
              id: "T1587",
              name: "开发能力",
              time: "10:22:45",
              description: "攻击者构建可在目标定位期间使用的能力",
              references: [
                "https://attack.mitre.org/techniques/T1587/",
                "https://attack.mitre.org/techniques/T1587/001",
              ],
            },
          ],
        },
        {
          slug: "resource-development-testing",
          name: "资源开发testing",
          techniques: [
            {
              id: "T1580",
              name: "开发能力testing",
              time: "10:22:45",
              description: "攻击者构建可在目标定位期间使用的能力testing",
              references: [
                "https://attack.mitre.org/techniques/T1580/",
                "https://attack.mitre.org/techniques/T1580/001",
              ],
            },
          ],
        },
      ],
    },
  ],
  // Third update - Complete weaponization, start delivery
  [
    {
      id: "weapon",
      name: "武器化 (Weaponization)",
      status: "completed",
      attckStages: [
        {
          slug: "resource-development",
          name: "资源开发",
          techniques: [
            {
              id: "T1587",
              name: "开发能力",
              time: "10:22:45",
              description: "攻击者构建可在目标定位期间使用的能力",
              references: [
                "https://attack.mitre.org/techniques/T1587/",
                "https://attack.mitre.org/techniques/T1587/001",
              ],
            },
            {
              id: "T1588",
              name: "获取能力",
              time: "11:15:33",
              description: "攻击者购买和/或窃取能力",
              references: [
                "https://attack.mitre.org/techniques/T1588/",
                "https://attack.mitre.org/techniques/T1588/001",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "delivery",
      name: "投递 (Delivery)",
      status: "active",
      attckStages: [
        {
          slug: "initial-access",
          name: "初始访问",
          techniques: [
            {
              id: "T1566",
              name: "钓鱼攻击",
              time: "11:30:15",
              description: "攻击者发送钓鱼消息以获得访问权限",
              references: [
                "https://attack.mitre.org/techniques/T1566/",
                "https://attack.mitre.org/techniques/T1566/001",
              ],
            },
          ],
        },
      ],
    },
  ],
]

export default function Home() {
  const [currentData, setCurrentData] = useState<DynamicKillChainData[]>([])
  const [updateIndex, setUpdateIndex] = useState(0)
  const [resetKey, setResetKey] = useState(0) // Use resetKey instead of resetFlag

  const handleNextUpdate = () => {
    if (updateIndex < demoUpdates.length) {
      setCurrentData(demoUpdates[updateIndex])
      setUpdateIndex(updateIndex + 1)
    }
  }

  const handleReset = () => {
    setResetKey((prev) => prev + 1)
    setCurrentData([])
    setUpdateIndex(0)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">APT Kill Chain Analysis</h1>
          <p className="text-lg text-muted-foreground">Advanced Persistent Threat Attack Lifecycle Visualization</p>
        </div>

        {/* Demo Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>演示控制</CardTitle>
            <CardDescription>
              使用下面的按钮模拟动态数据更新，观察 Kill Chain 阶段如何实时点亮和更新。重置按钮将清空所有累积数据。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={handleNextUpdate} disabled={updateIndex >= demoUpdates.length} variant="default">
              下一步更新 ({updateIndex + 1}/{demoUpdates.length})
            </Button>
            <Button onClick={handleReset} variant="destructive">
              重置数据 (Reset)
            </Button>
          </CardContent>
        </Card>

        {/* Kill Chain Timeline */}
        <KillChainTimeline key={resetKey} dynamicData={currentData} />

        {/* Current Data Display */}
        {currentData.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>当前动态数据</CardTitle>
              <CardDescription>显示当前传入的动态数据结构，数据会自动去重累积</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">
                {JSON.stringify(currentData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
