import { cache } from "react";
import { redirect } from "next/navigation";
import { APP_DEFAULT_USER_NAME } from "@/lib/constants/brand";
import { createClient } from "@/lib/supabase/server";

function getDisplayName(metadata: Record<string, unknown>, email?: string) {
  const fullName = metadata.full_name;
  const name = metadata.name;

  if (typeof fullName === "string" && fullName.trim()) return fullName;
  if (typeof name === "string" && name.trim()) return name;
  return email?.split("@")[0] || APP_DEFAULT_USER_NAME;
}

export const getDashboardSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return {
    supabase,
    userId: user.id,
    user: {
      name: getDisplayName(user.user_metadata, user.email),
      email: user.email || "",
    },
  };
});
