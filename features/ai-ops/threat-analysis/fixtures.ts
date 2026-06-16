import type { AttackAIReport, AttackAIReportTask } from "@/features/ai-ops/threat-analysis/report-types"

const sampleReport: AttackAIReport = {
  schema_version: "attack-ai-report/v1",
  context_version: "attack-ai-context/v1",
  case_id: "619fef36105e4e58c3803c0f156d4fce64c64c90",
  context_hash: "f0c9f8b38b50aeb5bb54449b7e6fdc1c1bb6c2b6f57c37748e2bc6183371d7f6",
  risk_level: "critical",
  confidence: 0.85,
  executive_summary:
    "cmd.exe launched winword.exe with a URL argument. Winword.exe connected to an external IP address, created two unsigned DLL files, and spawned calc.exe as a child process. These behaviors are associated with defense evasion and execution.",
  attack_story: [
    {
      step: 1,
      title: "Winword launched with URL argument",
      detail:
        "cmd.exe created winword.exe with command line including http://20.0.40.208:8080/playoad.dll. Winword.exe was unsigned and launched with hidden window.",
      severity: "critical",
      confidence: 0.9,
      evidence_refs: ["9c452a76a9fd32353d893174e8989369a6d52d43"],
      rule_refs: ["dbdf8009-cab2-42d8-962c-4456a06d3e4e"],
    },
    {
      step: 2,
      title: "Winword connected to external IP",
      detail: "Winword.exe connected to 20.0.40.208 on port 8080.",
      severity: "critical",
      confidence: 0.9,
      evidence_refs: ["4db1a32fdc8c863f92fed62ff2d5e1de8816a095"],
      rule_refs: ["dbdf8009-cab2-42d8-962c-4456a06d3e4e"],
    },
    {
      step: 3,
      title: "Winword created suspicious DLL files",
      detail:
        "Winword.exe created two unsigned PE DLL64 files: playoad[1].dll and c5de36c1.dll in Internet cache folders.",
      severity: "critical",
      confidence: 0.9,
      evidence_refs: [
        "8f6c47b2297eb04bb127b58b7d92716c60272225",
        "9dfee801cbac860f8298d3bba16f1b7383b059a9",
      ],
      rule_refs: ["dbdf8009-cab2-42d8-962c-4456a06d3e4e"],
    },
    {
      step: 4,
      title: "Winword spawned calc.exe",
      detail:
        "Winword.exe created process calc.exe with command line calc.exe. Calc.exe was unsigned and launched with hidden window.",
      severity: "critical",
      confidence: 0.9,
      evidence_refs: ["c4c27a3791114908c3a217e8dc8e771689d00871"],
      rule_refs: ["477b9a3a-0deb-401c-b2c8-953c9d42ccba"],
    },
  ],
  key_findings: [
    {
      title: "Office application launched with URL argument",
      severity: "critical",
      reason:
        "Winword.exe was launched by cmd.exe with a URL argument, indicating potential download of remote content.",
      confidence: 0.9,
      evidence_refs: ["9c452a76a9fd32353d893174e8989369a6d52d43"],
      rule_refs: ["dbdf8009-cab2-42d8-962c-4456a06d3e4e"],
    },
    {
      title: "Office application connected to external IP",
      severity: "critical",
      reason: "Winword.exe connected to 20.0.40.208:8080, which is consistent with downloading a file.",
      confidence: 0.9,
      evidence_refs: ["4db1a32fdc8c863f92fed62ff2d5e1de8816a095"],
      rule_refs: ["dbdf8009-cab2-42d8-962c-4456a06d3e4e"],
    },
    {
      title: "Unsigned DLL files created by office application",
      severity: "critical",
      reason: "Winword.exe created two unsigned PE DLL64 files in cache folders, which is suspicious.",
      confidence: 0.9,
      evidence_refs: [
        "8f6c47b2297eb04bb127b58b7d92716c60272225",
        "9dfee801cbac860f8298d3bba16f1b7383b059a9",
      ],
      rule_refs: ["dbdf8009-cab2-42d8-962c-4456a06d3e4e"],
    },
    {
      title: "Office application spawned unusual child process",
      severity: "critical",
      reason:
        "Winword.exe spawned calc.exe, which is not a typical child process for Word and indicates potential code execution.",
      confidence: 0.9,
      evidence_refs: ["c4c27a3791114908c3a217e8dc8e771689d00871"],
      rule_refs: ["477b9a3a-0deb-401c-b2c8-953c9d42ccba"],
    },
  ],
  iocs: [
    {
      type: "ip",
      value: "20.0.40.208",
      source: "winword.exe connected to 20.0.40.208:8080",
      evidence_refs: ["4db1a32fdc8c863f92fed62ff2d5e1de8816a095"],
    },
    {
      type: "url",
      value: "http://20.0.40.208:8080/playoad.dll",
      source: "command line of winword.exe",
      evidence_refs: ["9c452a76a9fd32353d893174e8989369a6d52d43"],
    },
    {
      type: "file",
      value: "c:\\users\\sangfor\\appdata\\local\\microsoft\\windows\\inetcache\\ie\\crmmmbq1\\playoad[1].dll",
      source: "created by winword.exe",
      evidence_refs: ["8f6c47b2297eb04bb127b58b7d92716c60272225"],
    },
    {
      type: "file",
      value: "c:\\users\\sangfor\\appdata\\local\\microsoft\\windows\\inetcache\\content.mso\\c5de36c1.dll",
      source: "created by winword.exe",
      evidence_refs: ["9dfee801cbac860f8298d3bba16f1b7383b059a9"],
    },
    {
      type: "md5",
      value: "90d358e2d9f830f2af817d3e00c1f338",
      source: "MD5 of both created DLL files",
      evidence_refs: [
        "8f6c47b2297eb04bb127b58b7d92716c60272225",
        "9dfee801cbac860f8298d3bba16f1b7383b059a9",
      ],
    },
    {
      type: "process",
      value: "calc.exe",
      source: "child process of winword.exe",
      evidence_refs: ["c4c27a3791114908c3a217e8dc8e771689d00871"],
    },
  ],
  affected_assets: [
    {
      asset_type: "host",
      agent_id: "cc895941fede9db840300f73199b7b75",
      impact: "Suspicious process execution and file creation observed",
      evidence_refs: [
        "9c452a76a9fd32353d893174e8989369a6d52d43",
        "4db1a32fdc8c863f92fed62ff2d5e1de8816a095",
        "8f6c47b2297eb04bb127b58b7d92716c60272225",
        "9dfee801cbac860f8298d3bba16f1b7383b059a9",
        "c4c27a3791114908c3a217e8dc8e771689d00871",
      ],
    },
  ],
  recommended_actions: [
    {
      priority: 1,
      title: "Isolate affected host",
      detail: "Isolate host cc895941fede9db840300f73199b7b75 to prevent potential further malicious activity.",
      evidence_refs: ["9c452a76a9fd32353d893174e8989369a6d52d43"],
    },
    {
      priority: 2,
      title: "Collect and analyze created DLL files",
      detail: "Retrieve playoad[1].dll and c5de36c1.dll for further analysis to determine their functionality.",
      evidence_refs: [
        "8f6c47b2297eb04bb127b58b7d92716c60272225",
        "9dfee801cbac860f8298d3bba16f1b7383b059a9",
      ],
    },
    {
      priority: 3,
      title: "Review network connections to 20.0.40.208",
      detail: "Investigate any other hosts that may have communicated with 20.0.40.208.",
      evidence_refs: ["4db1a32fdc8c863f92fed62ff2d5e1de8816a095"],
    },
    {
      priority: 4,
      title: "Review adjacent process events",
      detail: "Examine process creation events around the time of the incident to identify any related activity.",
      evidence_refs: ["c4c27a3791114908c3a217e8dc8e771689d00871"],
    },
  ],
  hypotheses: [
    {
      title: "Created DLL files may have been loaded or executed",
      detail:
        "The created DLL files may have been loaded into winword.exe or another process, but no load events were observed in the evidence. Additional evidence is needed to confirm.",
      confidence: 0.3,
      evidence_refs: [
        "8f6c47b2297eb04bb127b58b7d92716c60272225",
        "9dfee801cbac860f8298d3bba16f1b7383b059a9",
      ],
    },
    {
      title: "External IP may be a download server",
      detail: "20.0.40.208 may be a server hosting malicious payloads, but no direct C2 evidence is present.",
      confidence: 0.5,
      evidence_refs: ["4db1a32fdc8c863f92fed62ff2d5e1de8816a095"],
    },
  ],
  limitations: [
    "No evidence of DLL loading or injection was observed; it is unknown whether the created DLLs were executed.",
    "No evidence of persistence mechanisms was observed.",
    "No evidence of lateral movement or data exfiltration was observed.",
  ],
}

const sampleValidation = {
  schema_version: "attack-ai-report-validation/v1",
  status: "valid",
  valid: true,
  errors: [],
  warnings: [],
  checked_refs: {
    evidence_refs: 30,
    rule_refs: 8,
    agent_ids: 1,
    observables: 14,
  },
  context_hash: sampleReport.context_hash,
}

export const sampleAttackAIReportTask: AttackAIReportTask = {
  task_id: "airpt-26871a582d0fd93f147fc94402990916",
  case_id: sampleReport.case_id || "",
  tenant_id: "public",
  status: "succeeded",
  context_hash: sampleReport.context_hash || "",
  report_json: JSON.stringify(sampleReport, null, 2),
  validation_json: JSON.stringify(sampleValidation, null, 2),
  provider_name: "deepseek",
  model_name: "deepseek-v4-flash",
  latency_ms: 17075,
  error_message: "",
  created_at: "2026-06-16 12:36:04",
  updated_at: "2026-06-16 12:36:21",
  started_at: "2026-06-16 12:36:04",
  finished_at: "2026-06-16 12:36:21",
  report: sampleReport,
  validation: sampleValidation,
}
