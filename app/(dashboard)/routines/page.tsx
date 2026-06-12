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
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const routines = await getRoutinesPayload(supabase, user.id);

  return (
    <RoutinesDashboard
      user={{
        name: getDisplayName(user.user_metadata, user.email),
        email: user.email || "",
      }}
      initialRoutines={routines}
    />
  );
}
