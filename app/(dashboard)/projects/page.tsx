import { Suspense } from "react";
import { ProjectsDashboard } from "@/components/projects/projects-dashboard";
import { getDashboardSession } from "@/lib/features/dashboard/session";
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

async function ProjectsPageContent() {
  const { supabase, userId } = await getDashboardSession();
  const initialPayload = await getProjectsPayload(supabase, userId);

  return (
    <ProjectsDashboard
      initialPayload={initialPayload}
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

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsLoading />}>
      <ProjectsPageContent />
    </Suspense>
  );
}
