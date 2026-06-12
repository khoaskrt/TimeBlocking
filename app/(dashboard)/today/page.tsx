import { Suspense } from "react";
import { getDashboardSession } from "@/lib/features/dashboard/session";
import { getTodayPayload } from "@/lib/features/today/server";
import TodayLoading from "./loading";
import { TodayDashboard } from "./today-dashboard";

async function TodayPageContent() {
  const { supabase, userId } = await getDashboardSession();
  const { dateLabel, tasks, routines } = await getTodayPayload(supabase, userId);

  return <TodayDashboard dateLabel={dateLabel} initialTasks={tasks} initialRoutines={routines} />;
}

export default function TodayPage() {
  return (
    <Suspense fallback={<TodayLoading />}>
      <TodayPageContent />
    </Suspense>
  );
}
