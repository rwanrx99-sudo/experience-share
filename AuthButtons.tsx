"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Props = {
  redirectTo?: string;
};

export default function AuthButtons({ redirectTo }: Props) {
  async function signIn(provider: "github" | "google") {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo ?? `${location.origin}/auth/callback`,
      },
    });
    if (error) alert(error.message);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={() => signIn("github")}
        className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
      >
        เข้าสู่ระบบด้วย GitHub
      </button>
      <button
        type="button"
        onClick={() => signIn("google")}
        className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
      >
        เข้าสู่ระบบด้วย Google
      </button>
    </div>
  );
}

