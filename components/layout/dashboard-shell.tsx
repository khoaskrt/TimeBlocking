"use client";

import { usePathname } from "next/navigation";
import { Sidebar, type SidebarUser } from "./sidebar";
import { MobileTabBar } from "./mobile-tab-bar";

type ActiveRoute = "today" | "tasks" | "projects" | "routines" | "people" | "library";

function getActiveRoute(pathname: string): ActiveRoute {
  if (pathname.startsWith("/tasks")) return "tasks";
  if (pathname.startsWith("/projects")) return "projects";
  if (pathname.startsWith("/routines")) return "routines";
  if (pathname.startsWith("/people")) return "people";
  if (pathname.startsWith("/library")) return "library";
  return "today";
}

export function DashboardShell({ user, children }: { user: SidebarUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = getActiveRoute(pathname);

  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-50 font-[family-name:var(--font-inter)]">
      <Sidebar active={active} user={user} />
      {children}
      <MobileTabBar active={active} />
    </div>
  );
}
