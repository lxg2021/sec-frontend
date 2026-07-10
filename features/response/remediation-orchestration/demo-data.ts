"use client"

import type {
  CreateRemediationPreviewRequest,
  RemediationActionContext,
  RemediationActionInput,
  RemediationActionOption,
  RemediationCandidateNode,
  RemediationExecutionTargetSummary,
  RemediationPreviewDetail,
  RemediationPreviewSnapshot,
  RemediationPreviewTargetInput,
  RemediationPreviewTargetSnapshot,
  RemediationPreviewTargetSummary,
  RemediationTargetSnapshot,
} from "./types"

export type DemoFieldType = "text" | "number" | "boolean"
export type DemoValues = Record<string, string | number | boolean>
export type DemoActionMode = "forward" | "reverse" | "account_delete" | "account_reset_password"

export interface DemoField {
  key: string
  label: string
  type: DemoFieldType
  defaultValue: string | number | boolean
  placeholder?: string
}

export interface RemediationPreviewDemoTemplate {
  id: string
  title: string
  englishTitle: string
  description: string
  targetType: string
  targetTypeValue: number
  objectType: "Command" | "Policy"
  actionCode: string
  actionType: string
  entityType: string
  snapshotKind: string
  snapshotBranch: string
  inputBranch: string
  cmdInfo: string
  targetFields: DemoField[]
  inputFields: DemoField[]
  buildSnapshot: (values: DemoValues) => RemediationTargetSnapshot
  buildInput: (values: DemoValues) => RemediationActionInput | undefined
}

export interface DemoActionVariant {
  mode: DemoActionMode
  actionCode: string
  displayName: string
  actionType: string
  inputBranch: string
  requiresHistory: boolean
  contextType?: number
  sourceActionCode?: string
  contextFields: DemoField[]
  inputFields?: DemoField[]
  buildInput: (values: DemoValues) => RemediationActionInput | undefined
}

export const remediationDemoCommonFields: DemoField[] = [
  { key: "tenant_id", label: "Tenant ID", type: "text", defaultValue: "public" },
  { key: "case_id", label: "Case ID", type: "text", defaultValue: "case-demo-response-001" },
  { key: "workflow_id", label: "Workflow ID", type: "text", defaultValue: "wf-demo-response-001" },
  {
    key: "workflow_action_id",
    label: "Workflow Action ID",
    type: "text",
    defaultValue: "wfa-demo-remediation-001",
  },
  { key: "source_type", label: "Source Type", type: "text", defaultValue: "manual" },
  { key: "scope_type", label: "Scope Type", type: "text", defaultValue: "case" },
  { key: "scope_id", label: "Scope ID", type: "text", defaultValue: "case-demo-response-001" },
  { key: "expire_seconds", label: "Expire Seconds", type: "number", defaultValue: 600 },
  { key: "agent_id", label: "主机 ID", type: "text", defaultValue: "agent-demo-01" },
  { key: "hostname", label: "Hostname", type: "text", defaultValue: "win-lab-01" },
  { key: "node_key", label: "节点ID", type: "text", defaultValue: "" },
  { key: "target_display", label: "Target Display", type: "text", defaultValue: "" },
]

const processTargetFields: DemoField[] = [
  { key: "process_guid", label: "Process GUID", type: "text", defaultValue: "{6f7b0c9d-5501-4d2b-a714-000000000482}" },
  { key: "pid", label: "PID", type: "number", defaultValue: 4820 },
  { key: "process_name", label: "Process Name", type: "text", defaultValue: "powershell.exe" },
  {
    key: "process_path",
    label: "Process Path",
    type: "text",
    defaultValue: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
  },
  { key: "process_hash", label: "Process Hash", type: "text", defaultValue: "f2a4d6b8c1e3490a78f7a0bb4d72d3a1" },
  {
    key: "command_line",
    label: "Command Line",
    type: "text",
    defaultValue: "powershell.exe -NoProfile -ExecutionPolicy Bypass",
  },
]

const fileTargetFields: DemoField[] = [
  { key: "file_path", label: "File Path", type: "text", defaultValue: "C:\\Users\\Public\\Downloads\\payload.exe" },
  { key: "file_hash", label: "File Hash", type: "text", defaultValue: "44d88612fea8a8f36de82e1278abb02f" },
  { key: "stream_name", label: "Stream Name", type: "text", defaultValue: "payload.ps1" },
]

const restoreContextFields: DemoField[] = [
  { key: "source_task_id", label: "历史任务 ID", type: "text", defaultValue: "" },
  { key: "history_target_key", label: "历史目标 Key", type: "text", defaultValue: "" },
  { key: "backup_id", label: "Backup ID", type: "text", defaultValue: "" },
]

const bypassContextFields: DemoField[] = [
  { key: "source_task_id", label: "历史任务 ID", type: "text", defaultValue: "" },
  { key: "history_target_key", label: "历史目标 Key", type: "text", defaultValue: "" },
  { key: "policy_id", label: "Policy ID", type: "text", defaultValue: "" },
]

const enableContextFields: DemoField[] = [
  { key: "source_task_id", label: "历史任务 ID", type: "text", defaultValue: "" },
  { key: "history_target_key", label: "历史目标 Key", type: "text", defaultValue: "" },
]

function snapshotBase(values: DemoValues): Pick<RemediationTargetSnapshot, "host_id" | "hostname"> {
  return {
    host_id: text(values, "agent_id"),
    hostname: text(values, "hostname"),
  }
}

