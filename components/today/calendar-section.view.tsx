"use client";

import { Calendar, Video, MapPin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";

export interface CalendarViewProps {
  currentEvent: CalendarEvent | null;
  upcomingEvents: CalendarEvent[];
  allDayEvents: CalendarEvent[];
  connected: boolean;
  error?: string;
  onConnect?: () => void;
}

function formatTime(iso: string) {
  const m = /T(\d{2}):(\d{2})/.exec(iso) || /^(\d{2}):(\d{2})/.exec(iso);
  return m ? `${m[1]}:${m[2]}` : "";
}

function timeToMinutes(iso: string) {
  const m = /T(\d{2}):(\d{2})/.exec(iso) || /^(\d{2}):(\d{2})/.exec(iso);
  return m ? +m[1] * 60 + +m[2] : 0;
}

function CalHeader({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-400 whitespace-nowrap">
        {children}
      </span>
      <span className="flex-1" />
      {right}
    </div>
  );
}

function NextUpBadge() {
  return (
    <span className="text-[9.5px] font-semibold tracking-[0.07em] uppercase text-zinc-600 bg-zinc-100 rounded-[5px] px-1.5 py-px whitespace-nowrap">
      Next up
    </span>
  );
}

function EventRow({
  event,
  isNow,
  isPast,
  nextUp,
}: {
  event: CalendarEvent;
  isNow: boolean;
  isPast: boolean;
  nextUp: boolean;
}) {
  const cancelled = event.status === "cancelled";
  const tentative = event.status === "tentative";

  return (
    <div
      className={cn(
        "flex gap-2.5 min-h-[32px] py-[5px] px-2 -mx-2 rounded-lg box-border transition-[background] duration-[120ms] ease-out",
        isNow
          ? "bg-zinc-50 border border-zinc-200"
          : "hover:bg-[#FAFAFA]"
      )}
      style={{ opacity: isPast ? 0.5 : 1 }}
    >
      {/* Pulse dot column */}
      <div className="w-[7px] shrink-0 flex justify-center pt-[7px]">
        {isNow && (
          <span className="block w-[7px] h-[7px] rounded-full bg-emerald-500 animate-[calPulse_2s_cubic-bezier(.4,0,.6,1)_infinite] motion-reduce:animate-none" />
        )}
      </div>

      {/* Time */}
      <div className="w-[38px] shrink-0 text-[12px] text-zinc-400 tabular-nums pt-[1.5px]">
        {formatTime(event.startTime)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[7px] flex-wrap">
          <span
            className={cn(
              "text-[13px]",
              cancelled
                ? "text-zinc-400 line-through"
                : tentative
                  ? "text-zinc-600"
                  : "text-zinc-900",
              isNow ? "font-medium" : "font-[450]"
            )}
          >
            {event.title}
          </span>
          {event.meetLink && !cancelled && (
            <Video size={13} strokeWidth={1.75} className="text-zinc-400 shrink-0" />
          )}
          {nextUp && <NextUpBadge />}
        </div>
        {event.location && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={11} strokeWidth={1.75} className="text-zinc-400 shrink-0" />
            <span className="text-[11px] text-zinc-400">{event.location}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CalPlaceholder({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-[22px] pb-2 gap-[9px]">
      <Calendar size={20} strokeWidth={1.6} className="text-zinc-300" />
      <div className="text-[13px] text-zinc-400">{title}</div>
      {action}
    </div>
  );
}

export function CalendarView({
  currentEvent,
  upcomingEvents,
  allDayEvents,
  connected,
  error,
  onConnect,
}: CalendarViewProps) {
  // Not connected / reconnect
  if (!connected || error === "reconnect") {
    const reconnect = error === "reconnect";
    return (
      <div>
        <CalHeader>Calendar</CalHeader>
        <CalPlaceholder
          title={reconnect ? "Calendar access expired" : "See today’s events here"}
          action={
            onConnect ? (
              <button
                onClick={onConnect}
                className="text-[12px] text-zinc-500 underline underline-offset-2 cursor-pointer transition-colors duration-[120ms] hover:text-zinc-700"
              >
                {reconnect ? "Reconnect" : "Connect Google Calendar"}
              </button>
            ) : undefined
          }
        />
      </div>
    );
  }

  // Merge timed events, sort by start, classify
  const timed = [currentEvent, ...upcomingEvents]
    .filter(Boolean)
    .sort((a, b) => timeToMinutes(a!.startTime) - timeToMinutes(b!.startTime)) as CalendarEvent[];

  const count = timed.length + allDayEvents.length;
  const curStart = currentEvent ? timeToMinutes(currentEvent.startTime) : null;

  const firstFutureId = (() => {
    if (!currentEvent) return null;
    const curEnd = timeToMinutes(currentEvent.endTime);
    const f = timed.find((e) => e.id !== currentEvent.id && timeToMinutes(e.startTime) >= curEnd);
    return f ? f.id : null;
  })();

  const headerRight = (
    <a
      className="inline-flex text-zinc-400 cursor-pointer transition-colors duration-[120ms] hover:text-zinc-600"
      href="https://calendar.google.com"
      target="_blank"
      rel="noreferrer"
      title="Open Google Calendar"
    >
      <ExternalLink size={13} strokeWidth={1.75} />
    </a>
  );

  // Connected, no events
  if (count === 0 || error === "fetch_failed") {
    return (
      <div>
        <CalHeader right={headerRight}>
          Calendar {"·"} 0
        </CalHeader>
        <CalPlaceholder
          title={error === "fetch_failed" ? "Couldn’t load events" : "No events today"}
        />
      </div>
    );
  }

  // Connected, events
  return (
    <div>
      <CalHeader right={headerRight}>
        Calendar {"·"} {count}
      </CalHeader>

      {allDayEvents.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {allDayEvents.map((e) => (
            <span
              key={e.id}
              className={cn(
                "text-[11px] bg-zinc-100 rounded-full px-[9px] py-0.5 whitespace-nowrap",
                e.status === "cancelled"
                  ? "text-zinc-400 line-through"
                  : "text-zinc-700"
              )}
            >
              {e.title}
            </span>
          ))}
        </div>
      )}

      <div className={timed.length ? "mt-1.5" : ""}>
        {timed.map((e) => {
          const isNow = currentEvent !== null && e.id === currentEvent.id;
          const isPast = !isNow && curStart != null && timeToMinutes(e.endTime) <= curStart;
          return (
            <EventRow
              key={e.id}
              event={e}
              isNow={isNow}
              isPast={isPast}
              nextUp={e.id === firstFutureId}
            />
          );
        })}
      </div>
    </div>
  );
}
