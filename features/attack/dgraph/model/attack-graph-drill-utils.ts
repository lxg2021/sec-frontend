import { getGraphCaseEdgeSemanticKey } from "./attack-graph-edge-identity";
import type {
  GraphCaseEdgeDto,
  GraphCaseNodeDto,
  GraphCaseResponseDto,
} from "./attack-graph-data";

export const GRAPH_DRILL_TIME_PADDING_MINUTES = 30;

export function buildGraphDrillTimeRange(
  startTime: string | undefined,
  endTime: string | undefined,
  paddingMinutes = GRAPH_DRILL_TIME_PADDING_MINUTES,
) {
  const startDate = parseGraphTime(startTime);
  const endDate = parseGraphTime(endTime);
  if (!startDate || !endDate) {
    return null;
  }

  return {
    startTime: formatGraphTime(
      new Date(startDate.getTime() - paddingMinutes * 60_000),
    ),
    endTime: formatGraphTime(
      new Date(endDate.getTime() + paddingMinutes * 60_000),
    ),
  };
}

export function mergeGraphCaseDrillResult(
  current: GraphCaseResponseDto,
  incoming: {
    nodes: GraphCaseNodeDto[];
    edges: GraphCaseEdgeDto[];
  },
) {
  const currentNodes = current.nodes ?? [];
  const currentEdges = current.edges ?? [];
  const nextNodes = [...currentNodes];
  const nextEdges = [...currentEdges];
  const nodeKeys = new Set(
    currentNodes.map((node) => node.key?.trim()).filter(Boolean),
  );
  const edgeKeys = new Set(currentEdges.map(getGraphCaseEdgeSemanticKey));
  let addedNodeCount = 0;
  let addedEdgeCount = 0;

  for (const node of incoming.nodes) {
    const key = node.key?.trim();
    if (!key || nodeKeys.has(key)) {
      continue;
    }
    nodeKeys.add(key);
    nextNodes.push(node);
    addedNodeCount += 1;
  }

  for (const edge of incoming.edges) {
    const key = getGraphCaseEdgeSemanticKey(edge);
    if (!key || edgeKeys.has(key)) {
      continue;
    }
    edgeKeys.add(key);
    nextEdges.push(edge);
    addedEdgeCount += 1;
  }

  return {
    addedEdgeCount,
    addedNodeCount,
    response: {
      ...current,
      nodes: nextNodes,
      edges: nextEdges,
      diagnostics: {
        ...current.diagnostics,
        node_count: nextNodes.length,
        edge_count: nextEdges.length,
      },
    } satisfies GraphCaseResponseDto,
  };
}

function parseGraphTime(value: string | undefined) {
  const text = value?.trim();
  if (!text) {
    return null;
  }

  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?$/,
  );
  if (!match) {
    const fallback = new Date(text);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  const [, year, month, day, hour = "00", minute = "00", second = "00"] =
    match;
  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ),
  );
}

function formatGraphTime(value: Date) {
  const pad = (input: number) => String(input).padStart(2, "0");

  return (
    [
      value.getUTCFullYear(),
      pad(value.getUTCMonth() + 1),
      pad(value.getUTCDate()),
    ].join("-") +
    " " +
    [
      pad(value.getUTCHours()),
      pad(value.getUTCMinutes()),
      pad(value.getUTCSeconds()),
    ].join(":")
  );
}
