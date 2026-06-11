import type { Routine, RoutineFrequency, RoutineGroupId } from "@/lib/types";
import { HIST_DAYS } from "./constants";
import { isScheduled } from "./derive";

const SEED: {
  id: string;
  label: string;
  group: RoutineGroupId;
  freq: RoutineFrequency;
  today: boolean;
}[] = [
  { id: "m1", label: "Review calendar", group: "morning", freq: "daily", today: true },
  { id: "m2", label: "Clear inbox to zero", group: "morning", freq: "weekdays", today: true },
  { id: "m3", label: "Set Top 3 for today", group: "morning", freq: "weekdays", today: true },
  { id: "m4", label: "Stretch 10 minutes", group: "morning", freq: "daily", today: true },
  { id: "a1", label: "Walk after lunch", group: "afternoon", freq: "daily", today: true },
  { id: "a2", label: "Client follow-ups", group: "afternoon", freq: "weekdays", today: false },
  { id: "a3", label: "Review captures inbox", group: "afternoon", freq: "mwf", today: false },
  { id: "e1", label: "Plan tomorrow", group: "evening", freq: "daily", today: false },
  { id: "e2", label: "Read 20 minutes", group: "evening", freq: "daily", today: false },
  { id: "e3", label: "Screens off by 22:30", group: "evening", freq: "daily", today: false },
];

// Deterministic pseudo-random so the history looks the same every load.
const rand = (a: number, b: number) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function buildInitialRoutines(): Routine[] {
  return SEED.map((sd, idx) => {
    const done = new Array<boolean>(HIST_DAYS).fill(false);
    done[0] = sd.today;
    for (let k = 1; k < HIST_DAYS; k++) {
      if (!isScheduled(sd.freq, k)) continue;
      if (k <= 5) {
        done[k] = true; // everyone kept the last 5 days → current streak
        continue;
      }
      done[k] = rand(idx + 1, k) > 0.13;
    }
    return { id: sd.id, label: sd.label, group: sd.group, freq: sd.freq, done };
  });
}