function buildProcessSnapshot(values: DemoValues): RemediationTargetSnapshot {
  return {
    ...snapshotBase(values),
    process: {
      process_guid: text(values, "process_guid"),
      pid: numberValue(values, "pid"),
      process_name: text(values, "process_name"),
      process_path: text(values, "process_path"),
      hash: text(values, "process_hash"),
      command_line: text(values, "command_line"),
    },
  }
}

function buildFileSnapshot(values: DemoValues): RemediationTargetSnapshot {
  return {
    ...snapshotBase(values),
    file: {
      file_path: text(values, "file_path"),
      file_hash: text(values, "file_hash"),
      ea_names: csv(values, "ea_names"),
      stream_name: text(values, "stream_name"),
      backup_id: text(values, "backup_id"),
    },
  }
}

export const remediationPreviewDemoTemplates: RemediationPreviewDemoTemplate[] = [
  {
    id: "process",
    title: "进程处置",
    englishTitle: "Process",
    description: "终止指定进程，snapshot.process 定位目标，input.process_terminate 控制终止范围",
    targetType: "PREVIEW_REMEDIATION_TARGET_TYPE_PROCESS",
    targetTypeValue: 1,
    objectType: "Command",
    actionCode: "process.terminate",
    actionType: "terminate",
    entityType: "Process",
    snapshotKind: "REMEDIATION_SNAPSHOT_KIND_PROCESS",
    snapshotBranch: "snapshot.process",
    inputBranch: "input.process_terminate",
    cmdInfo: "process",
    targetFields: processTargetFields,
    inputFields: [
      { key: "include_self", label: "Include Self", type: "boolean", defaultValue: true },
      { key: "include_children", label: "Include Children", type: "boolean", defaultValue: true },
    ],
    buildSnapshot: buildProcessSnapshot,
    buildInput: (values) => ({
      process_terminate: {
        include_self: bool(values, "include_self"),
        include_children: bool(values, "include_children"),
      },
    }),
  },
  {
    id: "file",
    title: "文件处置",
    englishTitle: "File",
    description: "隔离恶意文件，snapshot.file 定位文件，input.file_quarantine 控制隔离选项",
    targetType: "PREVIEW_REMEDIATION_TARGET_TYPE_FILE",
    targetTypeValue: 2,
    objectType: "Command",
    actionCode: "file.quarantine",
    actionType: "quarantine",
    entityType: "File",
    snapshotKind: "REMEDIATION_SNAPSHOT_KIND_FILE",
    snapshotBranch: "snapshot.file",
    inputBranch: "input.file_quarantine",
    cmdInfo: "file",
    targetFields: fileTargetFields,
    inputFields: [
      { key: "delete_original", label: "Delete Original", type: "boolean", defaultValue: true },
      { key: "storage", label: "Storage", type: "text", defaultValue: "local" },
      { key: "encrypt", label: "Encrypt", type: "boolean", defaultValue: true },
      { key: "suffix", label: "Suffix", type: "text", defaultValue: "qtn" },
    ],
    buildSnapshot: buildFileSnapshot,
    buildInput: (values) => ({
      file_quarantine: {
        delete_original: bool(values, "delete_original"),
        storage: text(values, "storage"),
        encrypt: bool(values, "encrypt"),
        suffix: text(values, "suffix"),
      },
    }),
  },
  {
    id: "scheduled-task",
    title: "计划任务处置",
    englishTitle: "Scheduled Task",
    description: "删除计划任务，snapshot.scheduled_task 定位任务，input.scheduled_task 控制执行选项",
    targetType: "PREVIEW_REMEDIATION_TARGET_TYPE_SCHEDULED_TASK",
    targetTypeValue: 3,
    objectType: "Command",
    actionCode: "scheduled_job.delete",
    actionType: "delete",
    entityType: "ScheduledJob",
    snapshotKind: "REMEDIATION_SNAPSHOT_KIND_SCHEDULED_TASK",
    snapshotBranch: "snapshot.scheduled_task",
    inputBranch: "input.scheduled_task",
    cmdInfo: "scheduled_task",
    targetFields: [
      { key: "task_name", label: "Task Name", type: "text", defaultValue: "\\Microsoft\\Windows\\Update\\UpdaterTask" },
      { key: "task_path", label: "Task Path", type: "text", defaultValue: "\\Microsoft\\Windows\\Update\\" },
    ],
    inputFields: [{ key: "force", label: "Force", type: "boolean", defaultValue: true }],
    buildSnapshot: (values) => ({
      ...snapshotBase(values),
      scheduled_task: {
        task_name: text(values, "task_name"),
        task_path: text(values, "task_path"),
        backup_id: text(values, "backup_id"),
      },
    }),
    buildInput: (values) => ({ scheduled_task: { force: bool(values, "force") } }),
  },
  {
    id: "service",
    title: "服务处置",
    englishTitle: "Service",
    description: "删除恶意服务，snapshot.service 定位服务，input.service 控制是否先停止服务",
    targetType: "PREVIEW_REMEDIATION_TARGET_TYPE_SERVICE",
    targetTypeValue: 4,
    objectType: "Command",
    actionCode: "service.delete",
    actionType: "delete",
    entityType: "Service",
    snapshotKind: "REMEDIATION_SNAPSHOT_KIND_SERVICE",
    snapshotBranch: "snapshot.service",
    inputBranch: "input.service",
    cmdInfo: "service",
    targetFields: [
      { key: "service_name", label: "Service Name", type: "text", defaultValue: "WinUpdateSvc" },
      { key: "display_name", label: "Display Name", type: "text", defaultValue: "Windows Update Helper" },
    ],
    inputFields: [{ key: "stop_before_delete", label: "Stop Before Delete", type: "boolean", defaultValue: true }],
    buildSnapshot: (values) => ({
      ...snapshotBase(values),
      service: {
        service_name: text(values, "service_name"),
        display_name: text(values, "display_name"),
        backup_id: text(values, "backup_id"),
      },
    }),
    buildInput: (values) => ({ service: { stop_before_delete: bool(values, "stop_before_delete") } }),
  },
  {
    id: "account",
    title: "账号处置",
    englishTitle: "Account",
    description: "禁用异常账号，snapshot.account 定位账号，input.account 控制是否注销会话",
    targetType: "PREVIEW_REMEDIATION_TARGET_TYPE_ACCOUNT",
    targetTypeValue: 5,
    objectType: "Command",
    actionCode: "account.disable",
    actionType: "disable",
    entityType: "Account",
    snapshotKind: "REMEDIATION_SNAPSHOT_KIND_ACCOUNT",
    snapshotBranch: "snapshot.account",
    inputBranch: "input.account",
    cmdInfo: "account",
    targetFields: [
      { key: "account_name", label: "Account Name", type: "text", defaultValue: "svc-backup" },
      { key: "domain", label: "Domain", type: "text", defaultValue: "WORKGROUP" },
      { key: "sid", label: "SID", type: "text", defaultValue: "S-1-5-21-1001-1002-1003-1105" },
    ],
    inputFields: [{ key: "force_logoff", label: "Force Logoff", type: "boolean", defaultValue: false }],
    buildSnapshot: (values) => ({
      ...snapshotBase(values),
      account: {
        account_name: text(values, "account_name"),
        domain: text(values, "domain"),
        sid: text(values, "sid"),
      },
    }),
    buildInput: (values) => ({ account: { force_logoff: bool(values, "force_logoff") } }),
  },
  {
    id: "registry",
    title: "注册表处置",
    englishTitle: "Registry",
    description: "删除注册表键，snapshot.registry 定位键值，input.registry 控制递归和失败策略",
    targetType: "PREVIEW_REMEDIATION_TARGET_TYPE_REGISTRY",
    targetTypeValue: 6,
    objectType: "Command",
    actionCode: "registry.delete_key",
    actionType: "composite",
    entityType: "RegistryKey",
    snapshotKind: "REMEDIATION_SNAPSHOT_KIND_REGISTRY",
    snapshotBranch: "snapshot.registry",
    inputBranch: "input.registry",
    cmdInfo: "registry",
    targetFields: [
      { key: "hive", label: "Hive", type: "text", defaultValue: "HKCU" },
      { key: "key_path", label: "Key Path", type: "text", defaultValue: "Software\\Microsoft\\Windows\\CurrentVersion\\Run\\Updater" },
      { key: "value_name", label: "Value Name", type: "text", defaultValue: "Updater" },
    ],
    inputFields: [
      { key: "recursive", label: "Recursive", type: "boolean", defaultValue: true },
      { key: "stop_on_failure", label: "Stop On Failure", type: "boolean", defaultValue: true },
    ],
    buildSnapshot: (values) => ({
      ...snapshotBase(values),
      registry: {
        hive: text(values, "hive"),
        key_path: text(values, "key_path"),
        value_name: text(values, "value_name"),
        backup_id: text(values, "backup_id"),
      },
    }),
    buildInput: (values) => ({
      registry: {
        recursive: bool(values, "recursive"),
        stop_on_failure: bool(values, "stop_on_failure"),
      },
    }),
  },
  {
    id: "wmi-class",
    title: "WMI Class处置",
    englishTitle: "WMI Class",
    description: "删除 WMI Class，snapshot.wmi_class 定位类，input.wmi_class 控制删除深度",
    targetType: "PREVIEW_REMEDIATION_TARGET_TYPE_WMI_CLASS",
    targetTypeValue: 7,
    objectType: "Command",
    actionCode: "wmi_class.delete",
    actionType: "delete",
    entityType: "WmiClass",
    snapshotKind: "REMEDIATION_SNAPSHOT_KIND_WMI_CLASS",
    snapshotBranch: "snapshot.wmi_class",
    inputBranch: "input.wmi_class",
    cmdInfo: "wmi_class",
    targetFields: [
      { key: "namespace", label: "Namespace", type: "text", defaultValue: "root\\subscription" },
      { key: "class_name", label: "Class Name", type: "text", defaultValue: "EvilPersistence" },
    ],
    inputFields: [
      { key: "delete_instances", label: "Delete Instances", type: "boolean", defaultValue: true },
      { key: "recursive_delete", label: "Recursive Delete", type: "boolean", defaultValue: false },
    ],
    buildSnapshot: (values) => ({
      ...snapshotBase(values),
      wmi_class: {
        namespace: text(values, "namespace"),
        class_name: text(values, "class_name"),
        backup_id: text(values, "backup_id"),
      },
    }),
    buildInput: (values) => ({
      wmi_class: {
        delete_instances: bool(values, "delete_instances"),
        recursive_delete: bool(values, "recursive_delete"),
      },
    }),
  },
  {
    id: "wmi-subscription",
    title: "WMI订阅处置",
    englishTitle: "WMI Subscription",
    description: "删除 WMI 订阅，snapshot.wmi_subscription 定位 filter/consumer",
    targetType: "PREVIEW_REMEDIATION_TARGET_TYPE_WMI_SUBSCRIPTION",
    targetTypeValue: 8,
    objectType: "Command",
    actionCode: "wmi_subscription.delete",
    actionType: "delete",
    entityType: "WmiFilter",
    snapshotKind: "REMEDIATION_SNAPSHOT_KIND_WMI_SUBSCRIPTION",
    snapshotBranch: "snapshot.wmi_subscription",
    inputBranch: "input.wmi_subscription",
    cmdInfo: "wmi_subscription",
    targetFields: [
      { key: "namespace", label: "Namespace", type: "text", defaultValue: "root\\subscription" },
      { key: "filter_name", label: "Filter Name", type: "text", defaultValue: "UpdaterFilter" },
      { key: "consumer_name", label: "Consumer Name", type: "text", defaultValue: "UpdaterConsumer" },
      { key: "consumer_type", label: "Consumer Type", type: "text", defaultValue: "CommandLineEventConsumer" },
    ],
    inputFields: [{ key: "remove_binding_only", label: "Remove Binding Only", type: "boolean", defaultValue: false }],
    buildSnapshot: (values) => ({
      ...snapshotBase(values),
      wmi_subscription: {
        namespace: text(values, "namespace"),
        filter_name: text(values, "filter_name"),
        consumer_name: text(values, "consumer_name"),
        consumer_type: text(values, "consumer_type"),
        backup_id: text(values, "backup_id"),
      },
    }),
    buildInput: (values) => ({
      wmi_subscription: { remove_binding_only: bool(values, "remove_binding_only") },
    }),
  },
  {
    id: "bits-job",
    title: "BITS Job处置",
    englishTitle: "BITS Job",
    description: "删除 BITS Job，snapshot.bits_job 定位任务，input.bits_job 控制强制执行",
    targetType: "PREVIEW_REMEDIATION_TARGET_TYPE_BITS_JOB",
    targetTypeValue: 9,
    objectType: "Command",
    actionCode: "bits.delete",
    actionType: "delete",
    entityType: "Bits",
    snapshotKind: "REMEDIATION_SNAPSHOT_KIND_BITS_JOB",
    snapshotBranch: "snapshot.bits_job",
    inputBranch: "input.bits_job",
    cmdInfo: "bits_job",
    targetFields: [
      { key: "job_id", label: "Job ID", type: "text", defaultValue: "{B2C43C42-1F6A-4F3D-8A4F-ABCD00000009}" },
      { key: "job_name", label: "Job Name", type: "text", defaultValue: "Windows Cache Sync" },
      { key: "remote_url", label: "Remote URL", type: "text", defaultValue: "https://example-cdn.invalid/update.dat" },
      {
        key: "local_files",
        label: "Local Files",
        type: "text",
        defaultValue: "C:\\ProgramData\\cache\\update.dat,C:\\ProgramData\\cache\\update.tmp",
      },
    ],
    inputFields: [{ key: "force", label: "Force", type: "boolean", defaultValue: true }],
    buildSnapshot: (values) => ({
      ...snapshotBase(values),
      bits_job: {
        job_id: text(values, "job_id"),
        job_name: text(values, "job_name"),
        remote_url: text(values, "remote_url"),
        local_files: csv(values, "local_files"),
        backup_id: text(values, "backup_id"),
      },
    }),
    buildInput: (values) => ({ bits_job: { force: bool(values, "force") } }),
  },
  {
    id: "file-ea",
    title: "文件EA处置",
    englishTitle: "File EA",
    description: "删除文件扩展属性，目标仍然来自 snapshot.file，扩展参数走 input.file_ea",
    targetType: "PREVIEW_REMEDIATION_TARGET_TYPE_FILE_EA",
    targetTypeValue: 10,
    objectType: "Command",
    actionCode: "file_ea.delete",
    actionType: "delete",
    entityType: "File",
    snapshotKind: "REMEDIATION_SNAPSHOT_KIND_FILE",
    snapshotBranch: "snapshot.file",
    inputBranch: "input.file_ea",
    cmdInfo: "file_ea",
    targetFields: [
      { key: "file_path", label: "File Path", type: "text", defaultValue: "C:\\ProgramData\\stage\\loader.dll" },
      { key: "file_hash", label: "File Hash", type: "text", defaultValue: "c8f0a1d9f2d64b6a8cb8c57e9e720101" },
      { key: "ea_names", label: "EA Names", type: "text", defaultValue: "Zone.Identifier, evil.meta" },
    ],
    inputFields: [{ key: "force", label: "Force", type: "boolean", defaultValue: true }],
    buildSnapshot: buildFileSnapshot,
    buildInput: (values) => ({ file_ea: { force: bool(values, "force") } }),
  },
  {
    id: "ntfs-ads",
    title: "NTFS ADS处置",
    englishTitle: "NTFS ADS",
    description: "删除 NTFS ADS，目标仍然来自 snapshot.file，扩展参数走 input.ntfs_ads",
    targetType: "PREVIEW_REMEDIATION_TARGET_TYPE_NTFS_ADS",
    targetTypeValue: 11,
    objectType: "Command",
    actionCode: "ntfs_ads.delete",
    actionType: "delete",
    entityType: "FileStream",
    snapshotKind: "REMEDIATION_SNAPSHOT_KIND_FILE",
    snapshotBranch: "snapshot.file",
    inputBranch: "input.ntfs_ads",
    cmdInfo: "ntfs_ads",
    targetFields: [
      { key: "file_path", label: "File Path", type: "text", defaultValue: "C:\\Users\\Public\\Documents\\invoice.docx" },
      { key: "stream_name", label: "Stream Name", type: "text", defaultValue: "payload.ps1" },
    ],
    inputFields: [{ key: "force", label: "Force", type: "boolean", defaultValue: true }],
    buildSnapshot: buildFileSnapshot,
    buildInput: (values) => ({ ntfs_ads: { force: bool(values, "force") } }),
  },
  {
    id: "proc-execute",
    title: "进程执行阻断",
    englishTitle: "Process Execute",
    description: "创建进程执行控制 Policy，目标来自 snapshot.process，扩展参数走 input.process_block",
    targetType: "PREVIEW_REMEDIATION_TARGET_TYPE_PROC_EXECUTE",
    targetTypeValue: 12,
    objectType: "Policy",
    actionCode: "process.block_execute",
    actionType: "block",
    entityType: "Process",
    snapshotKind: "REMEDIATION_SNAPSHOT_KIND_PROCESS",
    snapshotBranch: "snapshot.process",
    inputBranch: "input.process_block",
    cmdInfo: "process_block",
    targetFields: [
      { key: "process_guid", label: "Process GUID", type: "text", defaultValue: "" },
      { key: "pid", label: "PID", type: "number", defaultValue: 0 },
      { key: "process_name", label: "Process Name", type: "text", defaultValue: "payload.exe" },
      { key: "process_path", label: "Process Path", type: "text", defaultValue: "C:\\Users\\Public\\Downloads\\payload.exe" },
      { key: "process_hash", label: "Process Hash", type: "text", defaultValue: "44d88612fea8a8f36de82e1278abb02f" },
      { key: "command_line", label: "Command Line", type: "text", defaultValue: "" },
    ],
    inputFields: [
      { key: "subject_path", label: "Parent Process Path", type: "text", defaultValue: "" },
      { key: "subject_hash", label: "Subject Hash", type: "text", defaultValue: "" },
      { key: "object_path", label: "Object Path", type: "text", defaultValue: "C:\\Users\\Public\\Downloads\\payload.exe" },
      { key: "object_hash", label: "Object Hash", type: "text", defaultValue: "44d88612fea8a8f36de82e1278abb02f" },
      { key: "except_path", label: "Except Path", type: "text", defaultValue: "" },
      { key: "except_hash", label: "Except Hash", type: "text", defaultValue: "" },
      { key: "audit", label: "Audit", type: "boolean", defaultValue: true },
    ],
    buildSnapshot: buildProcessSnapshot,
    buildInput: (values) => ({
      process_block: {
        subject_path: text(values, "subject_path"),
        subject_hash: text(values, "subject_hash"),
        object_path: text(values, "object_path"),
        object_hash: text(values, "object_hash"),
        except_path: text(values, "except_path"),
        except_hash: text(values, "except_hash"),
        audit: bool(values, "audit"),
      },
    }),
  },
  {
    id: "net-quarantine",
    title: "网络阻断处置",
    englishTitle: "Network Quarantine",
    description: "创建网络访问控制 Policy，snapshot.network 定位连接，input.net_block 控制方向",
    targetType: "PREVIEW_REMEDIATION_TARGET_TYPE_NET_QUARANTINE",
    targetTypeValue: 13,
    objectType: "Policy",
    actionCode: "net.block",
    actionType: "block",
    entityType: "NetEndpoint",
    snapshotKind: "REMEDIATION_SNAPSHOT_KIND_NETWORK",
    snapshotBranch: "snapshot.network",
    inputBranch: "input.net_block",
    cmdInfo: "net_block",
    targetFields: [
      { key: "local_address", label: "Local Address", type: "text", defaultValue: "10.0.5.23" },
      { key: "remote_address", label: "Remote Address", type: "text", defaultValue: "203.0.113.45" },
      { key: "protocol", label: "Protocol", type: "text", defaultValue: "tcp" },
      { key: "local_port", label: "Local Port", type: "text", defaultValue: "49820" },
      { key: "remote_port", label: "Remote Port", type: "text", defaultValue: "443" },
    ],
    inputFields: [{ key: "direction", label: "Direction", type: "text", defaultValue: "out" }],
    buildSnapshot: (values) => ({
      ...snapshotBase(values),
      network: {
        local_address: text(values, "local_address"),
        remote_address: text(values, "remote_address"),
        protocol: text(values, "protocol"),
        local_port: text(values, "local_port"),
        remote_port: text(values, "remote_port"),
        policy_id: text(values, "policy_id"),
      },
    }),
    buildInput: (values) => ({ net_block: { direction: text(values, "direction") } }),
  },
]

