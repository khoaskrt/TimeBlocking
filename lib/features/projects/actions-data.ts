"use server";

import { getDashboardSession } from "@/lib/features/dashboard/session";
import { getProjectsPayload } from "./server";

export async function fetchProjectsPayloadAction() {
  const { supabase, userId } = await getDashboardSession();
  return getProjectsPayload(supabase, userId);
}
