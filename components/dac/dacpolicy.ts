/**
 * dacpolicy.ts
 *
 * 定义访问控制策略 (DAC Policy) 的结构与模板生成器。
 * 包含：
 *  1. 文件策略 (fs)
 *  2. 注册表策略 (reg)
 *  3. 进程策略 (ps)
 *  4. 网络策略 (net)
 */

import { crypto } from "crypto"

export type PolicyType = "fs" | "reg" | "ps" | "net"

/** 策略通用头部结构 */
export interface PolicyHeader {
  version: string
  from: string
  to: string
  id: string
  group: string
  type: PolicyType
  name: string
  level: number
  domain: string
  time: string
}

/** 通用策略主体字段 */
export interface PolicyBaseBody {
  except?: PolicySubject
  subject: PolicySubject
  object: PolicyObject
  prompt?: PolicyAction
  reject?: PolicyAction
  audit?: PolicyAction
}

/** 通用主体定义（进程或其他类型） */
export interface PolicySubject {
  type: string
  source: string
}

/** 通用客体定义（文件、注册表、进程等） */
export interface PolicyObject {
  type: string
  source: string
}

/** 行为动作 */
export interface PolicyAction {
  action: string
}

/** ========== 1. 文件策略 (fs) ========== */
export interface FilePolicy {
  header: PolicyHeader & { type: "fs" }
  body: PolicyBaseBody
}

/** 文件行为动作
 * 新建: n
 * 删除: d
 * 移动: m
 * 重命名: t
 * 设置: s
 * 打开: o
 * 执行: x
 * 读取: r
 * 写入: w
 */

/** ========== 2. 注册表策略 (reg) ========== */
export interface RegistryPolicy {
  header: PolicyHeader & { type: "reg" }
  body: PolicyBaseBody
}

/** 注册表行为动作
 * 新建键: n
 * 删除键/值: d
 * 查询键/值: q
 * 重命名键: t
 * 设置值: s
 * 打开键: o
 * 枚举键/值: e
 */

/** ========== 3. 进程策略 (ps) ========== */
export interface ProcessPolicy {
  header: PolicyHeader & { type: "ps" }
  body: PolicyBaseBody
}

/** 进程行为动作
 * 创建进程: n
 * 结束进程: d
 * 打开进程: o
 * 分配内存: l
 * 写内存: w
 */

/** ========== 4. 网络策略 (net) ========== */
export interface NetworkPolicy {
  header: PolicyHeader & { type: "net" }
  body: NetworkPolicyBody
}

/** 网络策略主体 */
export interface NetworkPolicyBody {
  rule: NetRule
  protocol: NetProtocol
  address: NetAddress
  program: NetProgram
}

/** 网络规则 */
export interface NetRule {
  direction: "in" | "out"
  action: "allow" | "block" | "bypass"
  profile: "domain" | "private" | "public" | "any"
}

/** 网络协议配置 */
export interface NetProtocol {
  type: "tcp" | "udp" | "icmp" | "any"
  localport: string
  remoteport: string
}

/** 地址范围 */
export interface NetAddress {
  local: string
  remote: string
}

/** 关联程序 */
export interface NetProgram {
  path: string // 程序完整路径或通配符，支持多条，分号分割
}

/** ========== 默认模板生成函数 ========== */

/** 获取通用头部 */
function createHeader(type: PolicyType, name: string): PolicyHeader {
  return {
    version: "1.0",
    from: "system",
    to: "",
    id: crypto.randomUUID(),
    group: "",
    type,
    name,
    level: 50,
    domain: "",
    time: new Date().toISOString(),
  }
}

/** 文件策略模板 */
export function createFilePolicy(name: string): FilePolicy {
  return {
    header: createHeader("fs", name),
    body: {
      except: { type: "ps", source: "" },
      subject: { type: "ps", source: "" },
      object: { type: "fs", source: "" },
      prompt: { action: "" },
      reject: { action: "" },
      audit: { action: "" },
    },
  }
}

/** 注册表策略模板 */
export function createRegistryPolicy(name: string): RegistryPolicy {
  return {
    header: createHeader("reg", name),
    body: {
      except: { type: "ps", source: "" },
      subject: { type: "ps", source: "" },
      object: { type: "rg", source: "" },
      prompt: { action: "" },
      reject: { action: "" },
      audit: { action: "" },
    },
  }
}

/** 进程策略模板 */
export function createProcessPolicy(name: string): ProcessPolicy {
  return {
    header: createHeader("ps", name),
    body: {
      except: { type: "ps", source: "" },
      subject: { type: "ps", source: "" },
      object: { type: "ps", source: "" },
      prompt: { action: "" },
      reject: { action: "" },
      audit: { action: "" },
    },
  }
}

/** 网络策略模板 */
export function createNetworkPolicy(name: string): NetworkPolicy {
  return {
    header: createHeader("net", name),
    body: {
      rule: {
        direction: "in",
        action: "allow",
        profile: "any",
      },
      protocol: {
        type: "tcp",
        localport: "80,443,8080",
        remoteport: "any",
      },
      address: {
        local: "any",
        remote: "192.168.1.0/24",
      },
      program: {
        path: "C:\\Program Files\\App\\app.exe",
      },
    },
  }
}

/** 导出所有策略类型联合 */
export type DacPolicy = FilePolicy | RegistryPolicy | ProcessPolicy | NetworkPolicy
