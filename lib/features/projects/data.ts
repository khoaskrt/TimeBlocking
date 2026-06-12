import type { Area } from "@/lib/types";

export type ProjectEntryType = "project" | "area";
export type ProjectEngagement = "project" | "retainer";
export type ProjectRoute =
  | { view: "list" }
  | { view: "entry"; id: string }
  | { view: "new"; type?: ProjectEntryType }
  | { view: "templates" };

export type ProjectMilestone = {
  id: string;
  label: string;
  weight: number;
  done: boolean;
};

export type ProjectTask = {
  id: string;
  title: string;
  done: boolean;
  due?: string;
};

export type ProjectChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  recurring?: boolean;
};

export type ProjectActivity = {
  id: string;
  when: string;
  kind: "work" | "update";
  note: string;
  hours: number;
};

export type ProjectHistoryMonth = {
  month: string;
  hours: number;
  items: { label: string; done: boolean }[];
};

export type ProjectEntry = {
  id: string;
  type: ProjectEntryType;
  engagement?: ProjectEngagement;
  name: string;
  area: Area;
  areaId?: string | null;
  color: string;
  desc: string;
  start?: string;
  target?: string;
  quoted?: number;
  monthly?: number;
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  checklist: ProjectChecklistItem[];
  activity: ProjectActivity[];
  history?: ProjectHistoryMonth[];
};

export type ProjectTemplate = {
  id: string;
  name: string;
  monthly: boolean;
  items: string[];
};

export type ProjectFormDraft = {
  type: ProjectEntryType;
  engagement: ProjectEngagement;
  name: string;
  desc: string;
  area: Area;
  areaId: string;
  color: string;
  start: string;
  target: string;
  quoted: string;
  monthly: string;
  templateId: string;
};

export const PROJECT_COLORS = [
  "#334155",
  "#0f766e",
  "#15803d",
  "#9f1239",
  "#ca8a04",
  "#7c3aed",
  "#c2410c",
  "#71717a",
];

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "tpl-web",
    name: "Website setup",
    monthly: false,
    items: [
      "Point DNS and hosting",
      "Install WordPress and Elementor",
      "Create staging environment",
      "Install analytics and Search Console",
      "Launch checklist and redirects",
    ],
  },
  {
    id: "tpl-seo",
    name: "Monthly SEO retainer",
    monthly: true,
    items: [
      "Publish monthly blog post",
      "Google Business Profile post",
      "Review rankings and analytics",
      "Build 2 local citations",
      "Send monthly report and invoice",
    ],
  },
  {
    id: "tpl-onboard",
    name: "New client onboarding",
    monthly: false,
    items: ["Kickoff call", "Collect logins and assets", "Set communication cadence", "Add to invoicing"],
  },
];

