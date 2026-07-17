"use client"

import { http } from "@/shared/lib/http/client"
import { createUuidRequestId } from "@/shared/lib/utils"

import {
  normalizeRemediationItemList,
  normalizeRemediationNodeActionsResult,
  normalizeRemediationOrder,
  normalizeRemediationDraftItemsUpsertData,
  normalizeRemediationOrderList,
  normalizeRemediationOverviewSummary,
  normalizeRemediationSummary,
  normalizeResolveRemediationNodeAgents,
} from "./normalizers"
import type {
  CancelRemediationOrderRequest,
  ConfirmRemediationOrderRequest,
  CreateRemediationOrderRequest,
  DeleteRemediationDraftItemRequest,
  GetOrCreateRemediationOrderBySourceRequest,
  DeleteRemediationOrderRequest,
  PrepareRemediationOrderRequest,
  QueryEditableRemediationOrderBySourceRequest,
  QueryRemediationItemsByAgentIdRequest,
  QueryRemediationItemsBySourceRequest,
  QueryRemediationNodeActionsRequest,
  QueryRemediationOrderByIdRequest,
  QueryRemediationOrderListRequest,
  QueryRemediationOverviewSummaryRequest,
  QueryRemediationSummaryRequest,
  ReconcileRemediationItemRequest,
  ResolveRemediationNodeAgentsRequest,
  RequestWithOptionalId,
  UpdateRemediationOrderRequest,
  UpsertRemediationDraftItemsRequest,
} from "./types"

interface ApiResult<T> {
  data: T | null
}

const REMEDIATION_PATHS = {
  resolveNodeAgents: "/sensor/graph/remediation/node-agents/resolve",
  nodeActions: "/sensor/workflow/remediation/node/actions/query",
  orderCreate: "/sensor/remediation/order/create",
  orderGetOrCreateBySource: "/sensor/remediation/order/source/get-or-create",
  orderDraftItemsUpsert: "/sensor/remediation/order/draft/items/upsert",
  orderDraftItemDelete: "/sensor/remediation/order/draft/item/delete",
  orderUpdate: "/sensor/remediation/order/update",
  orderDelete: "/sensor/remediation/order/delete",
  orderQuery: "/sensor/remediation/order/query",
  editableOrderQuery: "/sensor/remediation/order/editable/query",
  orderListQuery: "/sensor/remediation/order/list/query",
  orderCancel: "/sensor/remediation/order/cancel",
  orderPrepare: "/sensor/remediation/order/prepare",
  orderConfirm: "/sensor/remediation/order/confirm",
  itemReconcile: "/sensor/remediation/item/reconcile",
  itemsByAgentQuery: "/sensor/remediation/items/agent/query",
  itemsBySourceQuery: "/sensor/remediation/items/source/query",
  summaryQuery: "/sensor/remediation/summary/query",
  overviewSummaryQuery: "/sensor/remediation/overview/summary/query",
} as const

function withRequestId<T extends { request_id: string }>(
  params: RequestWithOptionalId<T>,
): T {
  return {
    ...params,
    request_id: params.request_id?.trim() || createUuidRequestId(),
  } as T
}

async function postData(path: string, payload: unknown) {
  const result = (await http.post(path, payload)) as ApiResult<unknown>
  return result.data
}

export async function queryRemediationNodeActions(
  params: RequestWithOptionalId<QueryRemediationNodeActionsRequest>,
) {
  return normalizeRemediationNodeActionsResult(
    await postData(REMEDIATION_PATHS.nodeActions, withRequestId(params)),
  )
}

export async function resolveRemediationNodeAgents(
  params: RequestWithOptionalId<ResolveRemediationNodeAgentsRequest>,
) {
  return normalizeResolveRemediationNodeAgents(
    await postData(REMEDIATION_PATHS.resolveNodeAgents, withRequestId(params)),
  )
}

export async function createRemediationOrder(
  params: RequestWithOptionalId<CreateRemediationOrderRequest>,
) {
  return normalizeRemediationOrder(
    await postData(REMEDIATION_PATHS.orderCreate, withRequestId(params)),
  )
}

export async function getOrCreateRemediationOrderBySource(
  params: RequestWithOptionalId<GetOrCreateRemediationOrderBySourceRequest>,
) {
  return normalizeRemediationOrder(
    await postData(REMEDIATION_PATHS.orderGetOrCreateBySource, withRequestId(params)),
  )
}