const reverseVariantConfig: Record<
  string,
  Omit<DemoActionVariant, "mode" | "buildInput">
> = {
  file: {
    actionCode: "file.restore",
    displayName: "恢复文件",
    actionType: "restore",
    inputBranch: "action_context.backup_id",
    requiresHistory: true,
    contextType: 1,
    sourceActionCode: "file.quarantine",
    contextFields: restoreContextFields,
  },
  "scheduled-task": {
    actionCode: "task.restore",
    displayName: "恢复计划任务",
    actionType: "restore",
    inputBranch: "action_context.backup_id",
    requiresHistory: true,
    contextType: 1,
    sourceActionCode: "scheduled_job.delete",
    contextFields: restoreContextFields,
  },
  service: {
    actionCode: "service.restore",
    displayName: "恢复服务",
    actionType: "restore",
    inputBranch: "action_context.backup_id",
    requiresHistory: true,
    contextType: 1,
    sourceActionCode: "service.delete",
    contextFields: restoreContextFields,
  },
  account: {
    actionCode: "account.enable",
    displayName: "启用账号",
    actionType: "enable",
    inputBranch: "action_context.source_task_id",
    requiresHistory: true,
    contextType: 3,
    sourceActionCode: "account.disable",
    contextFields: enableContextFields,
  },
  registry: {
    actionCode: "registry.restore",
    displayName: "恢复注册表",
    actionType: "restore",
    inputBranch: "action_context.backup_id",
    requiresHistory: true,
    contextType: 1,
    sourceActionCode: "registry.delete_key",
    contextFields: restoreContextFields,
  },
  "wmi-class": {
    actionCode: "wmi_class.restore",
    displayName: "恢复 WMI Class",
    actionType: "restore",
    inputBranch: "action_context.backup_id",
    requiresHistory: true,
    contextType: 1,
    sourceActionCode: "wmi_class.delete",
    contextFields: restoreContextFields,
  },
  "wmi-subscription": {
    actionCode: "wmi_subscription.restore",
    displayName: "恢复 WMI 订阅",
    actionType: "restore",
    inputBranch: "action_context.backup_id",
    requiresHistory: true,
    contextType: 1,
    sourceActionCode: "wmi_subscription.delete",
    contextFields: restoreContextFields,
  },
  "bits-job": {
    actionCode: "bits.restore",
    displayName: "恢复 BITS Job",
    actionType: "restore",
    inputBranch: "action_context.backup_id",
    requiresHistory: true,
    contextType: 1,
    sourceActionCode: "bits.delete",
    contextFields: restoreContextFields,
  },
  "file-ea": {
    actionCode: "file_ea.restore",
    displayName: "恢复文件 EA",
    actionType: "restore",
    inputBranch: "action_context.backup_id",
    requiresHistory: true,
    contextType: 1,
    sourceActionCode: "file_ea.delete",
    contextFields: restoreContextFields,
  },
  "ntfs-ads": {
    actionCode: "ntfs_ads.restore",
    displayName: "恢复 NTFS ADS",
    actionType: "restore",
    inputBranch: "action_context.backup_id",
    requiresHistory: true,
    contextType: 1,
    sourceActionCode: "ntfs_ads.delete",
    contextFields: restoreContextFields,
  },
  "proc-execute": {
    actionCode: "process.bypass_execute",
    displayName: "放行进程执行",
    actionType: "bypass",
    inputBranch: "action_context.policy_id",
    requiresHistory: true,
    contextType: 2,
    sourceActionCode: "process.block_execute",
    contextFields: bypassContextFields,
  },
  "net-quarantine": {
    actionCode: "net.bypass",
    displayName: "放行网络策略",
    actionType: "bypass",
    inputBranch: "action_context.policy_id",
    requiresHistory: true,
    contextType: 2,
    sourceActionCode: "net.block",
    contextFields: bypassContextFields,
  },
}

