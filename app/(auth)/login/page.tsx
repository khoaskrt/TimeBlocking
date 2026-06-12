import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoginButton } from "@/components/shared/login-button";
import { APP_BRAND_NAME } from "@/lib/constants/brand";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await searchParams;

  if (user) redirect("/today");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[340px] flex flex-col items-center text-center">
        <div className="mb-6">
          <span className="text-[28px] font-bold tracking-tight select-none">
            Time<span className="text-zinc-400">Blocking</span>
          </span>
        </div>

        <h1 className="text-[22px] font-bold tracking-tight leading-tight">
          Make Each Day Counts
        </h1>
        <p className="text-[22px] font-bold tracking-tight leading-tight text-zinc-400">
          Log in to your {APP_BRAND_NAME} account
        </p>

        {error === "auth_failed" && (
          <p className="mt-4 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Sign in failed. Please try again.
          </p>
        )}

        <div className="w-full mt-9">
          <LoginButton />
        </div>

        <p className="mt-8 text-xs leading-relaxed text-zinc-400 text-pretty">
          By continuing, you agree to {APP_BRAND_NAME}&apos;s{" "}
          <a href="#" className="text-zinc-500 underline underline-offset-2 hover:text-zinc-900">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-zinc-500 underline underline-offset-2 hover:text-zinc-900">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
