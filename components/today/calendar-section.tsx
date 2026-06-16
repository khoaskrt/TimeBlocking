"use client";

import { createClient } from "@/lib/supabase/client";
import type { CalendarEvent } from "@/lib/types";
import { CalendarView } from "./calendar-section.view";

export interface CalendarSectionProps {
  events: CalendarEvent[];
  connected: boolean;
  error?: string;
}

function isCurrentEvent(event: CalendarEvent): boolean {
  if (event.allDay) return false;
  const now = Date.now();
  return new Date(event.startTime).getTime() <= now && new Date(event.endTime).getTime() > now;
}

export function CalendarSection({ events, connected, error }: CalendarSectionProps) {
  const allDayEvents = events.filter((e) => e.allDay);
  const timedEvents = events.filter((e) => !e.allDay);
  const now = Date.now();

  const currentEvent = timedEvents.find(isCurrentEvent) || null;
  const upcomingEvents = timedEvents.filter((e) => e !== currentEvent);

  const pastEvents = upcomingEvents.filter((e) => new Date(e.endTime).getTime() <= now);
  const futureEvents = upcomingEvents.filter((e) => new Date(e.endTime).getTime() > now);

  async function handleConnect() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "https://www.googleapis.com/auth/calendar.readonly",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  }

  return (
    <CalendarView
      currentEvent={currentEvent}
      upcomingEvents={[...pastEvents, ...futureEvents]}
      allDayEvents={allDayEvents}
      connected={connected}
      error={error}
      onConnect={handleConnect}
    />
  );
}
