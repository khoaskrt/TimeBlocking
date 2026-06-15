import { Suspense } from "react";
import { ProjectsDashboard } from "@/components/projects/projects-dashboard";
import { getDashboardSession } from "@/lib/features/dashboard/session";
import type { ProjectRoute } from "@/lib/features/projects/data";
import { getProjectsPayload } from "@/lib/features/projects/server";
import ProjectsLoading from "./loading";
import {
  addCheck,
  addMilestone,
  addTask,
  addTemplate,
  addTemplateItem,
  createEntry,
  deleteEntry,
  loadTemplate,
  logActivity,
  removeCheck,
  removeMilestone,
  removeTemplate,
  removeTemplateItem,
  setColor,
  setEntryStatus,
  toggleCheck,
  toggleTask,
  updateMilestone,
} from "./actions";

type ProjectsPageProps = {
  searchParams: Promise<{ entry?: string | string[] | undefined }>;
};

async function ProjectsPageContent({ initialEntryId }: { initialEntryId?: string }) {
  const { supabase, userId } = await getDashboardSession();
  const initialPayload = await getProjectsPayload(supabase, userId);
  const initialRoute: ProjectRoute | undefined = initialPayload.entries.some(
    (entry) => entry.id === initialEntryId && entry.type === "project",
  )
    ? { view: "entry", id: initialEntryId! }
    : undefined;

  return (
    <ProjectsDashboard
      initialPayload={initialPayload}
      initialRoute={initialRoute}
      actions={{
        createEntry,
        setColor,
        setEntryStatus,
        deleteEntry,
        addMilestone,
        updateMilestone,
        removeMilestone,
        addCheck,
        toggleCheck,
        removeCheck,
        loadTemplate,
        addTask,
        toggleTask,
        logActivity,
        addTemplate,
        removeTemplate,
        addTemplateItem,
        removeTemplateItem,
      }}
    />
  );
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const entryParam = (await searchParams).entry;
  const initialEntryId = Array.isArray(entryParam) ? entryParam[0] : entryParam;

  return (
    <Suspense fallback={<ProjectsLoading />}>
      <ProjectsPageContent initialEntryId={initialEntryId} />
    </Suspense>
  );
}
