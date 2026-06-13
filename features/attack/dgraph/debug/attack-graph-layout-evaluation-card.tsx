"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, GitBranch, XCircle } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { ScrollArea } from "@/shared/ui/scroll-area";

import type {
  AttackGraphLayoutOptions,
  AttackGraphLayoutStrategy,
  GraphCaseResponseDto,
} from "../model/attack-graph-data";
import { buildAttackGraphModel } from "../model/attack-graph-adapter";
import { buildAttackGraphEdgeDiagnostics } from "../model/attack-graph-edge-diagnostics";
import {
  buildAttackGraphEdgeRoutes,
  type AttackGraphNodeEdgeGeometry,
} from "../model/attack-graph-edge-routing";
import { layoutAttackGraph } from "../model/attack-graph-layout";
import {
  getAttackGraphNodeKindConfig,
  getAttackGraphNodeSize,
} from "../model/attack-graph-node-config";
import {
  AttackGraphFlow,
  type AttackGraphFlowDiagnostics,
} from "../components/attack-graph-flow";
import {
  ATTACK_GRAPH_DEFAULT_NODE_HEIGHT,
  ATTACK_GRAPH_NODE_HALO_PADDING,
  ATTACK_GRAPH_NODE_TILE_WIDTH,
  getAttackGraphNodeVisualHeight,
} from "../components/attack-graph-node";

type EvaluationStatus = "pass" | "review" | "fail" | "pending";
type EvaluationStrategyOption = "auto" | AttackGraphLayoutStrategy;

interface EvaluationScenario {
  description: string;
  id: string;
  response: GraphCaseResponseDto;
  title: string;
}

const DEFAULT_CASE_ID_PREFIX = "layout-eval";
const EVALUATION_STRATEGY_OPTIONS: EvaluationStrategyOption[] = [
  "auto",
  "layered",
  "stress",
];

