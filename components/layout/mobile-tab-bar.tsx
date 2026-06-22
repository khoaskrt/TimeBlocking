"use client";

import Link from "next/link";
import {
  Home, CheckSquare, FolderKanban, Sunrise, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "today", label: "Today", icon: Home, href: "/today" },
  { id: "tasks", label: "Tasks", icon: CheckSquare, href: "/tasks" },
  { id: "projects", label: "Projects", icon: FolderKanban, href: "/projects" },
  { id: "routines", label: "Routines", icon: Sunrise, href: "/routines" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  // { id: "library", label: "Library", icon: BookOpen, href: "/today" },
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
            prefetch={true}
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