export function demoActionVariants(
  template: RemediationPreviewDemoTemplate,
): DemoActionVariant[] {
  const forward: DemoActionVariant = {
    mode: "forward",
    actionCode: template.actionCode,
    displayName: template.title,
    actionType: template.actionType,
    inputBranch: template.inputBranch,
    requiresHistory: false,
    contextFields: [],
    inputFields: template.inputFields,
    buildInput: template.buildInput,
  }
  const variants = [forward]
  if (template.id === "account") {
    variants.push(
      {
        mode: "account_delete",
        actionCode: "account.delete",
        displayName: "删除账号",
        actionType: "delete",
        inputBranch: template.inputBranch,
        requiresHistory: false,
        contextFields: [],
        inputFields: [
          { key: "force_logoff", label: "Force Logoff", type: "boolean", defaultValue: false },
        ],
        buildInput: (values) => ({ account: { force_logoff: bool(values, "force_logoff") } }),
      },
      {
        mode: "account_reset_password",
        actionCode: "account.reset_password",
        displayName: "重置密码",
        actionType: "reset_password",
        inputBranch: template.inputBranch,
        requiresHistory: false,
        contextFields: [],
        inputFields: [
          {
            key: "new_password",
            label: "New Password",
            type: "text",
            defaultValue: "Secure@2026!Admin#Reset",
          },
          {
            key: "force_change_at_next_logon",
            label: "Force Change Next Logon",
            type: "boolean",
            defaultValue: true,
          },
          { key: "unlock_account", label: "Unlock Account", type: "boolean", defaultValue: true },
        ],
        buildInput: (values) => ({
          account: {
            new_password: text(values, "new_password"),
            force_change_at_next_logon: bool(values, "force_change_at_next_logon"),
            unlock_account: bool(values, "unlock_account"),
          },
        }),
      },
    )
  }
  const reverseConfig = reverseVariantConfig[template.id]
  if (reverseConfig) {
    variants.push({
      ...reverseConfig,
      mode: "reverse",
      inputFields: [],
      buildInput: () => undefined,
    })
  }
  return variants
}

