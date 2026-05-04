"use client"

export default function ComplianceMap() {
  const regions = [
    { name: "华北", compliance: 92, color: "bg-gray-800" },
    { name: "华东", compliance: 88, color: "bg-gray-600" },
    { name: "华南", compliance: 85, color: "bg-gray-500" },
    { name: "西南", compliance: 78, color: "bg-gray-400" },
    { name: "西北", compliance: 82, color: "bg-gray-500" },
  ]

  return (
    <div className="space-y-6">
      {/* 简化的地图区域 */}
      <div className="relative bg-gray-50 rounded-lg p-6 h-48 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
          {regions.map((region, index) => (
            <div
              key={region.name}
              className={`${region.color} rounded-lg p-3 text-white text-center transition-all duration-300 hover:scale-105`}
              style={{
                animationDelay: `${index * 200}ms`,
              }}
            >
              <div className="text-xs font-medium">{region.name}</div>
              <div className="text-lg font-semibold mt-1">{region.compliance}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>低合规率</span>
        <div className="flex space-x-1">
          <div className="w-3 h-3 bg-gray-200 rounded" />
          <div className="w-3 h-3 bg-gray-400 rounded" />
          <div className="w-3 h-3 bg-gray-600 rounded" />
          <div className="w-3 h-3 bg-gray-800 rounded" />
        </div>
        <span>高合规率</span>
      </div>
    </div>
  )
}
