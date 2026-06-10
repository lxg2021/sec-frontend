"use client";

import { AttackGraphNode } from "./attack-graph-node";

interface AttackGraphNodeGalleryItem {
  entityType: string;
  title: string;
  domain: string;
  includes?: string[];
}

const NODE_GALLERY_ITEMS: AttackGraphNodeGalleryItem[] = [
  { entityType: "Bits", title: "Bits", domain: "BITS 任务" },
  {
    entityType: "CredentialTheft",
    title: "CredentialTheft",
    domain: "凭据窃取",
  },
  { entityType: "Crypto", title: "Crypto", domain: "加密行为" },
  { entityType: "Device", title: "Device", domain: "设备" },
  { entityType: "DnsName", title: "DnsName", domain: "DNS 名称" },
  { entityType: "File", title: "File", domain: "文件" },
  { entityType: "FileStream", title: "FileStream", domain: "文件流 / ADS" },
  { entityType: "Host", title: "Host", domain: "主机" },
  { entityType: "HostRef", title: "HostRef", domain: "远端主机引用" },
  { entityType: "Mbr", title: "Mbr", domain: "MBR" },
  { entityType: "MessageHook", title: "MessageHook", domain: "消息钩子" },
  { entityType: "NetAddress", title: "NetAddress", domain: "网络地址" },
  { entityType: "NetEndpoint", title: "NetEndpoint", domain: "网络端点" },
  {
    entityType: "PowerShellExecution",
    title: "PowerShellExecution",
    domain: "PowerShell 执行",
  },
  { entityType: "Process", title: "Process", domain: "进程" },
  { entityType: "Service", title: "Service", domain: "服务" },
  {
    entityType: "Task",
    title: "Task",
    domain: "计划任务 / Scheduled Job",
    includes: ["Task", "ScheduledJob"],
  },
  {
    entityType: "TokenImpersonation",
    title: "TokenImpersonation",
    domain: "Token impersonation",
  },
  { entityType: "URLResource", title: "URLResource", domain: "URL 资源" },
  { entityType: "Volume", title: "Volume", domain: "卷" },
  {
    entityType: "Account",
    title: "Account",
    domain: "账号 / 账号组",
    includes: ["Account", "AccountGroup"],
  },
  {
    entityType: "FileMapping",
    title: "IPC Object",
    domain: "文件映射 / IPC",
    includes: ["FileMapping", "MailSlot", "NamedEvent", "NamedPipe"],
  },
  {
    entityType: "WmiClass",
    title: "WMI",
    domain: "WMI",
    includes: ["WmiClass", "WmiConsumer", "WmiExecute", "WmiFilter", "WmiQuery"],
  },
  {
    entityType: "RegistryKey",
    title: "Registry",
    domain: "注册表",
    includes: ["RegistryKey", "RegistryValue"],
  },
];

export function AttackGraphNodeGallery() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
      {NODE_GALLERY_ITEMS.map((item) => (
        <div
          key={item.title}
          className="flex min-h-[126px] flex-col items-center justify-start rounded-md border border-slate-200 bg-slate-50/70 px-2 py-3"
        >
          <AttackGraphNode
            data={{
              key: `gallery:${item.entityType}`,
              entityType: item.entityType,
              displayName: item.title,
            }}
            showEntityType={false}
          />
          <div className="mt-2 w-full text-center">
            <div className="truncate text-[11px] font-medium leading-4 text-slate-700">
              {item.domain}
            </div>
            {item.includes ? (
              <div className="mt-1 line-clamp-2 text-[10px] leading-3 text-slate-400">
                {item.includes.join(" / ")}
              </div>
            ) : (
              <div className="mt-1 text-[10px] leading-3 text-slate-400">
                {item.entityType}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default AttackGraphNodeGallery;
