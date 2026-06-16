import type { CalendarEvent } from "@/lib/types";

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  status?: string;
  location?: string;
  hangoutLink?: string;
  organizer?: { displayName?: string };
  conferenceData?: {
    entryPoints?: Array<{ entryPointType: string; uri: string }>;
  };
}

export function normalizeGoogleEvent(event: GoogleCalendarEvent): CalendarEvent {
  const allDay = !event.start.dateTime;
  const meetLink =
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri;

  return {
    id: event.id,
    title: event.summary || "(No title)",
    startTime: event.start.dateTime || event.start.date || "",
    endTime: event.end.dateTime || event.end.date || "",
    allDay,
    location: event.location,
    status: (event.status as CalendarEvent["status"]) || "confirmed",
    meetLink,
  };
}
