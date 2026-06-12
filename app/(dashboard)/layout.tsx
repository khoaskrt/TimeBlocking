import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getDashboardSession } from "@/lib/features/dashboard/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getDashboardSession();

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
