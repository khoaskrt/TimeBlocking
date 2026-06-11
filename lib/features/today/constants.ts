export const TASK_META: Record<string, { proj?: string; flag?: string; recur?: string }> = {
  t1: { proj: "Minh Anh Co.", flag: "due today" },
  t2: { proj: "Lotus Media", recur: "monthly" },
  t3: { flag: "overdue 3d" },
  t4: { proj: "Website Redesign", flag: "due today" },
  t5: { flag: "due today" },
  t6: { flag: "overdue 2d" },
  t7: { recur: "weekly" },
};

export const ROUTINE_STREAKS: Record<string, number> = {
  r1: 12, r2: 9, r3: 14, r4: 3, r5: 6,
  r6: 4, r7: 8, r8: 5,
  r9: 11, r10: 7, r11: 2,
};

export const QUOTES = [
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "What gets measured gets managed.", author: "Peter Drucker" },
  { text: "The shorter way to do many things is to only do one thing at a time.", author: "Mozart" },
];
