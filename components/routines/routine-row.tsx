"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, X } from "lucide-react";
import { RDCheckbox } from "@/components/shared/checkbox";
import { isScheduled, routineStreak } from "@/lib/features/routines/derive";
import type { Routine } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DaySquares } from "./day-squares";
import { FreqTag } from "./freq-tag";
import { StreakFlame } from "./streak-flame";

export function RoutineRow({
  item,
  onToggle,
  onRename,
  onRemove,
}: {
  item: Routine;
  onToggle: (id: string) => void;
  onRename: (id: string, label: string) => void;
  onRemove: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.label);

  const checked = item.done[0];
  const offToday = !isScheduled(item.freq, 0);

  const commit = () => {
    onRename(item.id, draft);
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "group relative flex h-[42px] items-center gap-2.5 rounded-lg px-2 -mx-2 transition-colors hover:bg-zinc-100",
        checked ? "opacity-55" : offToday ? "opacity-45" : "opacity-100",
      )}
    >
      <RDCheckbox checked={checked} onChange={() => onToggle(item.id)} size={16} />
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(item.label);
              setEditing(false);
            }
          }}
          className="flex-1 min-w-0 rounded-md bg-zinc-100 px-2 py-1 text-[14px] text-zinc-900 outline-none border-none font-[inherit]"
        />
      ) : (
        <span
          className={cn(
            "flex-1 truncate text-[14px] text-zinc-900",
            checked && "line-through",
          )}
        >
          {item.label}
        </span>
      )}
      <FreqTag freq={item.freq} />
      <DaySquares routine={item} />
      <StreakFlame n={routineStreak(item)} />

      <span
        className={cn(
          "relative flex transition-opacity duration-100",
          menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <button
          type="button"
          aria-label="Routine menu"
          onClick={() => setMenuOpen((o) => !o)}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md p-0 text-zinc-400 cursor-pointer transition-colors",
            menuOpen ? "bg-zinc-100" : "bg-transparent hover:bg-zinc-200/60",
          )}
        >
          <MoreHorizontal size={15} strokeWidth={2} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-[calc(100%+4px)] z-[60] w-[136px] overflow-hidden rounded-[10px] border border-zinc-200 bg-white shadow-[0_12px_28px_-8px_rgba(24,24,27,0.18)] animate-in fade-in slide-in-from-bottom-1 duration-150">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setDraft(item.label);
                setEditing(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-zinc-900 cursor-pointer hover:bg-zinc-50"
            >
              <Pencil size={14} strokeWidth={1.75} className="text-zinc-500" />
              Rename
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onRemove(item.id);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-red-600 cursor-pointer hover:bg-zinc-50"
            >
              <X size={14} strokeWidth={2} />
              Delete
            </button>
          </div>
        )}
      </span>
      {menuOpen && (
        <div className="fixed inset-0 z-[55]" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
}
