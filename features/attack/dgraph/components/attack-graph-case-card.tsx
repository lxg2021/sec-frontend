"use client";

import type { ReactNode } from "react";
import { ArrowLeft, RotateCcw, Shield } from "lucide-react";

import {
  AttackGraphFlow,
  AttackGraphFlowHeader,
  type AttackGraphNodeFocusRequest,
} from "./attack-graph-flow";
import {
  AttackGraphLayoutStrategyToggle,
  type AttackGraphLayoutStrategyOption,
} from "./attack-graph-layout-strategy-toggle";
import type {
  AttackGraphLayoutOptions,
  GraphCaseResponseDto,
} from "../model/core/attack-graph-data";
import type {
  AttackGraphIocCandidateSyncState,
  AttackGraphMenuAction,
  AttackGraphNodeDrillStateByKey,
  AttackGraphRemediationHistoryNodeStateByKey,
} from "../model/menu/attack-graph-menu-types";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/shared/ui/card";

export interface AttackGraphCaseCardProps {
  backLabel?: string;
  caseId: string;
  controlPanel?: ReactNode;
  edgeCount?: number;
  enableIocMenu?: boolean;
  enableRemediationMenu?: boolean;
  error?: string;
  focusNodeRequest?: AttackGraphNodeFocusRequest | null;
  layoutOptions?: AttackGraphLayoutOptions;
  layoutStrategy: AttackGraphLayoutStrategyOption;
  loading?: boolean;
  nodeDrillStateByKey?: AttackGraphNodeDrillStateByKey;
  nodeCount?: number;
  iocCandidateIdentityKeys?: ReadonlySet<string>;
  iocCandidateUserSourceKeys?: ReadonlySet<string>;
  iocCandidateSyncState?: AttackGraphIocCandidateSyncState;
  onBack?: () => void;
  onLayoutStrategyChange: (strategy: AttackGraphLayoutStrategyOption) => void;
  onMenuAction?: (action: AttackGraphMenuAction) => void | Promise<void>;
  onResetPositions: () => void;
  positionResetKey: number | string;
  remediationHistoryNodeStates?: AttackGraphRemediationHistoryNodeStateByKey;
  remediationTargetKeys?: ReadonlySet<string>;
  response: GraphCaseResponseDto | null;
  subtitle?: string;
  title: string;
}

export function AttackGraphCaseCard({
  backLabel = "Back",
  caseId,
  controlPanel,
  edgeCount = 0,
  enableIocMenu = true,
  enableRemediationMenu = true,
  error = "",
  focusNodeRequest,
  layoutOptions,
  layoutStrategy,
  loading = false,
  nodeDrillStateByKey,
  nodeCount = 0,
  iocCandidateIdentityKeys,
  iocCandidateUserSourceKeys,
  iocCandidateSyncState,
  onBack,
  onLayoutStrategyChange,
  onMenuAction,
  onResetPositions,
  positionResetKey,
  remediationHistoryNodeStates,
  remediationTargetKeys,
  response,
  subtitle,
  title,
}: AttackGraphCaseCardProps) {
  const hasCaseId = Boolean(caseId.trim());
  const hasGraph = Boolean(response && nodeCount > 0);

  return (
    <Card className="min-w-0 overflow-hidden rounded-[24px] border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <CardHeader className="p-4 sm:p-5">
        <AttackGraphFlowHeader
          title={title}
          subtitle={subtitle}
          nodeCount={response ? nodeCount : undefined}
          edgeCount={response ? edgeCount : undefined}
          action={
            onBack || hasGraph ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {onBack ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onBack}
                      className="h-10 rounded-full bg-white px-3 text-xs font-medium text-slate-600"
                      title={backLabel}
                      aria-label={backLabel}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span className="whitespace-nowrap">{backLabel}</span>
                    </Button>
                    {hasGraph ? (
                      <span className="px-0.5 text-xl font-light leading-none text-slate-300" aria-hidden="true">
                        |
                      </span>
                    ) : null}
                  </>
                ) : null}
                {hasGraph ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 rounded-full bg-white px-3 text-xs font-medium text-slate-600"
                      onClick={onResetPositions}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset
                    </Button>
                    <span className="px-0.5 text-xl font-light leading-none text-slate-300" aria-hidden="true">
                      |
                    </span>
                    <AttackGraphLayoutStrategyToggle
                      value={layoutStrategy}
                      onChange={onLayoutStrategyChange}
                    />
                  </>
                ) : null}
              </div>
            ) : null
          }
        />
      </CardHeader>

      <div className="border-t border-slate-100" />

      <CardContent className="p-0">
        <div className="w-full h-[760px]">
          {!hasCaseId ? (
            <GraphStateMessage
              title="No CaseID"
              description="Select a case in Attack Details and click Trace Attack to load the GraphCase view."
            />
          ) : loading ? (
            <GraphStateMessage
              title="Loading GraphCase"
              description={`Fetching graph data for case ${caseId}.`}
            />
          ) : error ? (
            <GraphStateMessage
              title="GraphCase Load Failed"
              description={error}
            />
          ) : hasGraph && response ? (
            <AttackGraphFlow
              controlPanel={controlPanel}
              focusNodeRequest={focusNodeRequest}
              response={response}
              className="h-full"
              enableIocMenu={enableIocMenu}
              enableRemediationMenu={enableRemediationMenu}
              iocCandidateIdentityKeys={iocCandidateIdentityKeys}
              iocCandidateUserSourceKeys={iocCandidateUserSourceKeys}
              iocCandidateSyncState={iocCandidateSyncState}
              layoutOptions={layoutOptions}
              nodeDrillStateByKey={nodeDrillStateByKey}
              onMenuAction={onMenuAction}
              positionResetKey={positionResetKey}
              remediationHistoryNodeStates={remediationHistoryNodeStates}
              remediationTargetKeys={remediationTargetKeys}
            />
          ) : (
            <GraphStateMessage
              title="No Graph Data"
              description={`GraphCase returned no nodes for case ${caseId}.`}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function GraphStateMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-slate-100">
          <Shield className="h-5 w-5 text-slate-500" />
        </div>
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}
