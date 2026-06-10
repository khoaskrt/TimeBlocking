import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoginButton } from "./login-button";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="bg-white border border-zinc-200 rounded-xl p-10 w-full max-w-sm text-center space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">ReSolve</h1>
          <p className="text-sm text-zinc-500 mt-1">Your personal time dashboard</p>
        </div>
        <LoginButton />
      </div>
    </div>
  );
}