export const PROJECT_SEED: ProjectEntry[] = [
  {
    id: "hmg",
    type: "area",
    name: "Hill Media Group",
    area: "work",
    color: "#0f766e",
    desc: "Agency work. Client SEO, websites, and support projects live here.",
    milestones: [],
    tasks: [
      { id: "hmg-t1", title: "Update agency portfolio page", done: false },
      { id: "hmg-t2", title: "Send June invoices", done: false },
    ],
    checklist: [],
    activity: [{ id: "hmg-a1", when: "Jun 2, 09:10", kind: "update", note: "Moved client work into project pages.", hours: 0 }],
  },
  {
    id: "twr",
    type: "area",
    name: "Tech with Ryan",
    area: "personal",
    color: "#7c3aed",
    desc: "Content, tutorials, and community. Ongoing, no end date.",
    milestones: [],
    tasks: [{ id: "twr-t1", title: "Reply to channel comments", done: false }],
    checklist: [{ id: "twr-c1", label: "Weekly newsletter", done: false, recurring: true }],
    activity: [],
  },
  {
    id: "fetter",
    type: "project",
    engagement: "project",
    name: "Fetter Pools SEO Project",
    area: "work",
    areaId: "hmg",
    color: "#334155",
    start: "2026-05-12",
    target: "2026-06-30",
    quoted: 12,
    desc: "Elementor rebuild plus on-page SEO across all service pages.",
    milestones: [
      { id: "f-m1", label: "Initial project communication and kickoff", weight: 10, done: true },
      { id: "f-m2", label: "Elementor redesign approval", weight: 10, done: false },
      { id: "f-m3", label: "Main site pages created and approved", weight: 20, done: false },
      { id: "f-m4", label: "Service area pages complete", weight: 30, done: false },
      { id: "f-m5", label: "SEO metadata on all pages", weight: 10, done: false },
      { id: "f-m6", label: "Site launched", weight: 10, done: false },
    ],
    tasks: [{ id: "f-t1", title: "Send Ross the sitemap for sign-off", done: false, due: "Jun 16" }],
    checklist: [],
    activity: [
      {
        id: "f-a1",
        when: "May 18, 14:45",
        kind: "work",
        note: "Redesigned the site in Elementor and sent a preview for feedback.",
        hours: 2,
      },
    ],
  },
  {
    id: "grizzly",
    type: "project",
    engagement: "project",
    name: "Grizzly Home Loans SEO Project",
    area: "work",
    areaId: "hmg",
    color: "#9f1239",
    start: "2026-06-01",
    target: "",
    quoted: 10,
    desc: "New site structure and local SEO for three branch locations.",
    milestones: [
      { id: "g-m1", label: "Kickoff and hosting access", weight: 10, done: false },
      { id: "g-m2", label: "Keyword map approved", weight: 30, done: false },
      { id: "g-m3", label: "Location pages live", weight: 40, done: false },
      { id: "g-m4", label: "Review and handoff", weight: 20, done: false },
    ],
    tasks: [
      { id: "g-t1", title: "Audit existing site structure", done: false },
      { id: "g-t2", title: "Collect brand assets from client", done: false },
    ],
    checklist: [],
    activity: [],
  },
  {
    id: "blackdiamond",
    type: "project",
    engagement: "retainer",
    name: "Black Diamond Services",
    area: "work",
    areaId: "hmg",
    color: "#15803d",
    monthly: 4,
    desc: "Monthly SEO retainer: content, GBP, reporting, and support.",
    milestones: [],
    tasks: [{ id: "b-t1", title: "Fix broken contact form on /quote", done: false, due: "Jun 13" }],
    checklist: [
      { id: "b-c1", label: "Publish monthly blog post", done: true, recurring: true },
      { id: "b-c2", label: "Google Business Profile post", done: false, recurring: true },
      { id: "b-c3", label: "Review rankings and analytics", done: false, recurring: true },
      { id: "b-c4", label: "Build 2 local citations", done: false, recurring: true },
      { id: "b-c5", label: "Send monthly report and invoice", done: false, recurring: true },
    ],
    activity: [
      { id: "b-a1", when: "Jun 4, 10:12", kind: "work", note: "Published the June blog post.", hours: 1.5 },
    ],
    history: [
      {
        month: "May 2026",
        hours: 4.2,
        items: [
          { label: "Publish monthly blog post", done: true },
          { label: "Google Business Profile post", done: true },
          { label: "Review rankings and analytics", done: true },
          { label: "Build 2 local citations", done: true },
          { label: "Send monthly report and invoice", done: true },
        ],
      },
      {
        month: "April 2026",
        hours: 3.4,
        items: [
          { label: "Publish monthly blog post", done: true },
          { label: "Google Business Profile post", done: true },
          { label: "Review rankings and analytics", done: true },
          { label: "Build 2 local citations", done: false },
          { label: "Send monthly report and invoice", done: true },
        ],
      },
    ],
  },
  {
    id: "glacier",
    type: "project",
    engagement: "retainer",
    name: "Glacier Precast Concrete",
    area: "work",
    areaId: "hmg",
    color: "#c2410c",
    monthly: 3,
    desc: "Monthly content and maintenance retainer.",
    milestones: [],
    tasks: [],
    checklist: [
      { id: "gl-c1", label: "Publish monthly blog post", done: false, recurring: true },
      { id: "gl-c2", label: "Refresh product photos", done: false, recurring: true },
      { id: "gl-c3", label: "Review rankings and analytics", done: false, recurring: true },
      { id: "gl-c4", label: "Send monthly report and invoice", done: false, recurring: true },
    ],
    activity: [],
    history: [{ month: "May 2026", hours: 2.9, items: [{ label: "Publish monthly blog post", done: true }] }],
  },
];
