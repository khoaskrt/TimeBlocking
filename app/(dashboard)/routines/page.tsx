import { Suspense } from "react";
import { getDashboardSession } from "@/lib/features/dashboard/session";
import { getRoutinesPayload } from "@/lib/features/routines/server";
import RoutinesLoading from "./loading";
import { RoutinesDashboard } from "./routines-dashboard";

async function RoutinesPageContent() {
  const { supabase, userId } = await getDashboardSession();
  const routines = await getRoutinesPayload(supabase, userId);

  return <RoutinesDashboard initialRoutines={routines} />;
}

export default function RoutinesPage() {
  return (
    <Suspense fallback={<RoutinesLoading />}>
      <RoutinesPageContent />
    </Suspense>
  );
}
