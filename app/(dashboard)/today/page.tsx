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
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { dateLabel, tasks } = await getTodayPayload(supabase, user.id);

  return (
    <TodayDashboard
      user={{
        name: getDisplayName(user.user_metadata, user.email),
        email: user.email || "",
      }}
      dateLabel={dateLabel}
      initialTasks={tasks}
    />
  );
}
