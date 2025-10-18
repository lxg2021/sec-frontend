"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Shield, Server, Users, Settings, Lock, Database, ChevronLeft, ChevronRight, Eye, RefreshCw, Save, Check, AlertTriangle } from "lucide-react"
import CountUp from "@/components/dash/CountUp"

// 更新数据结构，修正total和compliant值
const categoryData = [
  {
    id: "account",
    name: "账号策略",
    icon: Users,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-300",
    total: 5, // 修正为实际项目数
    compliant: 3, // 修正为实际合规数
    nonCompliant: 2,
    items: [
      { id: "pwd_complexity", name: "密码复杂度策略", riskLevel: "低", category: "认证管理", required: true, enabled: true },
      { id: "account_lock", name: "账号锁定策略", riskLevel: "低", category: "认证管理", required: true, enabled: true },
      { id: "pwd_expire", name: "密码过期策略", riskLevel: "中", category: "认证管理", required: false, enabled: true },
      { id: "mfa", name: "多因素认证", riskLevel: "高", category: "认证管理", required: true, enabled: false },
      { id: "audit", name: "账号权限审计", riskLevel: "低", category: "审计管理", required: false, enabled: false },
    ],
  },
  // 其他分类做相同修正...
  // 为节省空间，这里只展示第一个分类的修改，实际代码中需要修正所有分类
];

export default function BaselineManager() {
  // ... 状态声明保持不变 ...

  // 修复：图标渲染问题 - 使用变量代替IIFE
  const renderCategoryIcon = () => {
    const Icon = selectedCategory.icon;
    return <Icon className={`h-6 w-6 ${selectedCategory.iconColor}`} />;
  };

  // 修复：分类切换逻辑 - 正确处理必需项
  const toggleCategoryStatus = (categoryId) => {
    setHasChanges(true);
    
    const updatedCategories = categories.map(category => {
      if (category.id === categoryId) {
        // 计算当前是否全部启用（忽略必需项的状态）
        const allNonRequiredEnabled = category.items
          .filter(item => !item.required)
          .every(item => item.enabled);
        
        // 切换状态：如果非必需项全部启用，则禁用所有非必需项；否则启用所有
        const updatedItems = category.items.map(item => ({
          ...item,
          enabled: item.required ? true : !allNonRequiredEnabled
        }));
        
        // 计算新的合规数量
        const compliantCount = updatedItems.filter(item => item.enabled).length;
        
        return {
          ...category,
          items: updatedItems,
          compliant: compliantCount
        };
      }
      return category;
    });
    
    setCategories(updatedCategories);
    
    if (selectedCategory && selectedCategory.id === categoryId) {
      const updatedCategory = updatedCategories.find(c => c.id === categoryId);
      if (updatedCategory) {
        setSelectedCategory(updatedCategory);
      }
    }
  };

  // 修复：分类状态计算逻辑
  const getCategoryStatus = (category) => {
    const requiredItems = category.items.filter(item => item.required);
    const nonRequiredItems = category.items.filter(item => !item.required);
    
    const allRequiredEnabled = requiredItems.every(item => item.enabled);
    const allNonRequiredEnabled = nonRequiredItems.every(item => item.enabled);
    const anyNonRequiredEnabled = nonRequiredItems.some(item => item.enabled);
    
    // 必需项未全部启用 = 禁用状态
    if (!allRequiredEnabled) return "disabled";
    
    // 必需项全部启用且所有非必需项也启用 = 全部启用
    if (allNonRequiredEnabled) return "enabled";
    
    // 必需项全部启用且至少有一个非必需项启用 = 部分启用
    if (anyNonRequiredEnabled) return "partial";
    
    // 默认情况（只有必需项启用）= 部分启用
    return "partial";
  };

  return (
    <div className="w-full space-y-6">
      {/* ... 其他部分保持不变 ... */}
      
      {selectedCategory && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
          <Card className="bg-white border-gray-200 shadow-sm border-l-4 border-l-blue-500">
            <CardHeader className="pb-4">
              {/* ... 头部保持不变 ... */}
            </CardHeader>
            <CardContent>
              {/* ... 列表头部保持不变 ... */}
              
              {selectedCategory.items.map((item, index) => {
                // 计算是否可切换（必需项且已启用时不可切换）
                const isToggleDisabled = item.required && item.enabled;
                
                return (
                  <div
                    key={item.id}
                    className={`grid grid-cols-12 gap-4 items-center py-4 px-4 rounded-lg transition-colors duration-200 border-b border-gray-100 last:border-b-0 ${!item.enabled ? 'bg-gray-50' : 'hover:bg-blue-50'}`}
                  >
                    <div className="col-span-1 flex items-center justify-center">
                      <Switch 
                        checked={item.enabled} 
                        onCheckedChange={() => !isToggleDisabled && toggleItemStatus(selectedCategory.id, item.id)}
                        disabled={isToggleDisabled}
                        className={`${item.enabled ? 'bg-blue-500' : 'bg-gray-300'} ${isToggleDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    
                    {/* ... 其他列保持不变 ... */}
                  </div>
                )
              })}
            </CardContent>
            <CardFooter className="flex justify-end pt-4">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  {selectedCategory.compliant} / {selectedCategory.total} 项启用
                </div>
                <Button 
                  variant="secondary"
                  onClick={() => toggleCategoryStatus(selectedCategory.id)}
                >
                  {getCategoryStatus(selectedCategory) === "enabled" 
                    ? "禁用非必需项" 
                    : "启用全部"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
      
      {/* 修复：进度条动画问题 */}
      {currentPageData.map((category, index) => {
        const complianceRate = getComplianceRate(category.compliant, category.total);
        
        return (
          <Card key={category.id} /* ... */>
            {/* ... */}
            <CardContent className="p-4">
              {/* ... */}
              <div className="w-full space-y-2">
                {/* ... */}
                <Progress 
                  value={complianceRate} 
                  className="w-full h-2 bg-gray-200"
                  indicatorClassName={`transition-all duration-1000 ${
                    isSelected
                      ? "bg-blue-500"
                      : complianceRate >= 90
                        ? "bg-green-500"
                        : complianceRate >= 80
                          ? "bg-blue-500"
                          : "bg-orange-500"
                  }`}
                  style={{
                    transitionDelay: `${index * 100 + 300}ms`,
                  }}
                />
              </div>
              {/* ... */}
            </CardContent>
          </Card>
        )
      })}
      
      {/* 修复：图标渲染 */}
      {selectedCategory && (
        <div className="space-y-6">
          {/* ... */}
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-4">
              <div className={`p-3 ${selectedCategory.iconBg} rounded-lg`}>
                {renderCategoryIcon()}
              </div>
              {/* ... */}
            </div>
          </CardHeader>
          {/* ... */}
        </div>
      )}
    </div>
  )
}