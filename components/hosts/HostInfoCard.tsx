import React from 'react';
import {
  CircleDashed,
  Cpu,
  HardDrive,
  MemoryStick,
  Monitor,
  Server,
  Network,
} from 'lucide-react';

// 字段配置数组，key 与 node 对应字段匹配
const infoFields = [
  { label: '操作系统', key: 'os', icon: Monitor },
  { label: '位置', key: 'hostname', icon: CircleDashed },
  { label: 'CPU', key: 'cpu', icon: Cpu },
  { label: '内存', key: 'memory', icon: MemoryStick },
  { label: '存储', key: 'disk', icon: HardDrive },
  { label: 'IP地址', key: 'ip', icon: Network },
  { label: 'MAC地址', key: 'mac', icon: Network },
];

// 状态指示器组件，向左移距离避免和关闭按钮重叠
const StatusIndicator = ({ status }: { status: string }) => {
  const isOnline = status.toLowerCase() === 'online';

  return (
    <div className="flex items-center space-x-1 text-sm font-medium mr-8">
      <span
        className={`inline-block h-3 w-3 rounded-full ${
          isOnline ? 'bg-green-500 animate-blink' : 'bg-gray-400'
        }`}
      />
      <span className={isOnline ? 'text-green-600' : 'text-gray-500'}>
        {isOnline ? '在线' : '离线'}
      </span>
    </div>
  );
};

// 主组件（接受 node 结构）
export const HostInfoCard = ({ node }: { node: any }) => {
  if (!node || node.type !== 'host') return null;

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
      <div className={`p-4 ${node.status.toLowerCase() === 'online' ? 'bg-blue-50' : 'bg-gray-100'}`}>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <Server className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-bold text-lg">{node.name}</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">{node.hostId}</p>
          </div>
          {/* 这里状态指示器加了 mr-8，避免和右上关闭按钮重叠 */}
          <StatusIndicator status={node.status} />
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        {infoFields.map(({ label, key, icon: Icon }) => (
          <div className="flex items-start" key={key}>
            {Icon ? (
              <Icon className="h-4 w-4 text-gray-500 mr-2 mt-1" />
            ) : (
              <div className="h-4 w-4 mr-2 flex items-center justify-center text-xs text-gray-500 mt-1">•</div>
            )}
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="font-medium break-all">
                {node[key] ?? <span className="text-gray-400">—</span>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
