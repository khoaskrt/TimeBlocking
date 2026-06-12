import { Suspense } from "react";
import { getDashboardSession } from "@/lib/features/dashboard/session";
import { getTasksPayload } from "@/lib/features/tasks/server";
import TasksLoading from "./loading";
import { TasksDashboard } from "./tasks-dashboard";

async function TasksPageContent() {
  const { supabase, userId } = await getDashboardSession();
  const tasksPayload = await getTasksPayload(supabase, userId);

  return <TasksDashboard initialTasks={tasksPayload.tasks} areas={tasksPayload.areas} projects={tasksPayload.projects} />;
}

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksLoading />}>
      <TasksPageContent />
    </Suspense>
  );
}