export async function upsertRemediationDraftItems(
  params: RequestWithOptionalId<UpsertRemediationDraftItemsRequest>,
) {
  return normalizeRemediationDraftItemsUpsertData(
    await postData(REMEDIATION_PATHS.orderDraftItemsUpsert, withRequestId(params)),
  )
}

export async function deleteRemediationDraftItem(
  params: RequestWithOptionalId<DeleteRemediationDraftItemRequest>,
) {
  return normalizeRemediationOrder(
    await postData(REMEDIATION_PATHS.orderDraftItemDelete, withRequestId(params)),
  )
}

export async function updateRemediationOrder(
  params: RequestWithOptionalId<UpdateRemediationOrderRequest>,
) {
  return normalizeRemediationOrder(
    await postData(REMEDIATION_PATHS.orderUpdate, withRequestId(params)),
  )
}

export async function deleteRemediationOrder(
  params: RequestWithOptionalId<DeleteRemediationOrderRequest>,
) {
  return normalizeRemediationOrder(
    await postData(REMEDIATION_PATHS.orderDelete, withRequestId(params)),
  )
}

export async function queryRemediationOrderById(
  params: RequestWithOptionalId<QueryRemediationOrderByIdRequest>,
) {
  return normalizeRemediationOrder(
    await postData(REMEDIATION_PATHS.orderQuery, withRequestId(params)),
  )
}

export async function queryEditableRemediationOrderBySource(
  params: RequestWithOptionalId<QueryEditableRemediationOrderBySourceRequest>,
) {
  return normalizeRemediationOrder(
    await postData(REMEDIATION_PATHS.editableOrderQuery, withRequestId(params)),
  )
}

export async function queryRemediationOrderList(
  params: RequestWithOptionalId<QueryRemediationOrderListRequest>,
) {
  return normalizeRemediationOrderList(
    await postData(REMEDIATION_PATHS.orderListQuery, withRequestId(params)),
  )
}

export async function cancelRemediationOrder(
  params: RequestWithOptionalId<CancelRemediationOrderRequest>,
) {
  return normalizeRemediationOrder(
    await postData(REMEDIATION_PATHS.orderCancel, withRequestId(params)),
  )
}

export async function prepareRemediationOrder(
  params: RequestWithOptionalId<PrepareRemediationOrderRequest>,
) {
  return normalizeRemediationOrder(
    await postData(REMEDIATION_PATHS.orderPrepare, withRequestId(params)),
  )
}

export async function confirmRemediationOrder(
  params: RequestWithOptionalId<ConfirmRemediationOrderRequest>,
) {
  return normalizeRemediationOrder(
    await postData(REMEDIATION_PATHS.orderConfirm, withRequestId(params)),
  )
}

export async function reconcileRemediationItem(
  params: RequestWithOptionalId<ReconcileRemediationItemRequest>,
) {
  return normalizeRemediationOrder(
    await postData(REMEDIATION_PATHS.itemReconcile, withRequestId(params)),
  )
}

export async function queryRemediationItemsByAgentId(
  params: RequestWithOptionalId<QueryRemediationItemsByAgentIdRequest>,
) {
  return normalizeRemediationItemList(
    await postData(REMEDIATION_PATHS.itemsByAgentQuery, withRequestId(params)),
  )
}

export async function queryRemediationItemsBySource(
  params: RequestWithOptionalId<QueryRemediationItemsBySourceRequest>,
) {
  return normalizeRemediationItemList(
    await postData(REMEDIATION_PATHS.itemsBySourceQuery, withRequestId(params)),
  )
}

export async function queryRemediationSummary(
  params: RequestWithOptionalId<QueryRemediationSummaryRequest>,
) {
  return normalizeRemediationSummary(
    await postData(REMEDIATION_PATHS.summaryQuery, withRequestId(params)),
  )
}

export async function queryRemediationOverviewSummary(
  params: RequestWithOptionalId<QueryRemediationOverviewSummaryRequest> = {},
) {
  return normalizeRemediationOverviewSummary(
    await postData(REMEDIATION_PATHS.overviewSummaryQuery, withRequestId(params)),
  )
}

export { REMEDIATION_PATHS }
