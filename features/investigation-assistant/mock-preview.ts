import type { AIInvestigationPreviewData } from "@/features/investigation-assistant/types"

const CASE_ID = "619fef36105e4e58c3803c0f156d4fce64c64c90"
const AGENT_ID = "cc895941fede9db840300f73199b7b75"
const WINWORD_PROCESS = `process:public:${AGENT_ID}:5ae67cc62620078c003a6af54370da01`
const CALC_PROCESS = `process:public:${AGENT_ID}:5e4a10f6078c45e000fa19d54370da01`
const DLL_A = `file:public:${AGENT_ID}:c:/users/sangfor/appdata/local/microsoft/windows/inetcache/content.mso/c5de36c1.dll`
const DLL_B = `file:public:${AGENT_ID}:c:/users/sangfor/appdata/local/microsoft/windows/inetcache/ie/crmmmbq1/playoad[1].dll`

export const MOCK_AI_INVESTIGATION_PREVIEW: AIInvestigationPreviewData = {
  context_hash: "6b43e8573d85a194d6516d0c89bb0acd65c409bd22d05818512356614e3f975a",
  provider_name: "mock",
  model_name: "previous-ai-preview",
  latency_ms: 0,
  validation: {
    status: "valid",
    valid: true,
    context_hash: "6b43e8573d85a194d6516d0c89bb0acd65c409bd22d05818512356614e3f975a",
    errors: [],
    warnings: [],
  },
  assistant_result: {
    schema_version: "ai-investigation-result/v1",
    context_version: "ai-investigation-context/v1",
    case_id: CASE_ID,
    context_hash: "6b43e8573d85a194d6516d0c89bb0acd65c409bd22d05818512356614e3f975a",
    current_assessment: "WinWord 连接远程地址并创建两个 DLL 文件，随后启动 calc.exe，疑似载荷投递。",
    confidence: "medium",
    confirmed_facts: [
      {
        text: "WinWord.exe (PID 1932) 通过命令行参数 http://20.0.40.208:8080/playoad.dll 启动，并外连该地址。",
        evidence_refs: [
          WINWORD_PROCESS,
          `PROCESS_CONNECT_ENDPOINT:${WINWORD_PROCESS}->net_endpoint:public:20.0.40.208:8080:ipproto_tcp:0`,
        ],
      },
      {
        text: "WinWord.exe 创建了两个 DLL 文件：c5de36c1.dll 和 playoad[1].dll，两者 MD5 相同。",
        evidence_refs: [
          `PROCESS_CREATE_FILE:${WINWORD_PROCESS}->${DLL_A}`,
          `PROCESS_CREATE_FILE:${WINWORD_PROCESS}->${DLL_B}`,
        ],
      },
      {
        text: "WinWord.exe 启动了 calc.exe 子进程。",
        evidence_refs: [`PROCESS_CREATE_PROCESS:${WINWORD_PROCESS}->${CALC_PROCESS}`],
      },
    ],
    attack_objectives: [
      {
        name: "载荷投递",
        confidence: "medium",
        reason: "WinWord 外连远程地址并创建 DLL 文件，但未确认 DLL 被加载执行。",
        evidence_refs: [
          `PROCESS_CONNECT_ENDPOINT:${WINWORD_PROCESS}->net_endpoint:public:20.0.40.208:8080:ipproto_tcp:0`,
          `PROCESS_CREATE_FILE:${WINWORD_PROCESS}->${DLL_A}`,
        ],
      },
      {
        name: "执行验证",
        confidence: "low",
        reason: "calc.exe 被启动，但未确认与 DLL 的关联，可能为测试行为。",
        evidence_refs: [`PROCESS_CREATE_PROCESS:${WINWORD_PROCESS}->${CALC_PROCESS}`],
      },
    ],
    verification_items: [
      {
        id: "dll_load_execution",
        title: "c5de36c1.dll、playoad[1].dll 是否被加载或执行。",
        targets: [
          { type: "file", name: "c5de36c1.dll", node_id: DLL_A },
          { type: "file", name: "playoad[1].dll", node_id: DLL_B },
        ],
        action: {
          action_id: "graph.expand_file_loads",
          label: "调查",
          target_node_ids: [DLL_A, DLL_B],
          evidence_refs: [],
        },
        evidence_refs: [],
      },
      {
        id: "remote_address_reputation",
        title: "远程地址 20.0.40.208:8080 的恶意性未确认。",
        targets: [
          { type: "network", name: "20.0.40.208:8080", node_id: "net_endpoint:public:20.0.40.208:8080:ipproto_tcp:0" },
        ],
        action: {
          action_id: "graph.expand_network_related_activity",
          label: "调查",
          target_node_ids: [
            "net_address:public:20.0.40.208:0",
            "net_endpoint:public:20.0.40.208:8080:ipproto_tcp:0",
          ],
          evidence_refs: [],
        },
        evidence_refs: [],
      },
      {
        id: "calc_child_processes",
        title: "查询 calc.exe 子进程",
        targets: [{ type: "process", name: "calc.exe", node_id: CALC_PROCESS }],
        action: {
          action_id: "graph.expand_process_children",
          label: "调查",
          target_node_ids: [CALC_PROCESS],
          evidence_refs: [],
        },
        evidence_refs: [],
      },
    ],
    missing_evidence: [
      {
        text: "DLL 文件是否被加载或执行。",
        reason: "当前图仅显示文件创建，还没有看到 DLL 加载或执行关系。",
      },
      {
        text: "远程地址 20.0.40.208 的恶意性未确认。",
        reason: "缺少外部威胁情报或更多访问上下文。",
      },
      {
        text: "calc.exe 的启动是否由 DLL 触发。",
        reason: "图上还没有 DLL 与 calc.exe 的直接关系。",
      },
    ],
    next_actions: [
      {
        action_id: "graph.expand_file_loads",
        label: "查文件是否被加载",
        reason: "确认 DLL 是否被加载或执行。",
        target_node_ids: [DLL_A, DLL_B],
        evidence_refs: [],
      },
      {
        action_id: "graph.expand_network_related_activity",
        label: "查网络相关行为",
        reason: "分析远程地址的关联访问和下载行为。",
        target_node_ids: [
          "net_address:public:20.0.40.208:0",
          "net_endpoint:public:20.0.40.208:8080:ipproto_tcp:0",
        ],
        evidence_refs: [],
      },
      {
        action_id: "graph.expand_process_children",
        label: "查子进程",
        reason: "查看 calc.exe 后续行为。",
        target_node_ids: [CALC_PROCESS],
        evidence_refs: [],
      },
    ],
    can_finalize: false,
    finalize_reason: "缺少 DLL 加载执行证据，无法确认完整攻击链。",
  },
}
