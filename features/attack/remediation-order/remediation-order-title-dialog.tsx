"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FilePenLine, Loader2 } from "lucide-react";
import { useLocale } from "next-intl";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import {
  MAX_REMEDIATION_ORDER_TITLE_BYTES,
  normalizeRemediationOrderTitle,
  remediationOrderTitleError,
  remediationOrderTitleLocale,
  type RemediationOrderTitleLocale,
} from "./remediation-order-title";

type RemediationOrderTitleDialogMode = "create" | "rename";

export interface RemediationOrderTitleDialogProps {
  defaultTitle: string;
  mode: RemediationOrderTitleDialogMode;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string) => void | Promise<void>;
  open: boolean;
  submitting?: boolean;
}

function copyFor(mode: RemediationOrderTitleDialogMode, locale: RemediationOrderTitleLocale) {
  if (locale === "zh") {
    return mode === "create"
      ? {
          cancel: "取消",
          description: "为这份处置草稿填写一个便于识别的名称。",
          label: "处置单名称",
          placeholder: "例如：winword.exe · 结束进程",
          submit: "创建并前往处置编排",
          title: "新建处置单",
        }
      : {
          cancel: "取消",
          description: "修改后的名称会保存到当前处置单，不会改变目标和动作。",
          label: "处置单名称",
          placeholder: "请输入处置单名称",
          submit: "保存名称",
          title: "修改处置单名称",
        };
  }

  return mode === "create"
    ? {
        cancel: "Cancel",
        description: "Give this response draft a name that is easy to recognize.",
        label: "Response order name",
        placeholder: "For example: winword.exe · Terminate process",
        submit: "Create and open orchestration",
        title: "Create response order",
      }
    : {
        cancel: "Cancel",
        description: "The new name is saved on this response order without changing its targets or actions.",
        label: "Response order name",
        placeholder: "Enter a response order name",
        submit: "Save name",
        title: "Rename response order",
      };
}

export function RemediationOrderTitleDialog({
  defaultTitle,
  mode,
  onOpenChange,
  onSubmit,
  open,
  submitting = false,
}: RemediationOrderTitleDialogProps) {
  const locale = remediationOrderTitleLocale(useLocale());
  const copy = copyFor(mode, locale);
  const wasOpen = useRef(false);
  const [title, setTitle] = useState(defaultTitle);
  const titleError = remediationOrderTitleError(title, locale);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setTitle(defaultTitle);
    }
    wasOpen.current = open;
  }, [defaultTitle, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submitting) return;
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (titleError || submitting) return;
    void onSubmit(normalizeRemediationOrderTitle(title));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 shadow-2xl sm:max-w-[480px]">
        <DialogHeader className="border-b border-slate-100 px-5 py-4 pr-12">
          <DialogTitle className="flex items-center gap-3 text-base font-semibold text-slate-950">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-100">
              <FilePenLine className="size-4" aria-hidden="true" />
            </span>
            {copy.title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-xs leading-5 text-slate-500">
            {copy.description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-5">
            <Label
              htmlFor="remediation-order-title"
              className="text-xs font-semibold text-slate-700"
            >
              {copy.label}
              <span className="ml-1 text-rose-600" aria-hidden="true">*</span>
            </Label>
            <Input
              autoFocus
              id="remediation-order-title"
              maxLength={MAX_REMEDIATION_ORDER_TITLE_BYTES}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={copy.placeholder}
              aria-invalid={Boolean(titleError)}
              aria-describedby="remediation-order-title-help"
              disabled={submitting}
              className="mt-2 h-11 border-slate-300 bg-white text-sm text-slate-900 shadow-none focus-visible:ring-teal-500"
            />
            <p
              id="remediation-order-title-help"
              className={
                titleError
                  ? "mt-2 text-xs text-rose-600"
                  : "mt-2 text-xs text-slate-500"
              }
              role={titleError ? "alert" : undefined}
            >
              {titleError ||
                (locale === "zh"
                  ? `最多 ${MAX_REMEDIATION_ORDER_TITLE_BYTES} 个字节`
                  : `${MAX_REMEDIATION_ORDER_TITLE_BYTES} bytes max`)}
            </p>
          </div>

          <DialogFooter className="gap-2 border-t border-slate-100 px-5 py-4 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              className="border-slate-300"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              {copy.cancel}
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 text-white hover:bg-teal-700"
              disabled={Boolean(titleError) || submitting}
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {copy.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
