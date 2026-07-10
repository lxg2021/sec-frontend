"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";

import type {
  AttackGraphMenuContext,
  AttackGraphMenuGroup,
  AttackGraphMenuItem,
} from "../model/menu/attack-graph-menu-types";

const CONTEXT_MENU_VIEWPORT_GUTTER = 8;

interface AttackGraphContextMenuPosition {
  left: number;
  originX: number;
  originY: number;
  top: number;
}

export interface AttackGraphContextMenuState {
  context: AttackGraphMenuContext;
  groups: AttackGraphMenuGroup[];
  x: number;
  y: number;
}

export function AttackGraphContextMenu({
  menu,
  onClose,
}: {
  menu: AttackGraphContextMenuState | null;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] =
    useState<AttackGraphContextMenuPosition | null>(null);

  useLayoutEffect(() => {
    if (!menu || !menuRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!menuRef.current) {
        return;
      }

      const bounds = menuRef.current.getBoundingClientRect();
      const maxLeft = Math.max(
        CONTEXT_MENU_VIEWPORT_GUTTER,
        window.innerWidth - bounds.width - CONTEXT_MENU_VIEWPORT_GUTTER,
      );
      const maxTop = Math.max(
        CONTEXT_MENU_VIEWPORT_GUTTER,
        window.innerHeight - bounds.height - CONTEXT_MENU_VIEWPORT_GUTTER,
      );

      setPosition({
        left: Math.min(
          Math.max(menu.x, CONTEXT_MENU_VIEWPORT_GUTTER),
          maxLeft,
        ),
        originX: menu.x,
        originY: menu.y,
        top: Math.min(
          Math.max(menu.y, CONTEXT_MENU_VIEWPORT_GUTTER),
          maxTop,
        ),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [menu]);

  useEffect(() => {
    if (!menu) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        menuRef.current.contains(event.target)
      ) {
        return;
      }
      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        return;
      }

      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLButtonElement>(
          '[role="menuitem"]:not(:disabled)',
        ) ?? [],
      );
      if (items.length === 0) {
        return;
      }

      event.preventDefault();
      const currentIndex = items.findIndex(
        (item) => item === document.activeElement,
      );
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? items.length - 1
            : event.key === "ArrowUp"
              ? currentIndex <= 0
                ? items.length - 1
                : currentIndex - 1
              : currentIndex >= items.length - 1
                ? 0
                : currentIndex + 1;

      items[nextIndex]?.focus({ preventScroll: true });
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menu, onClose]);

  if (!menu) {
    return null;
  }

  const resolvedPosition =
    position?.originX === menu.x && position.originY === menu.y
      ? position
      : { left: menu.x, top: menu.y };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 max-h-[calc(100dvh-16px)] w-[280px] max-w-[calc(100vw-16px)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 text-slate-800 shadow-xl shadow-slate-900/10"
      data-attack-graph-context-menu="true"
      role="menu"
      style={{
        left: resolvedPosition.left,
        top: resolvedPosition.top,
      }}
    >
      {menu.groups.map((group, groupIndex) => (
        <div key={group.id} role="group">
          {groupIndex > 0 ? (
            <div className="-mx-2 my-1.5 h-px bg-slate-200" />
          ) : null}
          {group.label ? (
            <div className="px-2 pb-1 pt-1 text-[11px] font-semibold text-slate-500">
              {group.label}
            </div>
          ) : null}
          {group.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "group flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left text-[13px] font-medium leading-5 text-slate-700 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-950 focus-visible:bg-slate-100 focus-visible:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent disabled:hover:text-slate-400",
                item.danger && !item.disabled ? "text-red-600 hover:text-red-700" : "",
              )}
              disabled={item.disabled}
              aria-checked={
                item.checked === undefined ? undefined : item.checked
              }
              onClick={() => {
                if (item.disabled) {
                  return;
                }
                void item.action(menu.context);
                onClose();
              }}
              role={
                item.checked === undefined ? "menuitem" : "menuitemcheckbox"
              }
            >
              {item.icon ? (
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-150",
                    getMenuIconClasses(item),
                  )}
                >
                  {item.icon}
                </span>
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block truncate">{item.label}</span>
                {item.description ? (
                  <span className="block truncate text-[11px] font-normal leading-4 text-slate-500">
                    {item.description}
                  </span>
                ) : null}
              </span>
              {item.checked ? (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              ) : null}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function getMenuIconClasses(item: AttackGraphMenuItem) {
  if (item.disabled) {
    return "bg-slate-50 text-slate-300";
  }

  switch (item.tone) {
    case "primary":
      return "bg-blue-50 text-blue-600 group-hover:bg-blue-100";
    case "success":
      return "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100";
    case "danger":
      return "bg-red-50 text-red-600 group-hover:bg-red-100";
    default:
      return "bg-slate-100 text-slate-600 group-hover:bg-slate-200";
  }
}
