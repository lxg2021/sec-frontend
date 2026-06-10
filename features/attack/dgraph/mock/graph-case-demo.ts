import type { GraphCaseResponseDto } from "../model/attack-graph-data";

export const demoGraphCaseResponse: GraphCaseResponseDto = {
  request_id: "demo-request-1",
  tenant_id: "public",
  case_id: "case-demo-vectra-style",
  start_time: "2026-06-10T09:10:00+08:00",
  end_time: "2026-06-10T09:42:00+08:00",
  nodes: [
    {
      key: "attack_case:case:case-demo-vectra-style",
      entity_type: "AttackCase",
      display_name: "Credential Access Investigation",
      properties: {
        severity: "high",
        rule_count: "3",
      },
    },
    {
      key: "attack_case_group:case:case-demo-vectra-style:group:g1",
      entity_type: "AttackCaseGroup",
      display_name: "Initial execution",
      properties: {
        rule_id: "T1059",
      },
    },
    {
      key: "attack_case_instance:case:case-demo-vectra-style:group:g1:instance:i1",
      entity_type: "AttackCaseInstance",
      display_name: "PowerShell chain",
      properties: {
        agent_id: "agent-win-01",
      },
    },
    {
      key: "attack_case_evidence:case:case-demo-vectra-style:group:g1:instance:i1:evidence:e1",
      entity_type: "AttackCaseEvidence",
      display_name: "Encoded PowerShell execution",
      properties: {
        event_name: "process_create",
        occurred_at: "2026-06-10T09:13:21+08:00",
      },
    },
    {
      key: "host:public:agent-win-01",
      entity_type: "Host",
      display_name: "WIN-RESEARCH-01",
      properties: {
        computer_name: "WIN-RESEARCH-01",
      },
    },
    {
      key: "process:public:agent-win-01:explorer-4288",
      entity_type: "Process",
      display_name: "explorer.exe",
      properties: {
        process_name: "explorer.exe",
        process_image: "C:\\Windows\\explorer.exe",
        process_id: "4288",
      },
    },
    {
      key: "process:public:agent-win-01:powershell-6124",
      entity_type: "Process",
      display_name: "powershell.exe",
      properties: {
        process_name: "powershell.exe",
        process_image: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
        process_id: "6124",
      },
    },
    {
      key: "powershell:public:agent-win-01:6124:encoded",
      entity_type: "PowerShellExecution",
      display_name: "-EncodedCommand",
      properties: {
        command: "powershell -EncodedCommand <redacted>",
      },
    },
    {
      key: "file:public:agent-win-01:c:/users/public/update.ps1",
      entity_type: "File",
      display_name: "update.ps1",
      properties: {
        path: "C:\\Users\\Public\\update.ps1",
      },
    },
    {
      key: "registry_value:public:agent-win-01:run:persist",
      entity_type: "RegistryValue",
      display_name: "Run\\Updater",
      properties: {
        path: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
        name: "Updater",
      },
    },
    {
      key: "net_endpoint:public:agent-win-01:185.199.110.133:443",
      entity_type: "NetEndpoint",
      display_name: "185.199.110.133:443",
      properties: {
        ip: "185.199.110.133",
        port: "443",
      },
    },
    {
      key: "dns:public:githubusercontent.com",
      entity_type: "DnsName",
      display_name: "raw.githubusercontent.com",
      properties: {
        name: "raw.githubusercontent.com",
      },
    },
    {
      key: "service:public:agent-win-01:updatersvc",
      entity_type: "Service",
      display_name: "UpdaterSvc",
      properties: {
        service_name: "UpdaterSvc",
      },
    },
    {
      key: "credential_theft:public:agent-win-01:lsass-read",
      entity_type: "CredentialTheft",
      display_name: "LSASS memory access",
      properties: {
        technique: "Credential dumping",
      },
    },
  ],
  edges: [
    {
      scope_type: "case",
      scope_id: "case-demo-vectra-style",
      relation_type: "CASE_HAS_GROUP",
      source_key: "attack_case:case:case-demo-vectra-style",
      target_key: "attack_case_group:case:case-demo-vectra-style:group:g1",
      graph_origin: "scope_case",
    },
    {
      scope_type: "case",
      scope_id: "case-demo-vectra-style",
      relation_type: "GROUP_HAS_INSTANCE",
      source_key: "attack_case_group:case:case-demo-vectra-style:group:g1",
      target_key: "attack_case_instance:case:case-demo-vectra-style:group:g1:instance:i1",
      graph_origin: "scope_case",
    },
    {
      scope_type: "case",
      scope_id: "case-demo-vectra-style",
      relation_type: "INSTANCE_HAS_EVIDENCE",
      source_key: "attack_case_instance:case:case-demo-vectra-style:group:g1:instance:i1",
      target_key: "attack_case_evidence:case:case-demo-vectra-style:group:g1:instance:i1:evidence:e1",
      graph_origin: "scope_case",
    },
    {
      scope_type: "case",
      scope_id: "case-demo-vectra-style",
      relation_type: "EVIDENCE_REFER_ENTITY",
      source_key: "attack_case_evidence:case:case-demo-vectra-style:group:g1:instance:i1:evidence:e1",
      target_key: "process:public:agent-win-01:powershell-6124",
      graph_origin: "scope_case",
    },
    {
      scope_type: "case",
      scope_id: "case-demo-vectra-style",
      relation_type: "DEVICE_BELONG_TO_HOST",
      source_key: "host:public:agent-win-01",
      target_key: "process:public:agent-win-01:explorer-4288",
      graph_origin: "scope_drill",
    },
    {
      scope_type: "case",
      scope_id: "case-demo-vectra-style",
      relation_type: "PROCESS_CREATE_PROCESS",
      source_key: "process:public:agent-win-01:explorer-4288",
      target_key: "process:public:agent-win-01:powershell-6124",
      graph_origin: "scope_drill",
    },
    {
      scope_type: "case",
      scope_id: "case-demo-vectra-style",
      relation_type: "PROCESS_EXECUTE_POWERSHELL",
      source_key: "process:public:agent-win-01:powershell-6124",
      target_key: "powershell:public:agent-win-01:6124:encoded",
      graph_origin: "scope_drill",
    },
    {
      scope_type: "case",
      scope_id: "case-demo-vectra-style",
      relation_type: "PROCESS_WRITE_FILE",
      source_key: "process:public:agent-win-01:powershell-6124",
      target_key: "file:public:agent-win-01:c:/users/public/update.ps1",
      graph_origin: "scope_drill",
    },
    {
      scope_type: "case",
      scope_id: "case-demo-vectra-style",
      relation_type: "PROCESS_SET_REGISTRY_VALUE",
      source_key: "process:public:agent-win-01:powershell-6124",
      target_key: "registry_value:public:agent-win-01:run:persist",
      graph_origin: "scope_drill",
    },
    {
      scope_type: "case",
      scope_id: "case-demo-vectra-style",
      relation_type: "PROCESS_CONNECT_ENDPOINT",
      source_key: "process:public:agent-win-01:powershell-6124",
      target_key: "net_endpoint:public:agent-win-01:185.199.110.133:443",
      graph_origin: "scope_drill",
    },
    {
      scope_type: "case",
      scope_id: "case-demo-vectra-style",
      relation_type: "PROCESS_QUERY_DNS_NAME",
      source_key: "process:public:agent-win-01:powershell-6124",
      target_key: "dns:public:githubusercontent.com",
      graph_origin: "scope_drill",
    },
    {
      scope_type: "case",
      scope_id: "case-demo-vectra-style",
      relation_type: "PROCESS_CREATE_SERVICE",
      source_key: "process:public:agent-win-01:powershell-6124",
      target_key: "service:public:agent-win-01:updatersvc",
      graph_origin: "scope_drill",
    },
    {
      scope_type: "case",
      scope_id: "case-demo-vectra-style",
      relation_type: "PROCESS_STEAL_CREDENTIALS",
      source_key: "process:public:agent-win-01:powershell-6124",
      target_key: "credential_theft:public:agent-win-01:lsass-read",
      graph_origin: "scope_drill",
    },
  ],
  diagnostics: {
    node_count: 14,
    edge_count: 13,
  },
};

