import { describe, expect, it } from "vitest";

import type {
  RemediationItemExecution,
  RemediationOrderItem,
} from "@/features/attack/remediation-order";

import {
  activeDispatchSkipPresentation,
  itemStatusPresentation,
  resultPresentation,
} from "./remediation-case-execution-panel";

function item(reasonCode: string) {
  return {
    status: "skipped",
    reason_code: reasonCode,
    error_code: "",
    uncertainty_since_at: "",
    execution: null,
  } as RemediationOrderItem;
}

function executionItem(
  executionStatus: string,
  publishAcceptanceUnknown = false,
) {
  return {
    status: "pending",
    reason_code: "",
    error_code: "",
    uncertainty_since_at: "",
    execution: {
      execution_status: executionStatus,
      publish_acceptance_unknown: publishAcceptanceUnknown,
      failure_certainty: "",
    } as RemediationItemExecution,
  } as RemediationOrderItem;
}

describe("activeDispatchSkipPresentation", () => {
  it("explains an existing in-progress target Dispatch without calling it a failure", () => {
    expect(activeDispatchSkipPresentation(item("ACTIVE_DISPATCH_IN_PROGRESS"))).toMatchObject({
      label: "未重复下发",
      result: "未重复下发",
    });
  });

  it("explains a published Dispatch with an unconfirmed result without claiming a terminal receipt", () => {
    expect(activeDispatchSkipPresentation(item("ACTIVE_DISPATCH_UNCERTAIN"))).toMatchObject({
      label: "未重复下发",
      result: "未重复下发",
    });
  });

  it("localizes an existing Dispatch reason for the English execution table", () => {
    expect(
      activeDispatchSkipPresentation(
        item("ACTIVE_DISPATCH_UNCERTAIN"),
        "en",
      ),
    ).toMatchObject({
      label: "Not Redispatched",
      result: "Not Redispatched",
      reason:
        "A dispatch already exists for this target; the endpoint result is awaiting confirmation.",
    });
  });

  it("does not change ordinary skipped Items", () => {
    expect(activeDispatchSkipPresentation(item("SATISFIED_AT_DISPATCH"))).toBeNull();
  });
});

describe("itemStatusPresentation", () => {
  it("shows an accepted assignment as waiting for execution instead of pending dispatch", () => {
    expect(itemStatusPresentation(executionItem("accepted"), "zh-CN").label).toBe(
      "已接收，等待执行",
    );
    expect(itemStatusPresentation(executionItem("accepted"), "en").label).toBe(
      "Accepted, Awaiting Execution",
    );
  });

  it("shows an unknown publish acceptance as unconfirmed delivery instead of failure", () => {
    expect(itemStatusPresentation(executionItem("pending", true), "zh-CN").label).toBe(
      "投递状态待确认",
    );
    expect(itemStatusPresentation(executionItem("pending", true), "en").label).toBe(
      "Delivery Unconfirmed",
    );
  });

  it("describes a report timeout as an unconfirmed terminal result instead of an execution failure", () => {
    const reportTimeoutItem = {
      status: "failed",
      reason_code: "REPORT_TIMEOUT",
      reason_message: "",
      error_code: "",
      error_message: "",
      uncertainty_since_at: "",
      execution: null,
    } as RemediationOrderItem;

    expect(itemStatusPresentation(reportTimeoutItem, "en").label).toBe(
      "Report Timed Out",
    );
    expect(resultPresentation(reportTimeoutItem, "en")).toMatchObject({
      result: "No Final Result Received",
      reason:
        "The remediation request was accepted, but no final Agent result was received before the reporting deadline.",
    });
  });
});

describe("resultPresentation localization", () => {
  it("localizes the authoritative success reason in both languages", () => {
    const successItem = {
      status: "success",
      reason_code: "AUTHORITATIVE_SUCCESS",
      reason_message: "Authoritative Report confirmed the remediation effect",
      error_code: "",
      error_message: "",
      uncertainty_since_at: "",
      execution: null,
    } as RemediationOrderItem;

    expect(resultPresentation(successItem, "zh-CN")).toMatchObject({
      result: "执行结果已确认",
      reason: "终端权威回执已确认处置生效。",
    });
    expect(resultPresentation(successItem, "en")).toMatchObject({
      result: "Execution Result Confirmed",
      reason:
        "Authoritative report confirmed that the remediation effect was applied.",
    });
  });

  it("keeps the mitigation error code while localizing the WMI restore failure", () => {
    const failedItem = {
      status: "failed",
      reason_code: "MITIGATION_ERROR_13101",
      reason_message:
        "restore WMI subscription backup failed, win32_error=2147943706, detail=表明两个修订级别是不兼容的。",
      error_code: "MITIGATION_ERROR_13101",
      error_message:
        "restore WMI subscription backup failed, win32_error=2147943706, detail=表明两个修订级别是不兼容的。",
      uncertainty_since_at: "",
      execution: null,
    } as RemediationOrderItem;

    expect(resultPresentation(failedItem, "zh-CN")).toMatchObject({
      code: "MITIGATION_ERROR_13101",
      result: "执行失败",
      reason:
        "处置目标不可用，未完成处置。技术详情：恢复 WMI 订阅备份失败，Win32 错误 2147943706：两个修订级别不兼容。",
    });
    expect(resultPresentation(failedItem, "en")).toMatchObject({
      code: "MITIGATION_ERROR_13101",
      result: "Execution Failed",
      reason:
        "The remediation target was unavailable; the remediation was not completed. Technical detail: Failed to restore the WMI subscription backup; Win32 error 2147943706: The two revision levels are incompatible.",
    });
  });

  it("falls back to an unknown backend reason without dropping its details", () => {
    const unknownItem = {
      status: "failed",
      reason_code: "MITIGATION_ERROR_19999",
      reason_message: "vendor-specific diagnostic detail",
      error_code: "MITIGATION_ERROR_19999",
      error_message: "vendor-specific diagnostic detail",
      uncertainty_since_at: "",
      execution: null,
    } as RemediationOrderItem;

    expect(resultPresentation(unknownItem, "en")).toMatchObject({
      code: "MITIGATION_ERROR_19999",
      result: "Execution Failed",
      reason: "vendor-specific diagnostic detail",
    });
  });
});