export function resolveDemoActionVariant(
  template: RemediationPreviewDemoTemplate,
  mode: DemoActionMode,
): DemoActionVariant {
  return (
    demoActionVariants(template).find((variant) => variant.mode === mode) ??
    demoActionVariants(template)[0]
  )
}

export function defaultDemoValues(
  template: RemediationPreviewDemoTemplate,
  mode: DemoActionMode = "forward",
): DemoValues {
  const values: DemoValues = {}
  const variant = resolveDemoActionVariant(template, mode)
  for (const field of remediationDemoCommonFields) values[field.key] = field.defaultValue
  for (const field of template.targetFields) values[field.key] = field.defaultValue
  for (const field of template.inputFields) values[field.key] = field.defaultValue
  for (const field of variant.inputFields ?? []) values[field.key] = field.defaultValue
  for (const field of variant.contextFields) {
    values[field.key] = field.defaultValue
  }
  values.node_key = `${template.id}:agent-demo-01:demo-object`
  values.target_display = defaultDisplay(template, values)
  values.scope_id = text(values, "case_id")
  applyDefaultActionContextValues(template, values, mode)
  return values
}

export function buildDemoNode(
  template: RemediationPreviewDemoTemplate,
  values: DemoValues,
  mode: DemoActionMode = "forward",
): RemediationCandidateNode {
  const variant = resolveDemoActionVariant(template, mode)
  return {
    node_key: text(values, "node_key"),
    entity_type: template.entityType,
    display_name: text(values, "target_display") || defaultDisplay(template, values),
    description: `${template.snapshotBranch} -> ${variant.inputBranch} -> ${template.cmdInfo}`,
    resolve_status: "resolved",
    agent_ids: [text(values, "agent_id")].filter(Boolean),
    snapshot: template.buildSnapshot(values),
  }
}

