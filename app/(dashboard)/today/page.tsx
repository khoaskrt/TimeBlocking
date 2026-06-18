import { Suspense } from "react";
import { getDashboardSession } from "@/lib/features/dashboard/session";
import { getTodayPayload } from "@/lib/features/today/server";
import { getCalendarEvents } from "@/lib/features/calendar/server";
import TodayLoading from "./loading";
import { TodayDashboard } from "./today-dashboard";

async function TodayPageContent() {
  const { supabase, userId } = await getDashboardSession();
  const [{ dateLabel, tasks, routines, monthlyServices, staleProjects, yearGoals, yearGoalAreas, yearGoalProjects }, calendar] = await Promise.all([
    getTodayPayload(supabase, userId),
    getCalendarEvents(supabase, userId),
  ]);

  return (
    <TodayDashboard
      dateLabel={dateLabel}
      initialTasks={tasks}
      initialRoutines={routines}
      monthlyServices={monthlyServices}
      staleProjects={staleProjects}
      initialYearGoals={yearGoals}
      yearGoalAreas={yearGoalAreas}
      yearGoalProjects={yearGoalProjects}
      calendar={calendar}
    />
  );
}

export default function TodayPage() {
  return (
    <Suspense fallback={<TodayLoading />}>
      <TodayPageContent />
    </Suspense>
  );
}
