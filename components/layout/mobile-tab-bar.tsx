"use client";

import Link from "next/link";
import {
  Home, CheckSquare, Sunrise, Users, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "today", label: "Today", icon: Home, href: "/today" },
  { id: "tasks", label: "Tasks", icon: CheckSquare, href: "/tasks" },
  { id: "routines", label: "Routines", icon: Sunrise, href: "/routines" },
  { id: "people", label: "People", icon: Users, href: "/today" },
  { id: "library", label: "Library", icon: BookOpen, href: "/today" },
];

export function MobileTabBar({ active = "today" }: { active?: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-zinc-100 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur md:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === active;
        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1 text-[10px] font-medium transition-colors",
              isActive ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-700",
            )}
          >
            <Icon size={21} strokeWidth={isActive ? 2 : 1.7} />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
