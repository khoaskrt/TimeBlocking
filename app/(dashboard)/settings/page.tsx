import { getDashboardSession } from "@/lib/features/dashboard/session";
import { SettingsDashboard } from "./settings-dashboard";

export default async function SettingsPage() {
  const { user } = await getDashboardSession();

  return <SettingsDashboard user={user} />;
}
