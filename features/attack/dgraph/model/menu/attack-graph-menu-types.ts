import type { ReactNode } from "react";

import type {
  AttackGraphLayoutResult,
  AttackGraphNodeModel,
} from "../core/attack-graph-data";

export interface AttackGraphMenuContext {
  graph: AttackGraphLayoutResult;
  node: AttackGraphNodeModel;
}

export type AttackGraphMenuActionKind =
  | "copy-label"
  | "node-drilldown"
  | string;

export type AttackGraphNodeDrillState = "idle" | "loading" | "empty" | "done";

export type AttackGraphNodeDrillStateByKey = ReadonlyMap<
  string,
  AttackGraphNodeDrillState
>;

export interface AttackGraphMenuAction {
  kind: AttackGraphMenuActionKind;
  node: AttackGraphNodeModel;
  graph: AttackGraphLayoutResult;
}

export interface AttackGraphMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
  danger?: boolean;
  checked?: boolean;
  action: (context: AttackGraphMenuContext) => void | Promise<void>;
}

export interface AttackGraphMenuGroup {
  id: string;
  label?: string;
  order?: number;
  items: AttackGraphMenuItem[];
}

export type AttackGraphMenuProvider = (
  context: AttackGraphMenuContext,
) => AttackGraphMenuGroup[] | Promise<AttackGraphMenuGroup[]>;
