"use server";

import { getDashboardSession } from "@/lib/features/dashboard/session";
import { getCalendarEvents } from "@/lib/features/calendar/server";
import { getTodayPayload } from "./server";

export async function fetchTodayPayloadAction() {
  const { supabase, userId } = await getDashboardSession();
  const [payload, calendar] = await Promise.all([
    getTodayPayload(supabase, userId),
    getCalendarEvents(supabase, userId),
  ]);
  return { ...payload, calendar };
}
