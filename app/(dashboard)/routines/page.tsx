import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRoutinesPayload } from "@/lib/features/routines/server";
import { RoutinesDashboard } from "./routines-dashboard";

function getDisplayName(metadata: Record<string, unknown>, email?: string) {
  const fullName = metadata.full_name;
  const name = metadata.name;

  if (typeof fullName === "string" && fullName.trim()) return fullName;
  if (typeof name === "string" && name.trim()) return name;
  return email?.split("@")[0] || "ReSolve User";
}

export default async function RoutinesPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login");

  const routines = await getRoutinesPayload(supabase, session.user.id);

  return <RoutinesDashboard initialRoutines={routines} />;
}