export function buildDemoAction(
  template: RemediationPreviewDemoTemplate,
  values: DemoValues = defaultDemoValues(template),
  mode: DemoActionMode = "forward",
): RemediationActionOption {
  const variant = resolveDemoActionVariant(template, mode)
  return {
    action_code: variant.actionCode,
    display_name: variant.displayName,
    action_type: variant.actionType,
    requires_agent: true,
    requires_history: variant.requiresHistory,
    required_snapshot_kind: template.snapshotKind,
    contexts: variant.requiresHistory
      ? [buildDemoActionContext(template, values, variant)]
      : [],
  }
}

export function buildDemoCreateRequest(
  template: RemediationPreviewDemoTemplate,
  values: DemoValues,
  mode: DemoActionMode = "forward",
): CreateRemediationPreviewRequest {
  return {
    request_id: `demo-create-preview-${template.id}`,
    tenant_id: text(values, "tenant_id"),
    expire_seconds: numberValue(values, "expire_seconds"),
    workflow_id: text(values, "workflow_id"),
    workflow_action_id: text(values, "workflow_action_id"),
    case_id: text(values, "case_id"),
    source_type: text(values, "source_type"),
    scope_type: text(values, "scope_type"),
    scope_id: text(values, "scope_id"),
    targets: [buildDemoTarget(template, values, mode)],
  }
}