const EVALUATION_SCENARIOS: EvaluationScenario[] = [
  {
    id: "account-member-chain",
    title: "2-node account membership",
    description: "A single account-group membership edge must stay horizontal.",
    response: buildGraphCase({
      caseId: "account-member-chain",
      nodes: [
        accountNode("acc-sid-1005", "S-1-5-21-2937760381-772137275-3990200495-1005"),
        accountGroupNode("grp-users", "users"),
      ],
      edges: [
        edge("ACCOUNT_GROUP_HAS_MEMBER", "grp-users", "acc-sid-1005"),
      ],
    }),
  },
  {
    id: "linear-process-chain",
    title: "Linear process chain",
    description: "Three process nodes should read as one consistent left-to-right chain.",
    response: buildGraphCase({
      caseId: "linear-process-chain",
      nodes: [
        processNode("cmd", "cmd.exe"),
        processNode("rundll32", "rundll32.exe"),
        processNode("regsvr32", "regsvr32.exe"),
      ],
      edges: [
        edge("PROCESS_CREATE_PROCESS", "cmd", "rundll32"),
        edge("PROCESS_CREATE_PROCESS", "rundll32", "regsvr32"),
      ],
    }),
  },
  {
    id: "single-source-fanout",
    title: "Single-source fanout",
    description: "One process creates several artifacts without collapsing the center.",
    response: buildGraphCase({
      caseId: "single-source-fanout",
      nodes: [
        processNode("rundll32", "rundll32.exe"),
        fileNode("dll", "C:/Windows/System32/scrobj.dll"),
        fileNode("payload", "C:/Users/Public/payload.sct"),
        endpointNode("endpoint-8080", "20.0.25.174:8080"),
        registryNode("run-key", "HKCU/Software/Microsoft/Windows/CurrentVersion/Run"),
      ],
      edges: [
        edge("PROCESS_LOAD_DLL", "rundll32", "dll"),
        edge("PROCESS_CREATE_FILE", "rundll32", "payload"),
        edge("PROCESS_CONNECT_ENDPOINT", "rundll32", "endpoint-8080"),
        edge("PROCESS_SET_REGISTRY_VALUE", "rundll32", "run-key"),
      ],
    }),
  },
  {
    id: "multi-source-fanin",
    title: "Multi-source fanin",
    description: "Multiple processes converge on one file without node overlap.",
    response: buildGraphCase({
      caseId: "multi-source-fanin",
      nodes: [
        processNode("cmd", "cmd.exe"),
        processNode("powershell", "powershell.exe"),
        processNode("wscript", "wscript.exe"),
        fileNode("shared-file", "C:/Users/Public/stage.dat"),
      ],
      edges: [
        edge("PROCESS_WRITE_FILE", "cmd", "shared-file"),
        edge("PROCESS_WRITE_FILE", "powershell", "shared-file"),
        edge("PROCESS_WRITE_FILE", "wscript", "shared-file"),
      ],
    }),
  },
  {
    id: "main-chain-to-fanout-hub",
    title: "Main chain into fanout hub",
    description: "The entry process chain should align to the fanout hub center.",
    response: buildGraphCase({
      caseId: "main-chain-to-fanout-hub",
      nodes: [
        processNode("cmd", "cmd.exe"),
        processNode("rundll32", "rundll32.exe"),
        endpointNode("endpoint-8080", "20.0.25.174:8080"),
        netAddressNode("address-20", "20.0.25.174"),
        fileNode("sct", "C:/Users/Sangfor/AppData/Local/Microsoft/Windows/INetCache/IE/R3VYDCGP/advpack_calc[1].sct"),
        fileNode("dll", "C:/Windows/System32/ieadvpack.dll"),
      ],
      edges: [
        edge("PROCESS_CREATE_PROCESS", "cmd", "rundll32"),
        edge("PROCESS_CONNECT_ENDPOINT", "rundll32", "endpoint-8080"),
        edge("ADDRESS_HAS_ENDPOINT", "address-20", "endpoint-8080"),
        edge("PROCESS_CREATE_FILE", "rundll32", "sct"),
        edge("PROCESS_LOAD_DLL", "rundll32", "dll"),
      ],
    }),
  },
  {
    id: "mixed-process-resource",
    title: "Mixed process and resources",
    description: "Process chain with network, file, registry, and account side nodes.",
    response: buildGraphCase({
      caseId: "mixed-process-resource",
      nodes: [
        processNode("winword", "winword.exe"),
        processNode("powershell", "powershell.exe"),
        processNode("rundll32", "rundll32.exe"),
        fileNode("doc", "C:/Users/Public/invoice.doc"),
        fileNode("ps1", "C:/Users/Public/run.ps1"),
        registryNode("run-key", "HKCU/Software/Microsoft/Windows/CurrentVersion/Run"),
        endpointNode("c2", "10.10.8.12:443"),
        accountNode("admin", "S-1-5-21-111-222-333-500", "ADMIN"),
      ],
      edges: [
        edge("PROCESS_READ_FILE", "winword", "doc"),
        edge("PROCESS_CREATE_PROCESS", "winword", "powershell"),
        edge("PROCESS_CREATE_PROCESS", "powershell", "rundll32"),
        edge("PROCESS_READ_FILE", "powershell", "ps1"),
        edge("PROCESS_SET_REGISTRY_VALUE", "powershell", "run-key"),
        edge("PROCESS_CONNECT_ENDPOINT", "rundll32", "c2"),
        edge("PROCESS_IMPERSONATE_TOKEN", "rundll32", "admin"),
      ],
    }),
  },
  {
    id: "parallel-multi-edge",
    title: "Parallel multi-edge",
    description: "Several edges between the same nodes need separated fanout curves.",
    response: buildGraphCase({
      caseId: "parallel-multi-edge",
      nodes: [
        processNode("powershell", "powershell.exe"),
        fileNode("payload", "C:/Users/Public/payload.bin"),
      ],
      edges: [
        edge("PROCESS_CREATE_FILE", "powershell", "payload", "create"),
        edge("PROCESS_WRITE_FILE", "powershell", "payload", "write"),
        edge("PROCESS_READ_FILE", "powershell", "payload", "read"),
        edge("PROCESS_CHANGE_FILE_ATTRIBUTES", "powershell", "payload", "attr"),
        edge("PROCESS_DELETE_FILE", "powershell", "payload", "delete"),
      ],
    }),
  },
  {
    id: "self-loop",
    title: "Self-loop",
    description: "Self-referential process events should choose a free loop side.",
    response: buildGraphCase({
      caseId: "self-loop",
      nodes: [
        processNode("malware", "malware.exe"),
        fileNode("config", "C:/ProgramData/config.json"),
        registryNode("run-key", "HKLM/Software/Microsoft/Windows/CurrentVersion/Run"),
      ],
      edges: [
        edge("PROCESS_ACCESS_PROCESS", "malware", "malware"),
        edge("PROCESS_READ_FILE", "malware", "config"),
        edge("PROCESS_SET_REGISTRY_VALUE", "malware", "run-key"),
      ],
    }),
  },
  {
    id: "ip-network-30-node-map",
    title: "30-node IP network map",
    description: "Dense IP network information graph with hosts, devices, DNS, endpoints, URL resources, processes, and files.",
    response: buildIpNetworkScenario(),
  },
  {
    id: "multi-host-network-investigation",
    title: "Multi-host network investigation",
    description: "More than 30 connected nodes across host inventory, DNS resolution, endpoints, URL downloads, and process activity.",
    response: buildMultiHostNetworkScenario(),
  },
];

