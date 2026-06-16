"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CalendarEvent } from "@/lib/types";
import { CalendarView } from "./calendar-section.view";

export interface CalendarSectionProps {
  events: CalendarEvent[];
  connected: boolean;
  error?: string;
}

function isCurrentEvent(event: CalendarEvent, now: number): boolean {
  if (event.allDay) return false;
  return new Date(event.startTime).getTime() <= now && new Date(event.endTime).getTime() > now;
}

export function CalendarSection({ events, connected, error }: CalendarSectionProps) {
  const [now, setNow] = useState<number | null>(null);
  const allDayEvents = events.filter((e) => e.allDay);
  const timedEvents = events.filter((e) => !e.allDay);

  useEffect(() => {
    const updateNow = () => setNow(Date.now());
    updateNow();
    const interval = window.setInterval(updateNow, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const currentEvent = now === null ? null : timedEvents.find((event) => isCurrentEvent(event, now)) || null;
  const upcomingEvents = timedEvents.filter((e) => e !== currentEvent);

  const pastEvents = now === null ? [] : upcomingEvents.filter((e) => new Date(e.endTime).getTime() <= now);
  const futureEvents = now === null ? upcomingEvents : upcomingEvents.filter((e) => new Date(e.endTime).getTime() > now);

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
