"use client";

import { Link2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { TooltipProvider } from "@/shared/ui/tooltip";

import {
  AttackGraphEdgeDetailContent,
  AttackGraphEdgeDetailHeader,
} from "../components/detail/attack-graph-edge-detail-content";
import type {
  AttackGraphEdgeModel,
  AttackGraphNodeModel,
} from "../model/core/attack-graph-data";
import { getAttackGraphEdgeDetailFieldConfigs } from "../model/detail/attack-graph-edge-detail-field-config";
import {
  ATTACK_GRAPH_RELATION_TYPES,
  getAttackGraphEdgeKind,
  type AttackGraphRelationType,
} from "../model/edge/attack-graph-edge-types";
import { getAttackGraphNodePresentationKind } from "../model/node/attack-graph-node-types";

const EDGE_DEBUG_SOURCE_NODE_ID = "edge-debug-process";

const EDGE_DEBUG_NODE_FIXTURES = [
  nodeFixture("edge-debug-case", "AttackCase", "Case 619fef361", {
    case_id: "619fef36105e4e58c3803c0f156d4fce64c64c90",
  }),
  nodeFixture("edge-debug-case-group", "AttackCaseGroup", "Case Group 1", {
    group_id: "group-1",
  }),
  nodeFixture("edge-debug-case-instance", "AttackCaseInstance", "Instance 1", {
    instance_id: "instance-1",
  }),
  nodeFixture("edge-debug-evidence", "AttackCaseEvidence", "Evidence 1", {
    evidence_id: "evidence-1",
  }),
  nodeFixture(EDGE_DEBUG_SOURCE_NODE_ID, "Process", "winword.exe", {
    agent_id: "cc895941fede9db840300f73199b7b75",
    occurred_at: "2024/05/04 11:37:27",
    process_command_line:
      '"C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE" /n',
    process_guid: "a132291e11980204003acab35947da01",
    process_id: "5452",
    process_image:
      "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
    process_md5: "dd97f7527d1536afbff5bced8508661f",
    process_name: "winword.exe",
    unique_id: "process-debug-unique-id",
    user_id: "s-1-5-21-2738161467-2500408900-3226194357-1001",
  }),
  nodeFixture("edge-debug-child-process", "Process", "powershell.exe", {
    process_guid: "bc878528158017e0003a9a96f49dda01",
    process_id: "6112",
    process_image:
      "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
    process_md5: "f7722b62b4014e0c50adfa9d60cafa1c",
    process_name: "powershell.exe",
  }),
  nodeFixture("edge-debug-file", "File", "payload.dll", {
    file_name: "C:\\Users\\Public\\payload.dll",
    md5: "3c4b348ab52f5543e4ef225221c5af4f",
    unique_id: "file-debug-unique-id",
  }),
  nodeFixture("edge-debug-file-old", "File", "old-name.dll", {
    file_name: "C:\\Users\\Public\\old-name.dll",
  }),
  nodeFixture("edge-debug-file-new", "File", "new-name.dll", {
    file_name: "C:\\Users\\Public\\new-name.dll",
  }),
  nodeFixture(
    "edge-debug-file-stream",
    "FileStream",
    "payload.dll:Zone.Identifier",
    {
      base_path: "C:\\Users\\Public\\payload.dll",
      stream_name: "Zone.Identifier",
    },
  ),
  nodeFixture("edge-debug-url", "URLResource", "example.com/payload.dll", {
    url: "https://example.com/download/payload.dll",
  }),
  nodeFixture("edge-debug-volume", "Volume", "C:", {
    access_type: "read/write",
    driver_type: "fixed",
    file_name: "C:",
  }),
  nodeFixture("edge-debug-device", "Device", "USB Mass Storage Device", {
    device_description: "USB Mass Storage Device",
    device_guid: "{4d36e967-e325-11ce-bfc1-08002be10318}",
  }),
  nodeFixture("edge-debug-host", "Host", "DESKTOP-P0MGC81", {
    agent_id: "d0c951b3b2fe6bba106840972c7c904f",
    computer_name: "DESKTOP-P0MGC81",
  }),
  nodeFixture("edge-debug-host-ref", "HostRef", "HOST-A", {
    server_name: "HOST-A",
  }),
  nodeFixture("edge-debug-dns", "DnsName", "example.com", {
    domain: "example.com",
  }),
  nodeFixture("edge-debug-address", "NetAddress", "8.8.8.8", {
    address_family: "IPv4",
    ip: "8.8.8.8",
  }),
  nodeFixture("edge-debug-endpoint", "NetEndpoint", "8.8.8.8:443", {
    ip: "8.8.8.8",
    ip_version: "IPv4",
    port: "443",
    protocol: "TCP",
  }),
  nodeFixture("edge-debug-registry-key", "RegistryKey", "Run", {
    object_name:
      "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
  }),
  nodeFixture("edge-debug-registry-value", "RegistryValue", "Updater", {
    object_name:
      "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\Updater",
    object_value: "C:\\Users\\Public\\payload.exe",
  }),
  nodeFixture("edge-debug-service", "Service", "TestService", {
    display_name: "Test Service",
    service_name: "TestService",
  }),
  nodeFixture("edge-debug-task", "Task", "testtask", {
    task_name: "testtask",
    task_path: "\\Microsoft\\Windows\\AppID",
  }),
  nodeFixture("edge-debug-scheduled-job", "ScheduledJob", "calc.exe", {
    command: "C:\\Windows\\System32\\calc.exe",
    job_id: "42",
  }),
  nodeFixture("edge-debug-bits", "Bits", "Debug BITS Job", {
    job_id: "{11111111-2222-3333-4444-555555555555}",
    job_name: "Debug BITS Job",
  }),
  nodeFixture("edge-debug-crypto", "Crypto", "encrypt", {
    crypt_flag_description: "encrypt",
    operation_kind: "encrypt",
  }),
  nodeFixture(
    "edge-debug-powershell",
    "PowerShellExecution",
    "Invoke-Expression",
    {
      content:
        "Invoke-Expression (New-Object Net.WebClient).DownloadString(...)",
    },
  ),
  nodeFixture("edge-debug-credential-theft", "CredentialTheft", "lsass dump", {
    cred_desc: "lsass dump",
    cred_type: "memory",
  }),
  nodeFixture("edge-debug-token", "TokenImpersonation", "impersonate token", {
    token_flag_description: "impersonate token pipe client",
  }),
  nodeFixture("edge-debug-message-hook", "MessageHook", "WH_KEYBOARD_LL", {
    hook_type_description: "WH_KEYBOARD_LL",
    message_hook_module: "C:\\Users\\Public\\hook.dll",
  }),
  nodeFixture("edge-debug-file-mapping", "FileMapping", "Global\\DebugMap", {
    file_mapping_name: "Global\\DebugMap",
  }),
  nodeFixture("edge-debug-mailslot", "MailSlot", "mailbox", {
    mail_slot_name: "\\\\.\\mailslot\\mailbox",
  }),
  nodeFixture("edge-debug-named-event", "NamedEvent", "myevent", {
    event_name: "Global\\myevent",
  }),
  nodeFixture("edge-debug-named-pipe", "NamedPipe", "debugpipe", {
    pipe_name: "\\\\.\\pipe\\debugpipe",
  }),
  nodeFixture("edge-debug-mbr", "Mbr", "\\Device\\Harddisk0\\DR0", {
    physical_name: "\\Device\\Harddisk0\\DR0",
  }),
  nodeFixture("edge-debug-account", "Account", "DESKTOP-P0MGC81\\lxg", {
    domain: "DESKTOP-P0MGC81",
    sid: "S-1-5-21-2738161467-2500408900-3226194357-1001",
    user: "lxg",
  }),
  nodeFixture("edge-debug-account-group", "AccountGroup", "Administrators", {
    domain: "BUILTIN",
    group_name: "Administrators",
  }),
  nodeFixture("edge-debug-wmi-class", "WmiClass", "ExampleClass", {
    class_name: "ExampleClass",
    namespace: "root\\subscription",
  }),
  nodeFixture("edge-debug-wmi-consumer", "WmiConsumer", "CommandLineConsumer", {
    event_consumer_name: "CommandLineConsumer",
  }),
  nodeFixture("edge-debug-wmi-filter", "WmiFilter", "DebugFilter", {
    event_filter_name: "DebugFilter",
    query: "SELECT * FROM __InstanceCreationEvent",
  }),
  nodeFixture(
    "edge-debug-wmi-query",
    "WmiQuery",
    "SELECT * FROM Win32_Process",
    {
      query: "SELECT * FROM Win32_Process WHERE Name = 'cmd.exe'",
    },
  ),
  nodeFixture("edge-debug-wmi-execute", "WmiExecute", "Win32_Process.Create", {
    class_name: "Win32_Process",
    method_name: "Create",
  }),
] satisfies AttackGraphNodeModel[];

const EDGE_DEBUG_NODES_BY_ID = new Map(
  EDGE_DEBUG_NODE_FIXTURES.map((node) => [node.id, node]),
);

const EDGE_DETAIL_DEBUG_EDGES = ATTACK_GRAPH_RELATION_TYPES.map(
  (relationType) => edgeFixture(relationType),
);

export function AttackGraphEdgeDetailDebugCard() {
  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white">
            <Link2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              Edge Detail Full Coverage Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              {EDGE_DETAIL_DEBUG_EDGES.length} relation types rendered by the
              new Edge Detail UI.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <div className="flex flex-wrap gap-4">
            {EDGE_DETAIL_DEBUG_EDGES.map((edge, index) => (
              <article
                key={edge.id}
                className="w-[660px] max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 font-mono text-[11px] font-semibold text-slate-500">
                  {String(index + 1).padStart(2, "0")} /{" "}
                  {EDGE_DETAIL_DEBUG_EDGES.length} - {edge.relationType}
                </div>
                <AttackGraphEdgeDetailHeader
                  edge={edge}
                  nodesById={EDGE_DEBUG_NODES_BY_ID}
                />
                <AttackGraphEdgeDetailContent
                  edge={edge}
                  nodesById={EDGE_DEBUG_NODES_BY_ID}
                />
              </article>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

function nodeFixture(
  id: string,
  entityType: string,
  displayName: string,
  properties: Record<string, string>,
): AttackGraphNodeModel {
  return {
    id,
    key: `${entityType.toLowerCase()}:${id}`,
    entityType,
    displayName,
    presentationKind: getAttackGraphNodePresentationKind(entityType),
    properties,
  };
}

function edgeFixture(
  relationType: AttackGraphRelationType,
): AttackGraphEdgeModel {
  const endpoints = getEdgeDebugEndpoints(relationType);
  return {
    id: `edge-debug-${relationType.toLowerCase()}`,
    scopeType: "scope_drill",
    scopeId: "debug-scope",
    relationType,
    edgeKind: getAttackGraphEdgeKind(relationType),
    source: endpoints.source,
    target: endpoints.target,
    edgeKey: `edge:${relationType.toLowerCase()}:debug`,
    graphOrigin: "debug",
    properties: buildEdgeDebugProperties(relationType),
  };
}

function getEdgeDebugEndpoints(relationType: AttackGraphRelationType) {
  if (relationType === "CASE_HAS_GROUP") {
    return { source: "edge-debug-case", target: "edge-debug-case-group" };
  }
  if (relationType === "GROUP_HAS_INSTANCE") {
    return {
      source: "edge-debug-case-group",
      target: "edge-debug-case-instance",
    };
  }
  if (relationType === "INSTANCE_HAS_EVIDENCE") {
    return {
      source: "edge-debug-case-instance",
      target: "edge-debug-evidence",
    };
  }
  if (relationType === "EVIDENCE_REFER_ENTITY") {
    return { source: "edge-debug-evidence", target: EDGE_DEBUG_SOURCE_NODE_ID };
  }
  if (relationType === "ACCOUNT_GROUP_HAS_MEMBER") {
    return {
      source: "edge-debug-account-group",
      target: "edge-debug-account",
    };
  }
  if (relationType === "ADDRESS_HAS_ENDPOINT") {
    return { source: "edge-debug-address", target: "edge-debug-endpoint" };
  }
  if (relationType === "BITS_LOCAL_FILE") {
    return { source: "edge-debug-bits", target: "edge-debug-file" };
  }
  if (relationType === "BITS_REMOTE_URL") {
    return { source: "edge-debug-bits", target: "edge-debug-url" };
  }
  if (relationType === "DEVICE_BELONG_TO_HOST") {
    return { source: "edge-debug-device", target: "edge-debug-host" };
  }
  if (relationType === "DNS_NAME_RESOLVE_ADDRESS") {
    return { source: "edge-debug-dns", target: "edge-debug-address" };
  }
  if (relationType === "FILE_HAS_STREAM") {
    return { source: "edge-debug-file", target: "edge-debug-file-stream" };
  }
  if (relationType === "FILE_MOVE_TO" || relationType === "FILE_RENAME_TO") {
    return { source: "edge-debug-file-old", target: "edge-debug-file-new" };
  }
  if (relationType === "REGISTRY_KEY_RENAME_TO") {
    return {
      source: "edge-debug-registry-key",
      target: "edge-debug-registry-value",
    };
  }
  if (relationType === "WMI_FILTER_BIND_CONSUMER") {
    return {
      source: "edge-debug-wmi-filter",
      target: "edge-debug-wmi-consumer",
    };
  }

  return {
    source: EDGE_DEBUG_SOURCE_NODE_ID,
    target: getProcessRelationTargetNodeId(relationType),
  };
}

function getProcessRelationTargetNodeId(relationType: AttackGraphRelationType) {
  if (
    relationType.includes("_ACCOUNT_GROUP") ||
    relationType.includes("_GROUP")
  ) {
    return "edge-debug-account-group";
  }
  if (relationType.includes("_ACCOUNT")) {
    return "edge-debug-account";
  }
  if (relationType.includes("_BITS")) {
    return "edge-debug-bits";
  }
  if (relationType.includes("_CRYPTO")) {
    return "edge-debug-crypto";
  }
  if (relationType.includes("_DNS_NAME")) {
    return "edge-debug-dns";
  }
  if (relationType.includes("_ENDPOINT")) {
    return "edge-debug-endpoint";
  }
  if (relationType.includes("_FILE_MAPPING")) {
    return "edge-debug-file-mapping";
  }
  if (relationType.includes("_FILE_STREAM")) {
    return "edge-debug-file-stream";
  }
  if (
    relationType.includes("_FILE") ||
    relationType.includes("_DLL") ||
    relationType.includes("_DRIVER")
  ) {
    return "edge-debug-file";
  }
  if (relationType.includes("_MAIL_SLOT")) {
    return "edge-debug-mailslot";
  }
  if (relationType.includes("_MBR")) {
    return "edge-debug-mbr";
  }
  if (relationType.includes("_MESSAGE_HOOK")) {
    return "edge-debug-message-hook";
  }
  if (relationType.includes("_NAMED_EVENT")) {
    return "edge-debug-named-event";
  }
  if (relationType.includes("_NAMED_PIPE")) {
    return "edge-debug-named-pipe";
  }
  if (relationType.includes("_POWERSHELL")) {
    return "edge-debug-powershell";
  }
  if (relationType.includes("_PROCESS")) {
    return "edge-debug-child-process";
  }
  if (relationType.includes("_REGISTRY_KEY")) {
    return "edge-debug-registry-key";
  }
  if (relationType.includes("_REGISTRY_VALUE")) {
    return "edge-debug-registry-value";
  }
  if (relationType.includes("_SCHEDULED_JOB")) {
    return "edge-debug-scheduled-job";
  }
  if (relationType.includes("_SERVICE")) {
    return "edge-debug-service";
  }
  if (relationType.includes("_TASK")) {
    return "edge-debug-task";
  }
  if (relationType.includes("_TOKEN")) {
    return "edge-debug-token";
  }
  if (relationType.includes("_URL")) {
    return "edge-debug-url";
  }
  if (relationType.includes("_VOLUME")) {
    return "edge-debug-volume";
  }
  if (relationType.includes("_WMI_CLASS")) {
    return "edge-debug-wmi-class";
  }
  if (relationType.includes("_WMI_CONSUMER")) {
    return "edge-debug-wmi-consumer";
  }
  if (relationType.includes("_WMI_FILTER")) {
    return "edge-debug-wmi-filter";
  }
  if (relationType.includes("_WMI")) {
    return relationType.includes("EXECUTE")
      ? "edge-debug-wmi-execute"
      : "edge-debug-wmi-query";
  }
  if (relationType.includes("_CREDENTIAL")) {
    return "edge-debug-credential-theft";
  }
  if (relationType.includes("_REMOTE_HOST")) {
    return "edge-debug-host-ref";
  }
  if (relationType.includes("_HOST")) {
    return "edge-debug-host";
  }
  return "edge-debug-file";
}

function buildEdgeDebugProperties(relationType: AttackGraphRelationType) {
  const properties: Record<string, string> = {};
  for (const config of getAttackGraphEdgeDetailFieldConfigs(relationType)) {
    if (config.key === "relation_type") {
      continue;
    }
    properties[config.key] = getDebugFieldValue(config.key, relationType);
  }
  return properties;
}

function getDebugFieldValue(
  key: string,
  relationType: AttackGraphRelationType,
) {
  const relation = relationType.toLowerCase();
  const values: Record<string, string> = {
    address: "0x000001f4a000",
    agent_id: "d0c951b3b2fe6bba106840972c7c904f",
    associated_file_kind: "image",
    binding_state: "changed",
    call_trace: "ntdll.dll!NtOpenProcess -> kernelbase.dll!OpenProcess",
    case_id: "619fef36105e4e58c3803c0f156d4fce64c64c90",
    display_order: "1",
    direction: "outbound",
    entity_key: "process:debug:winword.exe",
    entity_type: "Process",
    event_count: "3",
    event_name: "CreateProcess",
    event_type: "process",
    evidence_id: "evidence-debug-1",
    first_seen_at: "2024/05/04 11:30:00",
    first_source_unique_id: "first-source-unique-id",
    flag: "run_once",
    granted_access: "0x1fffff",
    group_id: "group-debug-1",
    has_explicit_credential: "true",
    image_parameters: "cls",
    instance_id: "instance-debug-1",
    is_present: "true",
    job_binary_md5: "94912c1d73ade68f2486ed4d8ea82de6",
    job_binary_path_name: "C:\\Windows\\System32\\cmd.exe",
    job_files: JSON.stringify([
      {
        local: "C:\\Users\\Public\\payload.dll",
        remote: "https://example.com/payload.dll",
      },
    ]),
    job_id: "{11111111-2222-3333-4444-555555555555}",
    job_name: "Debug BITS Job",
    job_status: "3",
    job_status_desc: "transferred",
    job_type: "0",
    job_type_desc: "download",
    last_change_at: "2024/05/04 12:20:00",
    last_change_type: "created",
    last_seen_at: "2024/05/04 12:30:00",
    last_source_unique_id: "last-source-unique-id",
    loaded_at: "2024/05/04 11:37:29",
    local_ip: "10.122.18.40",
    local_port: "54520",
    match_kind: "md5",
    matched_md5: "3c4b348ab52f5543e4ef225221c5af4f",
    member_name: "DESKTOP-P0MGC81\\lxg",
    member_sid: "S-1-5-21-2738161467-2500408900-3226194357-1001",
    new_create_time: "2024/05/04 11:37:30",
    new_object_name:
      "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\UpdaterNew",
    new_path: "C:\\Users\\Public\\new-name.dll",
    new_service_binary_md5: "55e48d7805babf5602d38052bf659930",
    new_service_binary_path_name: "C:\\Windows\\System32\\cmd.exe",
    normalized_server_name: "host-a",
    occurred_at: "2024/05/04 11:37:27",
    old_object_name:
      "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\Updater",
    old_path: "C:\\Users\\Public\\old-name.dll",
    org_create_time: "2024/05/04 10:00:00",
    org_service_binary_md5: "dd97f7527d1536afbff5bced8508661f",
    org_service_binary_path_name: "C:\\Windows\\System32\\svchost.exe",
    operator_token_context:
      '{"accountname":"system","sid":"s-1-5-18","tokentype":"tokenprimary"}',
    page_protect: "PAGE_EXECUTE_READWRITE",
    pair_index: "1",
    privileges: "sedebugprivilege;seimpersonateprivilege",
    protocol: "TCP",
    query_count: "5",
    relation_kind: "alternate data stream",
    remote_ip: "8.8.8.8",
    remote_port: "443",
    resolved_at: "2024/05/04 11:35:00",
    role: "source",
    rule_id: "rule-debug-1",
    sam_account_name: "lxg",
    self: "false",
    self_exit: "true",
    server_name: "HOST-A",
    service_binary_md5: "55e48d7805babf5602d38052bf659930",
    service_binary_path_name: "C:\\Windows\\System32\\cmd.exe",
    service_control_code: "stop",
    service_start_args: "-k netsvcs",
    source_unique_id: "source-unique-id",
    stack_module: "kernelbase.dll",
    subject_domain_name: "DESKTOP-P0MGC81",
    subject_logon_id: "0x3e7",
    subject_user_name: "SYSTEM",
    subject_user_sid: "S-1-5-18",
    target_domain_name: "DESKTOP-P0MGC81",
    target_remote_kind: "host_ref",
    target_sid: "S-1-5-21-2738161467-2500408900-3226194357-1001",
    target_token_context:
      '{"accountname":"lxg","sid":"s-1-5-21-2738161467-2500408900-3226194357-1001"}',
    target_user_name: "lxg",
    tenant_id: "debug-tenant",
    thread_id: "8924",
    token_flag: "3",
    token_flag_description: "impersonate token pipe client",
    value_exist: "true",
    visited_at: "2024/05/04 11:36:00",
  };

  return values[key] ?? `${key}:${relation}`;
}
