import { createClient } from "@/lib/supabase/server";
import { normalizeGoogleEvent } from "./data";
import type { CalendarState } from "@/lib/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("[Calendar] Token refresh failed:", res.status, errBody);
    return null;
  }

  const data = await res.json();
  return data.access_token || null;
}

function todayBounds() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return {
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
  };
}

export async function getCalendarEvents(
  supabase: SupabaseServerClient,
  userId: string,
  timeZone = "Asia/Ho_Chi_Minh"
): Promise<CalendarState> {
  const { data: tokenRow } = await supabase
    .from("user_google_tokens")
    .select("refresh_token")
    .eq("user_id", userId)
    .single();

  if (!tokenRow) return { events: [], connected: false };

  const accessToken = await refreshAccessToken(tokenRow.refresh_token);
  if (!accessToken) return { events: [], connected: false, error: "reconnect" };

  const { timeMin, timeMax } = todayBounds();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    timeZone,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });

  const url = `${GOOGLE_CALENDAR_API}?${params}`;
  console.log("[Calendar] Fetching:", url);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("[Calendar] API fetch failed:", res.status, errBody);
    if (res.status === 401) return { events: [], connected: false, error: "reconnect" };
    return { events: [], connected: true, error: "fetch_failed" };
  }

  const data = await res.json();
  const events = (data.items || [])
    .map(normalizeGoogleEvent)
    .filter((e: { status: string }) => e.status !== "cancelled");

  return { events, connected: true };
}