export function buildDemoTarget(
  template: RemediationPreviewDemoTemplate,
  values: DemoValues,
  mode: DemoActionMode = "forward",
): RemediationPreviewTargetInput {
  const variant = resolveDemoActionVariant(template, mode)
  const context = variant.requiresHistory
    ? buildDemoActionContext(template, values, variant)
    : undefined
  return {
    node_key: text(values, "node_key"),
    entity_type: template.entityType,
    action_code: variant.actionCode,
    agents: [{ agent_id: text(values, "agent_id"), action_context: context }],
    target_display: text(values, "target_display") || defaultDisplay(template, values),
    snapshot: template.buildSnapshot(values),
    input: variant.buildInput(values),
  }
}

export function buildDemoPreviewSnapshot(
  template: RemediationPreviewDemoTemplate,
  values: DemoValues,
  request: CreateRemediationPreviewRequest,
  mode: DemoActionMode = "forward",
): RemediationPreviewSnapshot {
  const variant = resolveDemoActionVariant(template, mode)
  const target = buildDemoPreviewTarget(template, values, 0, mode)
  return {
    tenant_id: request.tenant_id || "public",
    preview_id: `preview-demo-${template.id}-${Date.now()}`,
    source_request_id: request.request_id,
    preview_status: "created",
    workflow_id: request.workflow_id || "",
    source_type: request.source_type || "",
    scope_type: request.scope_type || "",
    scope_id: request.scope_id || "",
    target_type: template.targetTypeValue,
    action_type: variant.actionType,
    plan_status: 1,
    created_by: "response-demo",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + numberValue(values, "expire_seconds") * 1000).toISOString(),
    plan: {
      action_type: variant.actionType,
      target_type: template.targetTypeValue,
      object_type: template.objectType === "Policy" ? 2 : 1,
      object_id: `${template.objectType.toLowerCase()}-${template.id}-preview`,
      object_version: "1.0.0",
      plan_status: 1,
      targets: [target],
      summary: {
        total_count: 1,
        available_count: 1,
        skipped_count: 0,
        invalid_count: 0,
      },
    },
    canceled_by: "",
    cancel_reason: "",
    canceled_at: "",
    workflow_action_id: request.workflow_action_id || "",
    case_id: request.case_id || "",
  }
}

export function buildDemoPreviewDetail(
  template: RemediationPreviewDemoTemplate,
  values: DemoValues,
  preview: RemediationPreviewSnapshot,
  mode: DemoActionMode = "forward",
): RemediationPreviewDetail {
  const previewTarget = buildDemoPreviewTarget(template, values, 0, mode)
  const previewSummary: RemediationPreviewTargetSummary = {
    total_count: 1,
    will_apply_count: 1,
    skipped_count: 0,
  }
  const targetSummary: RemediationExecutionTargetSummary = {
    total_count: 0,
    created_count: 0,
    dispatched_count: 0,
    running_count: 0,
    success_count: 0,
    failed_count: 0,
    skipped_count: 0,
  }
  return {
    tenant_id: preview.tenant_id,
    preview_id: preview.preview_id,
    execution_id: "",
    preview,
    preview_targets: [previewTarget],
    execution: null,
    preview_target_summary: previewSummary,
    target_summary: targetSummary,
    stats: {
      preview_stats: {
        total_count: 1,
        created_count: 1,
        confirmed_count: 0,
        canceled_count: 0,
        expired_count: 0,
      },
      execution_stats: targetSummary,
    },
  }
}

