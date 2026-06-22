"use server";

import { getDashboardSession } from "@/lib/features/dashboard/session";
import { getTasksPayload } from "./server";

export async function fetchTasksPayloadAction() {
  const { supabase, userId } = await getDashboardSession();
  return getTasksPayload(supabase, userId);
}
