import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTasksPayload } from "@/lib/features/tasks/server";
import { TasksDashboard } from "./tasks-dashboard";

function getDisplayName(metadata: Record<string, unknown>, email?: string) {
  const fullName = metadata.full_name;
  const name = metadata.name;

  if (typeof fullName === "string" && fullName.trim()) return fullName;
  if (typeof name === "string" && name.trim()) return name;
  return email?.split("@")[0] || "ReSolve User";
}

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const tasksPayload = await getTasksPayload(supabase, user.id);

  return (
    <TasksDashboard
      user={{
        name: getDisplayName(user.user_metadata, user.email),
        email: user.email || "",
      }}
      initialTasks={tasksPayload.tasks}
      areas={tasksPayload.areas}
      projects={tasksPayload.projects}
    />
  );
}
