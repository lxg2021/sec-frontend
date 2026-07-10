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
  | "add-ioc-candidates"
  | "add-remediation-target"
  | "remove-remediation-target"
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

export type AttackGraphMenuItemTone =
  | "default"
  | "primary"
  | "success"
  | "danger";

export interface AttackGraphMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
  danger?: boolean;
  checked?: boolean;
  tone?: AttackGraphMenuItemTone;
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
