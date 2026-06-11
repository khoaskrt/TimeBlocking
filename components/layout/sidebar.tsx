"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Home, CheckSquare, Sunrise, Users, BookOpen,
  LogOut, MoreHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type SidebarUser = {
  name: string;
  email: string;
};

const NAV_ITEMS = [
  { id: "today", label: "Today", icon: Home, href: "/today" },
  { id: "tasks", label: "Tasks", icon: CheckSquare, href: "/tasks" },
  { id: "routines", label: "Routines", icon: Sunrise, href: "/routines" },
  { id: "people", label: "People", icon: Users, href: "/today" },
  { id: "library", label: "Library", icon: BookOpen, href: "/today" },
];

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim() || "R";
  const words = source.split(/\s+/).filter(Boolean);

  if (words.length > 1) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function Sidebar({
  active = "today",
  user,
  onSignOut,
}: {
  active?: string;
  user: SidebarUser;
  onSignOut?: () => Promise<void> | void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    if (onSignOut) {
      await onSignOut();
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.assign("/login");
    }
  }

  return (
    <div className="hidden w-[220px] shrink-0 bg-sidebar md:flex flex-col p-3 font-[family-name:var(--font-inter)]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2.5 pt-1 pb-4">
        <div className="w-6 h-6 rounded-md bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-[13px] font-bold">
          R
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground">ReSolve</span>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === active;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg cursor-pointer transition-colors text-left",
                isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50"
              )}
            >
              <Icon size={16} strokeWidth={isActive ? 2 : 1.75} />
              <span className="flex-1 text-[13.5px]">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex-1" />

      <div className="h-px bg-sidebar-border my-2.5" />

      {/* Auth section */}
      <div className="relative">
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-[78]" onClick={() => setMenuOpen(false)} />
            <div className="absolute bottom-full left-0 right-0 mb-1.5 z-[80] bg-white border border-zinc-200 rounded-[10px] shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-150">
              <div className="px-3 py-2.5">
                <div className="text-[13px] font-semibold text-zinc-900">{user.name}</div>
                <div className="text-[12px] text-zinc-400 mt-px">{user.email}</div>
              </div>
              <div className="h-px bg-zinc-100" />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  void handleSignOut();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-zinc-500 cursor-pointer hover:bg-zinc-50"
              >
                <LogOut size={15} strokeWidth={1.75} />
                Sign out
              </button>
            </div>
          </>
        )}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className={cn(
            "flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-left",
            menuOpen ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50"
          )}
        >
          <span className="w-[22px] h-[22px] rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-[9px] font-semibold shrink-0">
            {getInitials(user.name, user.email)}
          </span>
          <span className="flex-1 text-[13.5px] truncate">{user.name}</span>
          <MoreHorizontal size={15} strokeWidth={2} className="text-sidebar-foreground/40" />
        </button>
      </div>
    </div>
  );
}