export function AttackGraphLayoutEvaluationCard() {
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    EVALUATION_SCENARIOS[0]?.id ?? "",
  );
  const [strategyOption, setStrategyOption] =
    useState<EvaluationStrategyOption>("auto");
  const [diagnosticsByScenarioId, setDiagnosticsByScenarioId] = useState<
    Record<string, AttackGraphFlowDiagnostics>
  >({});

  const selectedScenario =
    EVALUATION_SCENARIOS.find((scenario) => scenario.id === selectedScenarioId) ??
    EVALUATION_SCENARIOS[0];

  useEffect(() => {
    let cancelled = false;
    setDiagnosticsByScenarioId({});

    async function evaluateScenarios() {
      const results = await Promise.all(
        EVALUATION_SCENARIOS.map(async (scenario) => [
          scenario.id,
          await evaluateScenario(scenario, strategyOption),
        ] as const),
      );
      if (!cancelled) {
        setDiagnosticsByScenarioId(Object.fromEntries(results));
      }
    }

    evaluateScenarios().catch((error) => {
      console.error("Failed to evaluate attack graph layout scenarios", error);
    });

    return () => {
      cancelled = true;
    };
  }, [strategyOption]);

  const summary = useMemo(() => {
    const statuses = EVALUATION_SCENARIOS.map((scenario) =>
      getScenarioStatus(diagnosticsByScenarioId[scenario.id]),
    );
    return {
      fail: statuses.filter((status) => status === "fail").length,
      pass: statuses.filter((status) => status === "pass").length,
      pending: statuses.filter((status) => status === "pending").length,
      review: statuses.filter((status) => status === "review").length,
      total: statuses.length,
    };
  }, [diagnosticsByScenarioId]);

  const handleDiagnosticsChange = useCallback(
    (scenarioId: string, diagnostics: AttackGraphFlowDiagnostics) => {
      setDiagnosticsByScenarioId((current) => {
        const previous = current[scenarioId];
        if (
          previous?.edgeDiagnosticsText === diagnostics.edgeDiagnosticsText &&
          previous?.layoutStrategy === diagnostics.layoutStrategy &&
          previous?.topologyDiagnosticsText === diagnostics.topologyDiagnosticsText &&
          previous?.topologyKind === diagnostics.topologyKind
        ) {
          return current;
        }
        return {
          ...current,
          [scenarioId]: diagnostics,
        };
      });
    },
    [],
  );

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white">
              <GitBranch className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold text-slate-900">
                Attack Graph Layout Evaluation
              </CardTitle>
              <div className="mt-1 text-xs text-slate-500">
                Synthetic GraphCase scenarios for layout regression.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <StrategyToggle
              value={strategyOption}
              onChange={setStrategyOption}
            />
            <SummaryPill label="Pass" value={summary.pass} tone="pass" />
            <SummaryPill label="Review" value={summary.review} tone="review" />
            <SummaryPill label="Fail" value={summary.fail} tone="fail" />
            <SummaryPill label="Pending" value={summary.pending} tone="pending" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid min-h-[620px] grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-r border-slate-100 bg-slate-50/70">
            <ScrollArea className="h-[620px]">
              <div className="space-y-2 p-3">
                {EVALUATION_SCENARIOS.map((scenario) => {
                  const diagnostics = diagnosticsByScenarioId[scenario.id];
                  const status = getScenarioStatus(diagnostics);
                  const selected = scenario.id === selectedScenario.id;

                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      className={cn(
                        "w-full rounded-md border px-3 py-3 text-left transition-colors",
                        selected
                          ? "border-slate-900 bg-white shadow-sm"
                          : "border-transparent bg-transparent hover:border-slate-200 hover:bg-white",
                      )}
                      onClick={() => setSelectedScenarioId(scenario.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {scenario.title}
                          </div>
                          <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {scenario.description}
                          </div>
                        </div>
                        <StatusBadge status={status} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <MetricBadge
                          label="nodes"
                          value={scenario.response.nodes?.length ?? 0}
                        />
                        <MetricBadge
                          label="edges"
                          value={scenario.response.edges?.length ?? 0}
                        />
                        {diagnostics ? (
                          <MetricBadge
                            label="topology"
                            value={diagnostics.topologyKind ?? "unknown"}
                          />
                        ) : null}
                        {diagnostics ? (
                          <MetricBadge
                            label="strategy"
                            value={diagnostics.layoutStrategy}
                          />
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </aside>
          <section className="min-w-0">
            <div className="flex min-h-[76px] items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">
                  {selectedScenario.title}
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  {selectedScenario.description}
                </div>
              </div>
              <ScenarioDiagnostics
                diagnostics={diagnosticsByScenarioId[selectedScenario.id]}
              />
            </div>
            <div className="h-[544px] bg-white">
              <AttackGraphFlow
                key={`${selectedScenario.id}-${strategyOption}`}
                response={selectedScenario.response}
                className="h-full"
                layoutOptions={getEvaluationLayoutOptions(strategyOption)}
                showBackground
                onDiagnosticsChange={(diagnostics) =>
                  handleDiagnosticsChange(selectedScenario.id, diagnostics)
                }
              />
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}

function ScenarioDiagnostics({
  diagnostics,
}: {
  diagnostics?: AttackGraphFlowDiagnostics;
}) {
  if (!diagnostics) {
    return (
      <div className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-500">
        pending
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <MetricBox label="topology" value={diagnostics.topologyKind ?? "unknown"} />
      <MetricBox label="strategy" value={diagnostics.layoutStrategy} />
      <MetricBox
        label="blocked/crossing"
        value={`${diagnostics.edgeDiagnostics.blockedEdgeCount}/${diagnostics.edgeDiagnostics.crossingPairCount}`}
      />
      <MetricBox
        label="detour/skip"
        value={`${diagnostics.edgeDiagnostics.detourEdgeCount}/${diagnostics.edgeDiagnostics.skipEdgeCount}`}
      />
      <MetricBox
        label="size"
        value={`${Math.round(diagnostics.graphWidth)}x${Math.round(diagnostics.graphHeight)}`}
      />
    </div>
  );
}

function StrategyToggle({
  onChange,
  value,
}: {
  onChange: (value: EvaluationStrategyOption) => void;
  value: EvaluationStrategyOption;
}) {
  return (
    <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
      {EVALUATION_STRATEGY_OPTIONS.map((option) => {
        const selected = option === value;

        return (
          <button
            key={option}
            type="button"
            className={cn(
              "min-w-16 rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors",
              selected
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
            )}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <div className="text-[10px] uppercase text-slate-400">{label}</div>
      <div className="mt-0.5 max-w-[130px] truncate font-semibold text-slate-800">
        {value}
      </div>
    </div>
  );
}

function SummaryPill({
  label,
  tone,
  value,
}: {
  label: string;
  tone: EvaluationStatus;
  value: number;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 font-medium",
        getToneClassName(tone),
      )}
    >
      {label}
      <span>{value}</span>
    </span>
  );
}

function StatusBadge({ status }: { status: EvaluationStatus }) {
  const Icon =
    status === "pass"
      ? CheckCircle2
      : status === "fail"
        ? XCircle
        : AlertTriangle;

  return (
    <Badge
      data-attack-layout-evaluation-status={status}
      variant="outline"
      className={cn("shrink-0 gap-1 rounded-md capitalize", getToneClassName(status))}
    >
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
}

function MetricBadge({ label, value }: { label: string; value: number | string }) {
  return (
    <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
      {label}: {value}
    </span>
  );
}

function getScenarioStatus(
  diagnostics: AttackGraphFlowDiagnostics | undefined,
): EvaluationStatus {
  if (!diagnostics) {
    return "pending";
  }
  if (
    diagnostics.edgeDiagnostics.blockedEdgeCount > 0 ||
    diagnostics.edgeDiagnostics.crossingPairCount > 0 ||
    diagnostics.edgeDiagnostics.suspiciousEdgeIds.length > 0
  ) {
    return "fail";
  }
  if (
    diagnostics.edgeDiagnostics.detourEdgeCount > 0 ||
    diagnostics.edgeDiagnostics.skipEdgeCount > 0 ||
    diagnostics.topologyKind === "complex"
  ) {
    return "review";
  }
  return "pass";
}

function getToneClassName(status: EvaluationStatus) {
  switch (status) {
    case "pass":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "review":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "fail":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-500";
  }
}

async function evaluateScenario(
  scenario: EvaluationScenario,
  strategyOption: EvaluationStrategyOption,
): Promise<AttackGraphFlowDiagnostics> {
  const graph = buildAttackGraphModel(scenario.response);
  const layouted = await layoutAttackGraph(graph, {
    direction: "LR",
    nodeHeight: ATTACK_GRAPH_DEFAULT_NODE_HEIGHT,
    nodeSep: 48,
    nodeWidth: ATTACK_GRAPH_NODE_TILE_WIDTH,
    rankSep: 110,
    ...getEvaluationLayoutOptions(strategyOption),
  });
  const nodeGeometryById = buildEvaluationNodeGeometryById(layouted.nodes);
  const edgeRoutesById = buildAttackGraphEdgeRoutes(
    layouted.edges,
    nodeGeometryById,
  );
  const evaluatedEdgeRoutesById = layouted.edgeRoutesById ?? edgeRoutesById;
  const edgeDiagnostics = buildAttackGraphEdgeDiagnostics(
    layouted.edges,
    evaluatedEdgeRoutesById,
    nodeGeometryById,
  );

  return {
    edgeCount: layouted.edges.length,
    edgeDiagnostics,
    edgeDiagnosticsText: formatEdgeDiagnostics(edgeDiagnostics),
    graphHeight: layouted.height,
    graphWidth: layouted.width,
    layoutMode: layouted.layoutMode,
    layoutStrategy: layouted.layoutStrategy,
    nodeCount: layouted.nodes.length,
    topologyDiagnostics: layouted.topologyDiagnostics,
    topologyDiagnosticsText: layouted.topologyDiagnostics
      ? formatTopologyDiagnostics(layouted.topologyDiagnostics)
      : "pending",
    topologyKind: layouted.topologyKind,
  };
}

function getEvaluationLayoutOptions(
  strategyOption: EvaluationStrategyOption,
): Pick<AttackGraphLayoutOptions, "strategy"> {
  return strategyOption === "auto" ? {} : { strategy: strategyOption };
}

function buildEvaluationNodeGeometryById(
  nodes: ReturnType<typeof buildAttackGraphModel>["nodes"],
) {
  const geometryById = new Map<string, AttackGraphNodeEdgeGeometry>();

  for (const node of nodes) {
    const nodeConfig = getAttackGraphNodeKindConfig(node.presentationKind);
    const size = getAttackGraphNodeSize(nodeConfig);
    const position = node.position ?? { x: 0, y: 0 };
    geometryById.set(node.id, {
      bounds: {
        height: getAttackGraphNodeVisualHeight(size),
        width: ATTACK_GRAPH_NODE_TILE_WIDTH,
        x: position.x,
        y: position.y,
      },
      centerX: position.x + ATTACK_GRAPH_NODE_TILE_WIDTH / 2,
      centerY: position.y + ATTACK_GRAPH_NODE_HALO_PADDING + size.icon / 2,
      id: node.id,
      radius: size.icon / 2 + 4,
    });
  }

  return geometryById;
}

function formatTopologyDiagnostics(
  diagnostics: NonNullable<AttackGraphFlowDiagnostics["topologyDiagnostics"]>,
) {
  return [
    `nodes=${diagnostics.nodeCount}`,
    `edges=${diagnostics.edgeCount}`,
    `relation=${diagnostics.relationEdgeCount}`,
    `selfLoop=${diagnostics.selfLoopCount}`,
    `roots=${diagnostics.rootCount}`,
    `sinks=${diagnostics.sinkCount}`,
    `maxIn=${diagnostics.maxInDegree}`,
    `maxOut=${diagnostics.maxOutDegree}`,
    `multiPair=${diagnostics.multiEdgePairCount}`,
    `treeDelta=${diagnostics.treeEdgeDelta}`,
    `cyclic=${diagnostics.cyclic ? 1 : 0}`,
  ].join(";");
}

function formatEdgeDiagnostics(
  diagnostics: AttackGraphFlowDiagnostics["edgeDiagnostics"],
) {
  return [
    `edges=${diagnostics.edgeCount}`,
    `relation=${diagnostics.relationEdgeCount}`,
    `selfLoop=${diagnostics.selfLoopEdgeCount}`,
    `skip=${diagnostics.skipEdgeCount}`,
    `detour=${diagnostics.detourEdgeCount}`,
    `blocked=${diagnostics.blockedEdgeCount}`,
    `maxBlocked=${diagnostics.maxBlockedNodeCount}`,
    `crossing=${diagnostics.crossingPairCount}`,
    `suspect=${diagnostics.suspiciousEdgeIds.length}`,
  ].join(";");
}

function buildGraphCase({
  caseId,
  edges,
  nodes,
}: {
  caseId: string;
  edges: NonNullable<GraphCaseResponseDto["edges"]>;
  nodes: NonNullable<GraphCaseResponseDto["nodes"]>;
}) {
  return {
    case_id: `${DEFAULT_CASE_ID_PREFIX}-${caseId}`,
    diagnostics: {
      edge_count: edges.length,
      node_count: nodes.length,
    },
    edges,
    end_time: "",
    nodes,
    request_id: `${DEFAULT_CASE_ID_PREFIX}-${caseId}-request`,
    start_time: "",
    tenant_id: "layout-evaluation",
  } satisfies GraphCaseResponseDto;
}

function buildIpNetworkScenario() {
  const nodes = [
    hostNode("host-web", "web-01.corp.local"),
    hostNode("host-app", "app-01.corp.local"),
    hostNode("host-db", "db-01.corp.local"),
    deviceNode("device-web-nic", "Intel(R) Ethernet Controller - web-01"),
    deviceNode("device-app-nic", "Intel(R) Ethernet Controller - app-01"),
    deviceNode("device-db-nic", "Intel(R) Ethernet Controller - db-01"),
    dnsNode("dns-api", "api.corp.local"),
    dnsNode("dns-update", "update.corp.local"),
    dnsNode("dns-cdn", "cdn.vendor.example"),
    netAddressNode("ip-web", "10.20.1.10"),
    netAddressNode("ip-app", "10.20.1.20"),
    netAddressNode("ip-db", "10.20.1.30"),
    netAddressNode("ip-c2", "198.51.100.44"),
    netAddressNode("ip-cdn", "203.0.113.18"),
    endpointNode("ep-web-443", "10.20.1.10:443"),
    endpointNode("ep-app-8443", "10.20.1.20:8443"),
    endpointNode("ep-db-1433", "10.20.1.30:1433"),
    endpointNode("ep-c2-443", "198.51.100.44:443"),
    endpointNode("ep-cdn-80", "203.0.113.18:80"),
    urlNode("url-api", "https://api.corp.local/v1/session"),
    urlNode("url-update", "https://update.corp.local/pkg/stage.bin"),
    urlNode("url-cdn", "http://cdn.vendor.example/lib.dat"),
    processNode("proc-nginx", "nginx.exe"),
    processNode("proc-agent", "agent.exe"),
    processNode("proc-sql", "sqlservr.exe"),
    processNode("proc-powershell", "powershell.exe"),
    fileNode("file-agent-log", "C:/ProgramData/agent/logs/net.log"),
    fileNode("file-stage", "C:/ProgramData/update/stage.bin"),
    fileNode("file-config", "C:/ProgramData/agent/config.json"),
    registryNode("reg-proxy", "HKLM/Software/Corp/Proxy"),
  ];
  const edges = [
    edge("DEVICE_BELONG_TO_HOST", "device-web-nic", "host-web"),
    edge("DEVICE_BELONG_TO_HOST", "device-app-nic", "host-app"),
    edge("DEVICE_BELONG_TO_HOST", "device-db-nic", "host-db"),
    edge("DNS_NAME_RESOLVE_ADDRESS", "dns-api", "ip-web"),
    edge("DNS_NAME_RESOLVE_ADDRESS", "dns-update", "ip-c2"),
    edge("DNS_NAME_RESOLVE_ADDRESS", "dns-cdn", "ip-cdn"),
    edge("ADDRESS_HAS_ENDPOINT", "ip-web", "ep-web-443"),
    edge("ADDRESS_HAS_ENDPOINT", "ip-app", "ep-app-8443"),
    edge("ADDRESS_HAS_ENDPOINT", "ip-db", "ep-db-1433"),
    edge("ADDRESS_HAS_ENDPOINT", "ip-c2", "ep-c2-443"),
    edge("ADDRESS_HAS_ENDPOINT", "ip-cdn", "ep-cdn-80"),
    edge("PROCESS_CONNECT_ENDPOINT", "proc-nginx", "ep-app-8443"),
    edge("PROCESS_CONNECT_ENDPOINT", "proc-agent", "ep-c2-443"),
    edge("PROCESS_CONNECT_ENDPOINT", "proc-agent", "ep-cdn-80"),
    edge("PROCESS_CONNECT_ENDPOINT", "proc-sql", "ep-db-1433"),
    edge("PROCESS_ACCESS_URL", "proc-agent", "url-update"),
    edge("PROCESS_ACCESS_URL", "proc-powershell", "url-cdn"),
    edge("URL_DOWNLOAD_TO_FILE", "url-update", "file-stage"),
    edge("URL_DOWNLOAD_TO_FILE", "url-cdn", "file-config"),
    edge("PROCESS_CREATE_FILE", "proc-agent", "file-agent-log"),
    edge("PROCESS_CREATE_FILE", "proc-agent", "file-stage"),
    edge("PROCESS_READ_FILE", "proc-agent", "file-config"),
    edge("PROCESS_SET_REGISTRY_VALUE", "proc-agent", "reg-proxy"),
    edge("PROCESS_CREATE_PROCESS", "proc-agent", "proc-powershell"),
    edge("PROCESS_QUERY_DNS_NAME", "proc-agent", "dns-update"),
    edge("PROCESS_QUERY_DNS_NAME", "proc-powershell", "dns-cdn"),
    edge("TARGET_REMOTE_HOST", "proc-agent", "host-app"),
    edge("TARGET_REMOTE_HOST", "proc-powershell", "host-web"),
    edge("PROCESS_CONNECT_ENDPOINT", "proc-powershell", "ep-c2-443"),
    edge("PROCESS_WRITE_FILE", "proc-powershell", "file-stage"),
    edge("PROCESS_READ_FILE", "proc-nginx", "file-config"),
    edge("PROCESS_QUERY_DNS_NAME", "proc-nginx", "dns-api"),
  ];

  return buildGraphCase({
    caseId: "ip-network-30-node-map",
    nodes,
    edges,
  });
}

function buildMultiHostNetworkScenario() {
  const hosts = [
    hostNode("host-user-01", "user-01.corp.local"),
    hostNode("host-user-02", "user-02.corp.local"),
    hostNode("host-jump", "jump-01.corp.local"),
    hostNode("host-dc", "dc-01.corp.local"),
  ];
  const devices = [
    deviceNode("dev-user-01", "Realtek PCIe GbE - user-01"),
    deviceNode("dev-user-02", "Realtek PCIe GbE - user-02"),
    deviceNode("dev-jump", "Intel Ethernet - jump-01"),
    deviceNode("dev-dc", "Intel Ethernet - dc-01"),
  ];
  const addresses = [
    netAddressNode("ip-user-01", "172.16.3.21"),
    netAddressNode("ip-user-02", "172.16.3.22"),
    netAddressNode("ip-jump", "172.16.10.5"),
    netAddressNode("ip-dc", "172.16.1.10"),
    netAddressNode("ip-malware", "45.77.12.9"),
    netAddressNode("ip-storage", "172.16.20.15"),
  ];
  const endpoints = [
    endpointNode("ep-user-445", "172.16.3.21:445"),
    endpointNode("ep-user2-445", "172.16.3.22:445"),
    endpointNode("ep-jump-3389", "172.16.10.5:3389"),
    endpointNode("ep-dc-389", "172.16.1.10:389"),
    endpointNode("ep-malware-443", "45.77.12.9:443"),
    endpointNode("ep-storage-445", "172.16.20.15:445"),
  ];
  const dns = [
    dnsNode("dns-dc", "dc-01.corp.local"),
    dnsNode("dns-storage", "fileshare.corp.local"),
    dnsNode("dns-malware", "cdn-updater.example"),
    dnsNode("dns-login", "login.microsoft.example"),
  ];
  const urls = [
    urlNode("url-stage", "https://cdn-updater.example/update.dat"),
    urlNode("url-token", "https://login.microsoft.example/oauth/token"),
    urlNode("url-share", "file://fileshare.corp.local/tools/psexec.exe"),
  ];
  const processes = [
    processNode("proc-outlook", "outlook.exe"),
    processNode("proc-powershell", "powershell.exe"),
    processNode("proc-cmd", "cmd.exe"),
    processNode("proc-rdp", "mstsc.exe"),
    processNode("proc-lsass", "lsass.exe"),
    processNode("proc-psexec", "psexec.exe"),
  ];
  const files = [
    fileNode("file-stage", "C:/Users/Public/update.dat"),
    fileNode("file-psexec", "C:/Users/Public/psexec.exe"),
    fileNode("file-token", "C:/ProgramData/token.cache"),
    fileNode("file-log", "C:/ProgramData/rdp/session.log"),
  ];
  const registry = [
    registryNode("reg-rdp", "HKLM/System/CurrentControlSet/Control/Terminal Server"),
    registryNode("reg-run", "HKCU/Software/Microsoft/Windows/CurrentVersion/Run"),
  ];

  return buildGraphCase({
    caseId: "multi-host-network-investigation",
    nodes: [
      ...hosts,
      ...devices,
      ...addresses,
      ...endpoints,
      ...dns,
      ...urls,
      ...processes,
      ...files,
      ...registry,
    ],
    edges: [
      edge("DEVICE_BELONG_TO_HOST", "dev-user-01", "host-user-01"),
      edge("DEVICE_BELONG_TO_HOST", "dev-user-02", "host-user-02"),
      edge("DEVICE_BELONG_TO_HOST", "dev-jump", "host-jump"),
      edge("DEVICE_BELONG_TO_HOST", "dev-dc", "host-dc"),
      edge("DNS_NAME_RESOLVE_ADDRESS", "dns-dc", "ip-dc"),
      edge("DNS_NAME_RESOLVE_ADDRESS", "dns-storage", "ip-storage"),
      edge("DNS_NAME_RESOLVE_ADDRESS", "dns-malware", "ip-malware"),
      edge("DNS_NAME_RESOLVE_ADDRESS", "dns-login", "ip-malware"),
      edge("ADDRESS_HAS_ENDPOINT", "ip-user-01", "ep-user-445"),
      edge("ADDRESS_HAS_ENDPOINT", "ip-user-02", "ep-user2-445"),
      edge("ADDRESS_HAS_ENDPOINT", "ip-jump", "ep-jump-3389"),
      edge("ADDRESS_HAS_ENDPOINT", "ip-dc", "ep-dc-389"),
      edge("ADDRESS_HAS_ENDPOINT", "ip-malware", "ep-malware-443"),
      edge("ADDRESS_HAS_ENDPOINT", "ip-storage", "ep-storage-445"),
      edge("PROCESS_CREATE_PROCESS", "proc-outlook", "proc-powershell"),
      edge("PROCESS_CREATE_PROCESS", "proc-powershell", "proc-cmd"),
      edge("PROCESS_CREATE_PROCESS", "proc-cmd", "proc-rdp"),
      edge("PROCESS_CREATE_PROCESS", "proc-cmd", "proc-psexec"),
      edge("PROCESS_CONNECT_ENDPOINT", "proc-powershell", "ep-malware-443"),
      edge("PROCESS_CONNECT_ENDPOINT", "proc-rdp", "ep-jump-3389"),
      edge("PROCESS_CONNECT_ENDPOINT", "proc-psexec", "ep-user-445"),
      edge("PROCESS_CONNECT_ENDPOINT", "proc-psexec", "ep-user2-445"),
      edge("PROCESS_CONNECT_ENDPOINT", "proc-psexec", "ep-storage-445"),
      edge("PROCESS_QUERY_DNS_NAME", "proc-powershell", "dns-malware"),
      edge("PROCESS_QUERY_DNS_NAME", "proc-rdp", "dns-dc"),
      edge("PROCESS_ACCESS_URL", "proc-powershell", "url-stage"),
      edge("PROCESS_ACCESS_URL", "proc-powershell", "url-token"),
      edge("URL_DOWNLOAD_TO_FILE", "url-stage", "file-stage"),
      edge("URL_DOWNLOAD_TO_FILE", "url-share", "file-psexec"),
      edge("PROCESS_CREATE_FILE", "proc-powershell", "file-stage"),
      edge("PROCESS_CREATE_FILE", "proc-psexec", "file-log"),
      edge("PROCESS_READ_FILE", "proc-psexec", "file-psexec"),
      edge("PROCESS_WRITE_FILE", "proc-powershell", "file-token"),
      edge("PROCESS_SET_REGISTRY_VALUE", "proc-cmd", "reg-run"),
      edge("PROCESS_SET_REGISTRY_VALUE", "proc-rdp", "reg-rdp"),
      edge("PROCESS_ACCESS_PROCESS", "proc-powershell", "proc-lsass"),
      edge("PROCESS_IMPERSONATE_TOKEN", "proc-powershell", "proc-lsass"),
      edge("TARGET_REMOTE_HOST", "proc-rdp", "host-jump"),
      edge("TARGET_REMOTE_HOST", "proc-psexec", "host-user-01"),
      edge("TARGET_REMOTE_HOST", "proc-psexec", "host-user-02"),
    ],
  });
}

function processNode(key: string, imageName: string) {
  return node(key, "Process", imageName, {
    image_name: imageName,
    process_name: imageName,
  });
}

function fileNode(key: string, filePath: string) {
  return node(key, "File", filePath, {
    file_name: filePath,
  });
}

function registryNode(key: string, registryPath: string) {
  return node(key, "RegistryKey", registryPath, {
    key_path: registryPath,
  });
}

function hostNode(key: string, hostName: string) {
  return node(key, "Host", hostName, {
    host_name: hostName,
  });
}

function deviceNode(key: string, description: string) {
  return node(key, "Device", description, {
    device_description: description,
  });
}

function dnsNode(key: string, domain: string) {
  return node(key, "DnsName", domain, {
    domain,
  });
}

function endpointNode(key: string, endpoint: string) {
  const [address, port = ""] = endpoint.split(":");
  return node(key, "NetEndpoint", endpoint, {
    address,
    port,
  });
}

function netAddressNode(key: string, address: string) {
  return node(key, "NetAddress", address, {
    address,
  });
}

function urlNode(key: string, url: string) {
  return node(key, "URLResource", url, {
    url,
  });
}

function accountNode(key: string, sid: string, user?: string) {
  return node(key, "Account", user ?? sid, {
    sid,
    user: user ?? "",
  });
}

function accountGroupNode(key: string, groupName: string) {
  return node(key, "AccountGroup", groupName, {
    group_name: groupName,
  });
}

function node(
  key: string,
  entityType: string,
  displayName: string,
  properties: Record<string, string>,
) {
  return {
    display_name: displayName,
    entity_type: entityType,
    key,
    properties,
  };
}

function edge(
  relationType: string,
  source: string,
  target: string,
  edgeKey = relationType.toLowerCase(),
) {
  return {
    edge_key: edgeKey,
    graph_origin: "layout-evaluation",
    properties: {},
    relation_type: relationType,
    scope_id: "layout-evaluation",
    scope_type: "case",
    source_key: source,
    target_key: target,
  };
}
