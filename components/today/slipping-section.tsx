"use client";

import Link from "next/link";
import type { StaleProject } from "@/lib/types";

export interface SlippingSectionProps {
  staleProjects: StaleProject[];
}

export function SlippingSection({ staleProjects }: SlippingSectionProps) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-400">
        Slipping
      </div>
      {!staleProjects.length ? (
        <p className="mt-2.5 text-[12.5px] leading-relaxed text-zinc-400">
          Nothing slipping right now. Projects that go quiet will surface here.
        </p>
      ) : (
        <div className="mt-2.5 space-y-3">
          {staleProjects.map((project) => {
            const workMeta =
              project.kind === "retainer"
                ? "monthly"
                : `${project.openTasks} open ${project.openTasks === 1 ? "task" : "tasks"}`;

            return (
              <div key={project.id} className="min-w-0">
                <div className="truncate text-[13.5px] font-medium text-zinc-900">{project.name}</div>
                <div className="mt-0.5 text-[11px] uppercase tracking-[0.05em] text-zinc-400">
                  Quiet {project.daysAgo}d · {workMeta}
                </div>
                <div className="mt-2">
                  <Link
                    href={{ pathname: "/projects", query: { entry: project.id } }}
                    className="inline-flex h-7 items-center rounded-lg border border-zinc-200 bg-white px-2.5 text-[12px] font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
                  >
                    Review
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
