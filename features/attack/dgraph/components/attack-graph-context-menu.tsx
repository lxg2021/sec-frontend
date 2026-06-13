"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/shared/lib/utils";

import type {
  AttackGraphMenuContext,
  AttackGraphMenuGroup,
} from "../model/attack-graph-menu-types";

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
      }
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

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[220px] overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 text-slate-800 shadow-xl"
      data-attack-graph-context-menu="true"
      role="menu"
      style={{
        left: menu.x,
        top: menu.y,
      }}
    >
      {menu.groups.map((group, groupIndex) => (
        <div key={group.id} role="group">
          {groupIndex > 0 ? <div className="-mx-1 my-1 h-px bg-slate-100" /> : null}
          {group.label ? (
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {group.label}
            </div>
          ) : null}
          {group.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 focus:bg-slate-100 focus:text-slate-950 focus:outline-none",
                item.danger ? "text-red-600 hover:text-red-700" : "",
              )}
              disabled={item.disabled}
              onClick={() => {
                void item.action(menu.context);
                onClose();
              }}
              role="menuitem"
            >
              {item.icon ? (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {item.icon}
                </span>
              ) : null}
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
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

