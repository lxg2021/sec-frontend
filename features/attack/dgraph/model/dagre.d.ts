declare module "dagre" {
  export namespace graphlib {
    class Graph {
      setDefaultEdgeLabel(callback: () => unknown): void;
      setGraph(label: Record<string, unknown>): void;
      setNode(id: string, label: Record<string, unknown>): void;
      setEdge(source: string, target: string, label?: Record<string, unknown>): void;
      hasNode(id: string): boolean;
      node(id: string): { x: number; y: number } | undefined;
    }
  }

  export function layout(graph: graphlib.Graph): void;
}