function buildDemoPreviewTarget(
  template: RemediationPreviewDemoTemplate,
  values: DemoValues,
  index: number,
  mode: DemoActionMode = "forward",
): RemediationPreviewTargetSnapshot {
  const variant = resolveDemoActionVariant(template, mode)
  const display = text(values, "target_display") || defaultDisplay(template, values)
  const agentID = text(values, "agent_id")
  const identifier = JSON.stringify(targetIdentifier(template, values, mode))
  return {
    target_index: index,
    agent_id: agentID,
    node_keys: [text(values, "node_key")],
    rule_id: `demo-rule-${template.id}`,
    target_key: `${template.id}:${agentID}:${safeKey(display)}`,
    target_identifier: identifier,
    target_display: display,
    dedupe_status: 1,
    dedupe_reason: variant.requiresHistory
      ? "history context matched"
      : "demo available",
    will_apply: true,
    existing_task_id: "",
    validation_status: 1,
    validation_reason: variant.requiresHistory
      ? "action_context validated"
      : "demo validation passed",
    backup_id: text(values, "backup_id"),
  }
}

function targetIdentifier(
  template: RemediationPreviewDemoTemplate,
  values: DemoValues,
  mode: DemoActionMode = "forward",
): Record<string, unknown> {
  const variant = resolveDemoActionVariant(template, mode)
  const snapshot = template.buildSnapshot(values) as Record<string, unknown>
  const branch = template.snapshotBranch.replace("snapshot.", "")
  return {
    target_type: template.targetType,
    action_type: variant.actionType,
    [branch]: snapshot[branch],
  }
}

function buildDemoActionContext(
  template: RemediationPreviewDemoTemplate,
  values: DemoValues,
  variant: DemoActionVariant,
): RemediationActionContext {
  const display = text(values, "target_display") || defaultDisplay(template, values)
  const sourceTaskID =
    text(values, "source_task_id") ||
    `task-${variant.sourceActionCode ?? template.actionCode}-${template.id}-001`
  const targetKey =
    text(values, "history_target_key") ||
    `${template.id}:${text(values, "agent_id")}:${safeKey(display)}`
  const backupID =
    text(values, "backup_id") ||
    (variant.contextType === 1 ? `backup-${template.id}-001` : "")
  const policyID =
    text(values, "policy_id") ||
    (variant.contextType === 2 ? `policy-${template.id}-001` : "")
  return {
    context_type: variant.contextType ?? 0,
    agent_id: text(values, "agent_id"),
    source_task_id: sourceTaskID,
    source_action_code: variant.sourceActionCode ?? template.actionCode,
    target_key: targetKey,
    backup_id: backupID,
    policy_id: policyID,
  }
}

function applyDefaultActionContextValues(
  template: RemediationPreviewDemoTemplate,
  values: DemoValues,
  mode: DemoActionMode,
) {
  const variant = resolveDemoActionVariant(template, mode)
  if (!variant.requiresHistory) return
  const display = text(values, "target_display") || defaultDisplay(template, values)
  if (!text(values, "source_task_id")) {
    values.source_task_id = `task-${variant.sourceActionCode ?? template.actionCode}-${template.id}-001`
  }
  if (!text(values, "history_target_key")) {
    values.history_target_key = `${template.id}:${text(values, "agent_id")}:${safeKey(display)}`
  }
  if (variant.contextType === 1 && !text(values, "backup_id")) {
    values.backup_id = `backup-${template.id}-001`
  }
  if (variant.contextType === 2 && !text(values, "policy_id")) {
    values.policy_id = `policy-${template.id}-001`
  }
}

function defaultDisplay(template: RemediationPreviewDemoTemplate, values: DemoValues) {
  if (template.id === "process") return text(values, "process_name") || text(values, "process_path")
  if (template.id === "file" || template.id === "file-ea") return text(values, "file_path")
  if (template.id === "ntfs-ads") return `${text(values, "file_path")}:${text(values, "stream_name")}`
  if (template.id === "scheduled-task") return text(values, "task_name")
  if (template.id === "service") return text(values, "display_name") || text(values, "service_name")
  if (template.id === "account") return `${text(values, "domain")}\\${text(values, "account_name")}`
  if (template.id === "registry") return `${text(values, "hive")}\\${text(values, "key_path")}`
  if (template.id === "wmi-class") return `${text(values, "namespace")}:${text(values, "class_name")}`
  if (template.id === "wmi-subscription") return `${text(values, "filter_name")} -> ${text(values, "consumer_name")}`
  if (template.id === "bits-job") return text(values, "job_name")
  if (template.id === "proc-execute") return `Block ${text(values, "object_path") || text(values, "process_path")}`
  if (template.id === "net-quarantine") return `${text(values, "remote_address")}:${text(values, "remote_port")}/${text(values, "protocol")}`
  return template.title
}

function text(values: DemoValues, key: string) {
  const value = values[key]
  if (typeof value === "boolean") return value ? "true" : "false"
  return String(value ?? "").trim()
}

function numberValue(values: DemoValues, key: string) {
  const value = Number(values[key])
  return Number.isFinite(value) ? value : 0
}

function bool(values: DemoValues, key: string) {
  const value = values[key]
  if (typeof value === "boolean") return value
  return String(value ?? "").trim().toLowerCase() === "true"
}

function csv(values: DemoValues, key: string) {
  return text(values, key)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function safeKey(value: string) {
  return value.replace(/[^a-zA-Z0-9_.:-]+/g, "-").slice(0, 72)
}
