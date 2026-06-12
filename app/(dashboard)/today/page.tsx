import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTodayPayload } from "@/lib/features/today/server";
import { TodayDashboard } from "./today-dashboard";

function getDisplayName(metadata: Record<string, unknown>, email?: string) {
  const fullName = metadata.full_name;
  const name = metadata.name;

  if (typeof fullName === "string" && fullName.trim()) return fullName;
  if (typeof name === "string" && name.trim()) return name;
  return email?.split("@")[0] || "ReSolve User";
}

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login");

  const { dateLabel, tasks, routines } = await getTodayPayload(supabase, session.user.id);

  return <TodayDashboard dateLabel={dateLabel} initialTasks={tasks} initialRoutines={routines} />;
}
